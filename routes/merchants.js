import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = express.Router();

// -------------------- 创建商家申请 --------------------
router.post('/apply', authenticate, authorize(['merchant']), async (req, res) => {
  const { store_name, contact_name, phone, email, address, business_license, notes } = req.body;
  try {
    // 已有未处理申请
    const existingPending = await query(
      'SELECT * FROM merchant_applications WHERE user_id=$1 AND status=$2',
      [req.user.id, 'pending']
    );
    if (existingPending.rows.length > 0) {
      return res.status(400).json({ message: '已有未处理的申请' });
    }

    // 已经是正式商家
    const existingMerchant = await query('SELECT * FROM merchants WHERE user_id=$1', [req.user.id]);
    if (existingMerchant.rows.length > 0) {
      return res.status(400).json({ message: '您已成为正式商家，无法再次申请' });
    }

    const result = await query(
      `INSERT INTO merchant_applications 
      (user_id, store_name, contact_name, phone, email, address, business_license, notes, status, admin_level, admin_id, created_at, updated_at) 
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending','none', NULL, NOW(), NOW()) 
      RETURNING *`,
      [req.user.id, store_name, contact_name, phone, email, address, business_license, notes]
    );

    res.status(201).json({ application: result.rows[0] });
  } catch (err) {
    console.error('商家申请失败:', err);
    res.status(500).json({ error: '申请失败' });
  }
});

// -------------------- 获取自己申请状态 --------------------
router.get('/apply/me', authenticate, authorize(['merchant']), async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM merchant_applications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: '无申请记录' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('获取申请信息失败:', err);
    res.status(500).json({ error: '获取申请信息失败' });
  }
});

// -------------------- 获取审核状态 --------------------
router.get('/status', authenticate, authorize(['merchant']), async (req, res) => {
  try {
    const result = await query('SELECT * FROM merchants WHERE user_id=$1', [req.user.id]);
    if (result.rows.length === 0) return res.json({ status: 'no_apply' });
    return res.json({ status: 'approved', merchant: result.rows[0] });
  } catch (err) {
    console.error('获取审核状态失败:', err);
    res.status(500).json({ error: '获取审核状态失败' });
  }
});

// -------------------- 获取所有申请（带分页、搜索、状态筛选） --------------------
router.get('/apply/all', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status || '';
    const keyword = req.query.keyword || '';

    let whereClause = '1=1';
    const params = [];
    let idx = 1;

    if (status) {
      whereClause += ` AND ma.status=$${idx++}`;
      params.push(status);
    }

    if (keyword) {
      whereClause += ` AND (ma.store_name ILIKE $${idx} OR u.username ILIKE $${idx})`;
      params.push(`%${keyword}%`);
      idx++;
    }

    const result = await query(
      `SELECT ma.application_id, ma.store_name, ma.status, u.username, u.email
       FROM merchant_applications ma
       JOIN users u ON ma.user_id=u.id
       WHERE ${whereClause}
       ORDER BY ma.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset]
    );

    const countResult = await query(`SELECT COUNT(*) FROM merchant_applications ma JOIN users u ON ma.user_id=u.id WHERE ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({ total, page, limit, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取商家列表失败' });
  }
});

// -------------------- 更新申请（编辑） --------------------
router.put('/apply/:id', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { store_name, contact_name, phone, email, address, business_license, notes, status } = req.body;
  try {
    const result = await query(
      `UPDATE merchant_applications SET store_name=$1, contact_name=$2, phone=$3, email=$4, address=$5, business_license=$6, notes=$7, status=$8, updated_at=NOW()
       WHERE application_id=$9 RETURNING *`,
      [store_name, contact_name, phone, email, address, business_license, notes, status, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ message: '申请不存在' });

    // 如果状态是approved且商家不存在，则创建正式商家
    if (status === 'approved') {
      const application = result.rows[0];
      const exist = await query('SELECT * FROM merchants WHERE user_id=$1', [application.user_id]);
      if (exist.rows.length === 0) {
        await query('INSERT INTO merchants (user_id, store_name, created_at, updated_at) VALUES ($1,$2,NOW(),NOW())', [application.user_id, application.store_name]);
      }
    }

    res.json({ message: '修改成功', application: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '修改失败' });
  }
});

// -------------------- 删除申请 --------------------
router.delete('/apply/:id', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const result = await query('DELETE FROM merchant_applications WHERE application_id=$1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ message: '申请不存在' });
    res.json({ message: '删除成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '删除失败' });
  }
});

// -------------------- 修改申请状态（单独接口） --------------------
router.patch('/apply/:id/status', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { status } = req.body;
  try {
    const adminId = req.user.id;
    const adminLevel = req.user.role === 'superadmin' ? 'level2' : 'level1';

    const result = await query(
      `UPDATE merchant_applications SET status=$1, admin_id=$2, admin_level=$3, updated_at=NOW() WHERE application_id=$4 RETURNING *`,
      [status, adminId, adminLevel, id]
    );

    if (result.rowCount === 0) return res.status(404).json({ message: '申请不存在' });

    // 状态为approved，自动创建正式商家
    if (status === 'approved') {
      const application = result.rows[0];
      const exist = await query('SELECT * FROM merchants WHERE user_id=$1', [application.user_id]);
      if (exist.rows.length === 0) {
        await query('INSERT INTO merchants (user_id, store_name, created_at, updated_at) VALUES ($1,$2,NOW(),NOW())', [application.user_id, application.store_name]);
      }
    }

    res.json({ message: '状态修改成功', application: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '修改状态失败' });
  }
});

export default router;
