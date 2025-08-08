// ✅ 示例路由 routes/merchants.js：商家接口仅限 merchant 或 admin
import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../config/db.js';
const router = express.Router();

// 当前用户查看自己的商家信息
router.get('/me', authenticate, authorize(['merchant']), async (req, res) => {
  try {
    const result = await query('SELECT * FROM merchants WHERE user_id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch merchant info' });
  }
});


// 商家申请开店 (merchant role)
router.post('/apply', authenticate, authorize(['merchant']), async (req, res) => {
  const { store_name, description } = req.body;
  try {
    // 判断是否已申请过
    const existing = await query('SELECT * FROM merchants WHERE user_id = $1', [req.user.id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Merchant application already submitted' });
    }
    const result = await query(
      'INSERT INTO merchants (user_id, store_name, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, store_name, description, 'pending']
    );
    res.status(201).json({ merchant: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to apply as merchant' });
  }
});

// admin 查看所有待审商家
router.get('/pending', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const result = await query(
      'SELECT merchants.*, users.name, users.email FROM merchants JOIN users ON merchants.user_id = users.id WHERE merchants.status = $1',
      ['pending']
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch merchant applications' });
  }
});

// admin 审核商家申请
router.patch('/:id/approve', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const { id } = req.params;
  try {
    await query('UPDATE merchants SET status = $1 WHERE id = $2', ['approved', id]);
    res.json({ message: 'Merchant approved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve merchant' });
  }
});

router.patch('/:id/reject', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  const { id } = req.params;
  try {
    await query('UPDATE merchants SET status = $1 WHERE id = $2', ['rejected', id]);
    res.json({ message: 'Merchant rejected' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject merchant' });
  }
});

// 商家查看自己状态
router.get('/me', authenticate, authorize(['merchant']), async (req, res) => {
  try {
    const result = await query('SELECT * FROM merchants WHERE user_id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch merchant info' });
  }
});




export default router;
