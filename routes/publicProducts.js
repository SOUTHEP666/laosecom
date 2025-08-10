import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// 获取公开商品列表（支持分页、关键字搜索）
router.get("/", async (req, res) => {
  try {
    let { page = 1, limit = 12, keyword = "" } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(Math.max(1, Number(limit) || 12), 100); // 最大100条
    const offset = (pageNum - 1) * limitNum;

    const sql = `
      SELECT
        p.product_id,
        p.product_name,
        p.price,
        p.stock_quantity,
        p.product_description,
        m.id AS merchant_id,
        m.store_name,
        m.description AS merchant_description,
        m.status AS merchant_status,
        u.id AS user_id,
        u.username,
        u.email
      FROM products p
      LEFT JOIN merchants m ON p.merchant_id = m.id
      LEFT JOIN users u ON m.user_id = u.id
      WHERE p.product_name ILIKE $1
      ORDER BY p.date_created DESC
      LIMIT $2 OFFSET $3
    `;

    const values = [`%${keyword}%`, limitNum, offset];

    const result = await query(sql, values);

    const countResult = await query(
      `SELECT COUNT(*) FROM products WHERE product_name ILIKE $1`,
      [`%${keyword}%`]
    );

    res.json({
      page: pageNum,
      limit: limitNum,
      total: Number(countResult.rows[0].count),
      data: result.rows,
    });
  } catch (error) {
    console.error("获取商品列表失败:", error);
    res.status(500).json({ message: "服务器内部错误" });
  }
});

// 获取公开商品详情
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT
        p.product_id,
        p.product_name,
        p.product_description,
        p.price,
        p.stock_quantity,
        m.id AS merchant_id,
        m.store_name,
        m.description AS merchant_description,
        m.status AS merchant_status,
        u.id AS user_id,
        u.username,
        u.email
      FROM products p
      LEFT JOIN merchants m ON p.merchant_id = m.id
      LEFT JOIN users u ON m.user_id = u.id
      WHERE p.product_id = $1
    `;

    const values = [id];
    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "商品未找到" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("获取商品详情失败:", error);
    res.status(500).json({ message: "服务器内部错误" });
  }
});

export default router;
