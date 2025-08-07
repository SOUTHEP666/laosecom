import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import pool from "../config/db.js";

const router = express.Router();

// 商家新增商品
router.post("/", authMiddleware, async (req, res) => {
  const { name, description, price, stock, image_url } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO products (merchant_id, name, description, price, stock, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [req.user.id, name, description, price, stock, image_url]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "添加商品失败", error: err.message });
  }
});

// 商家查看商品
router.get("/", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE merchant_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "获取商品失败", error: err.message });
  }
});

export default router;
