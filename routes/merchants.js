import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = express.Router();

// 商家申请开店（必须登录且角色为 merchant）
router.post('/apply', authenticate, authorize(['merchant']), async (req, res) => {
  const { store_name, description } = req.body;
  try {
    // 查询是否已申请
    const existing = await query('SELECT * FROM merchants WHERE user_id = $1', [req.user.id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: '你已提交过申请' });
    }
    // 插入申请记录，初始状态为 pending
    const result = await query(
      'INSERT INTO merchants (user_id, store_name, description, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
      [req.user.id, store_name, description, 'pending']
    );
    res.status(201).json({ merchant: result.rows[0] });
  } catch (err) {
    console.error('商家申请失败:', err);
    res.status(500).json({ error: '申请失败' });
  }
});

// 商家查看自己申请状态和信息
router.get('/me', authenticate, authorize(['merchant']), async (req, res) => {
  try {
    const result = await query('SELECT * FROM merchants WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: '没有找到商家信息' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('获取商家信息失败:', err);
    res.status(500).json({ error: '获取商家信息失败' });
  }
});

// 获取当前商家审核状态接口
router.get('/status', authenticate, authorize(['merchant']), async (req, res) => {
  try {
    const result = await query('SELECT status FROM merchants WHERE user_id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.json({ status: 'no_apply' }); // 未申请
    }
    return res.json({ status: result.rows[0].status }); // pending/approved/rejected
  } catch (err) {
    console.error('获取审核状态失败:', err);
    res.status(500).json({ error: '获取审核状态失败' });
  }
});

// 管理员获取所有待审核商家
router.get('/pending', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const result = await query(
      `SELECT merchants.*, users.username, users.email
       FROM merchants
       JOIN users ON merchants.user_id = users.id
       WHERE merchants.status = $1
       ORDER BY merchants.created_at DESC`,
      ['pending']
    );
    res.json(result.rows);
  } catch (err) {
    console.error('获取待审核商家失败:', err);
    res.status(500).json({ error: '获取待审核商家失败' });
  }
});

// 管理员审核商家 - 通过
router.patch('/:id/approve', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('UPDATE merchants SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', ['approved', id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: '商家申请不存在' });
    }
    res.json({ message: '审核通过' });
  } catch (err) {
    console.error('审核通过失败:', err);
    res.status(500).json({ error: '审核失败' });
  }
});

// 管理员审核商家 - 拒绝
router.patch('/:id/reject', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('UPDATE merchants SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', ['rejected', id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: '商家申请不存在' });
    }
    res.json({ message: '审核拒绝' });
  } catch (err) {
    console.error('审核拒绝失败:', err);
    res.status(500).json({ error: '审核失败' });
  }
});

export default router;
