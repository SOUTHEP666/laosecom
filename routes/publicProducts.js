import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// 产品列表接口
router.get("/all", async (req, res) => {
  console.log("请求参数:", req.query);
  try {
    const { page = 1, limit = 12, keyword = "" } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
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
      data: result.rows,
      total: Number(countResult.rows[0].count),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "服务器内部错误" });
  }
});

// 产品详情接口
router.get("/detail/:id", async (req, res) => {
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
    console.error(error);
    res.status(500).json({ message: "服务器内部错误" });
  }
});

export default router;
