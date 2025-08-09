import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// 获取所有商品（买家可访问）
router.get("/all", async (req, res) => {
  const { page = 1, limit = 12, keyword = "", category = "" } = req.query;
  const offset = (page - 1) * limit;

  try {
    let whereClauses = [];
    let values = [];
    let idx = 1;

    if (keyword) {
      whereClauses.push(`name ILIKE $${idx++}`);
      values.push(`%${keyword}%`);
    }
    if (category) {
      whereClauses.push(`category = $${idx++}`);
      values.push(category);
    }

    const whereSQL = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    const countSQL = `SELECT COUNT(*) FROM products ${whereSQL}`;
    const totalRes = await query(countSQL, values);
    const total = parseInt(totalRes.rows[0].count);

    const sql = `
      SELECT p.id, p.name, p.description, p.price, p.stock, p.images, p.category, p.created_at,
             m.name AS seller_name
      FROM products p
      JOIN merchants m ON p.merchant_id = m.id
      ${whereSQL}
      ORDER BY p.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    values.push(limit, offset);

    const result = await query(sql, values);

    const products = result.rows.map((p) => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
    }));

    const categoriesRes = await query(`SELECT DISTINCT category FROM products`);
    const categories = categoriesRes.rows.map((r) => r.category).filter(Boolean);

    res.json({ total, data: products, categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

export default router;
