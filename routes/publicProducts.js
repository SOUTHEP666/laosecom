// D:\wepapp\wepapp\laose-com\backend\routes\publicProducts.js
import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

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

    // 统计总数
    const countSQL = `SELECT COUNT(*) FROM products ${whereSQL}`;
    const totalRes = await query(countSQL, values);
    const total = parseInt(totalRes.rows[0].count);

    // 查询商品数据，不关联 merchants，直接从 products 表取卖家名字 seller_name
    const sql = `
      SELECT id, name, description, price, stock, images, category, created_at,
             seller_name
      FROM products
      ${whereSQL}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    values.push(limit, offset);

    const result = await query(sql, values);

    const products = result.rows.map(p => ({
      ...p,
      images: p.images ? JSON.parse(p.images) : [],
    }));

    // 获取所有分类（唯一且非空）
    const categoriesRes = await query(`SELECT DISTINCT category FROM products`);
    const categories = categoriesRes.rows.map(r => r.category).filter(Boolean);

    res.json({ total, data: products, categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

export default router;
