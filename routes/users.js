import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = express.Router();

// 超级管理员获取所有用户
router.get('/', authenticate, authorize(['superadmin']), async (req, res) => {
  try {
    const result = await query('SELECT id, name, email, role, avatar, created_at FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 超级管理员删除用户
router.delete('/:id', authenticate, authorize(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// 获取当前用户信息

router.get("/info", authenticate, async (req, res) => {
  try {
    const userId = req.userId; // authenticate 中间件里应该是 req.userId
    const result = await query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "用户不存在" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "服务器错误" });
  }
});


// 收货地址列表
router.get("/addresses", authenticate, async (req, res) => {
  try {
    const sql = "SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, id DESC";
    const result = await query(sql, [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "服务器错误" });
  }
});

// 新增收货地址
router.post("/addresses", authenticate, async (req, res) => {
  const { receiver_name, receiver_phone, full_address, is_default } = req.body;
  try {
    if (is_default) {
      // 取消其他默认
      await query("UPDATE addresses SET is_default = FALSE WHERE user_id = $1", [req.userId]);
    }
    const sql = `
      INSERT INTO addresses (user_id, receiver_name, receiver_phone, full_address, is_default)
      VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const result = await query(sql, [req.userId, receiver_name, receiver_phone, full_address, is_default || false]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "服务器错误" });
  }
});

// 删除收货地址
router.delete("/addresses/:id", authenticate, async (req, res) => {
  try {
    const sql = "DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING *";
    const result = await query(sql, [req.params.id, req.userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: "地址不存在或无权限删除" });
    res.json({ message: "删除成功" });
  } catch (err) {
    res.status(500).json({ message: "服务器错误" });
  }
});

// 我的订单列表
router.get("/orders", authenticate, async (req, res) => {
  try {
    const sql = "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC";
    const result = await query(sql, [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "服务器错误" });
  }
});

// 我的收藏（商品和店铺）
router.get("/favorites", authenticate, async (req, res) => {
  try {
    const sql = "SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC";
    const result = await query(sql, [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "服务器错误" });
  }
});

// 退款售后列表
router.get("/refunds", authenticate, async (req, res) => {
  try {
    const sql = `
      SELECT r.*, o.order_no 
      FROM refunds r 
      LEFT JOIN orders o ON r.order_id = o.id
      WHERE r.user_id = $1
      ORDER BY r.created_at DESC`;
    const result = await query(sql, [req.userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "服务器错误" });
  }
});

export default router;
