import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

router.get("/all", async (req, res) => {
  try {
    const { page = 1, limit = 12, keyword = "", category = "" } = req.query;
    const offset = (page - 1) * limit;

    const sql = `
      SELECT
        p.id AS product_id,
        p.name AS product_name,
        p.price,
        p.stock,
        p.category,
        p.images,
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
      WHERE p.name ILIKE $1
        AND ($2 = '' OR p.category = $2)
      ORDER BY p.created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const values = [`%${keyword}%`, category, limit, offset];

    const result = await query(sql, values);

    // 统计总数（用于分页）
    const countResult = await query(
      `SELECT COUNT(*) FROM products WHERE name ILIKE $1 AND ($2 = '' OR category = $2)`,
      [`%${keyword}%`, category]
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

export default router;
