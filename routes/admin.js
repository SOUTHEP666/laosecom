// routes/admin.js
import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// 只允许 superadmin 访问
router.use(authenticate, authorize(['superadmin']));

/**
 * 获取用户列表（支持分页、关键词搜索和角色筛选）
 * 请求参数：page, limit, keyword, role
 * 返回：分页用户列表和总数
 */
router.get('/users', async (req, res) => {
  const { page = 1, limit = 10, keyword = '', role = '' } = req.query;
  const offset = (page - 1) * limit;

  let baseQuery = `SELECT id, username, name, email, role, is_active, created_at FROM users WHERE 1=1`;
  let countQuery = `SELECT COUNT(*) FROM users WHERE 1=1`;
  const params = [];
  const countParams = [];
  let idx = 1;

  if (keyword) {
    baseQuery += ` AND (username ILIKE $${idx} OR email ILIKE $${idx})`;
    countQuery += ` AND (username ILIKE $${idx} OR email ILIKE $${idx})`;
    params.push(`%${keyword}%`);
    countParams.push(`%${keyword}%`);
    idx++;
  }

  if (role) {
    baseQuery += ` AND role = $${idx}`;
    countQuery += ` AND role = $${idx}`;
    params.push(role);
    countParams.push(role);
    idx++;
  }

  baseQuery += ` ORDER BY id DESC LIMIT $${idx} OFFSET $${idx + 1}`;
  params.push(limit, offset);

  try {
    const dataResult = await query(baseQuery, params);
    const countResult = await query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limit);

    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages,
      data: dataResult.rows,
    });
  } catch (err) {
    console.error('获取用户列表失败:', err);
    res.status(500).json({ message: '获取用户失败' });
  }
});

/**
 * 新增用户
 * 请求体：username, name, email, password, role, is_active
 */
router.post('/users', async (req, res) => {
  const { username, name, email, password, role, is_active = true } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).json({ message: '参数不完整' });
  }
  try {
    // 检查邮箱和用户名是否已存在
    const emailExist = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailExist.rows.length > 0) {
      return res.status(400).json({ message: '邮箱已被注册' });
    }
    const usernameExist = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (usernameExist.rows.length > 0) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertSql = `
      INSERT INTO users (username, name, email, password, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username, name, email, role, is_active, created_at
    `;
    const result = await query(insertSql, [username, name || username, email, hashedPassword, role, is_active]);
    res.status(201).json({ user: result.rows[0], message: '新增成功' });
  } catch (err) {
    console.error('新增用户失败:', err);
    res.status(500).json({ message: '新增失败' });
  }
});

/**
 * 编辑用户
 * 请求参数：id（路由参数）
 * 请求体：username, name, email, password, role, is_active
 */
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, name, email, password, role, is_active } = req.body;

  try {
    // 查询用户是否存在
    const existing = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 检查用户名或邮箱是否被别的用户占用
    const userCheck = await query(
      'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id <> $3',
      [username, email, id]
    );
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: '用户名或邮箱已被占用' });
    }

    // 拼接更新SQL及参数
    const params = [username, name || username, email, role, is_active, id];
    let sql = `
      UPDATE users
      SET username = $1, name = $2, email = $3, role = $4, is_active = $5
    `;

    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      sql += `, password = $6 WHERE id = $7`;
      params.splice(5, 0, hashedPassword); // 在第6个参数插入 hashedPassword
    } else {
      sql += ` WHERE id = $6`;
    }

    await query(sql, params);

    res.json({ message: '用户更新成功' });
  } catch (err) {
    console.error('编辑用户失败:', err);
    res.status(500).json({ message: '用户更新失败' });
  }
});

/**
 * 删除用户
 * 请求参数：id（路由参数）
 */
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (req.userId === parseInt(id, 10)) {
      return res.status(400).json({ message: '不能删除自己' });
    }

    // 先删除关联的商家记录
    await query('DELETE FROM merchants WHERE user_id = $1', [id]);

    // 再删除用户
    const result = await query('DELETE FROM users WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: '用户不存在或已被删除' });
    }

    res.json({ message: '删除成功' });
  } catch (err) {
    console.error('删除用户失败:', err);
    res.status(500).json({ message: '删除失败，服务器内部错误' });
  }
});


/**
 * 启用/禁用用户
 * 请求参数：id（路由参数）
 * 请求体：is_active (boolean)
 */
router.patch('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ message: '参数错误，is_active 必须是布尔值' });
  }

  try {
    if (req.userId === parseInt(id, 10)) {
      return res.status(400).json({ message: '不能修改自己的启用状态' });
    }

    await query('UPDATE users SET is_active = $1 WHERE id = $2', [is_active, id]);
    res.json({ message: is_active ? '用户已启用' : '用户已禁用' });
  } catch (err) {
    console.error('启用/禁用用户失败:', err);
    res.status(500).json({ message: '状态更新失败' });
  }
});


// 批量删除用户
router.post('/users/batch-delete', async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: '无效的用户ID列表' });
  }
  try {
    const placeholders = ids.map(() => '?').join(',');
    await query(`DELETE FROM users WHERE id IN (${placeholders})`, ids);
    res.json({ message: '批量删除成功' });
  } catch (error) {
    console.error('批量删除失败', error);
    res.status(500).json({ message: '批量删除失败' });
  }
});



export default router;
