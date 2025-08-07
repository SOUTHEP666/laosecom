import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import pool from "../config/db.js";

const router = express.Router();

// 商家查看自己商品的所有订单
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, p.name AS product_name 
      FROM orders o 
      JOIN products p ON o.product_id = p.id 
      WHERE p.merchant_id = $1
      ORDER BY o.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "获取订单失败", error: err.message });
  }
});

export default router;
