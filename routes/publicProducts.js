// routes/publicProducts.js
import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// 获取所有商家商品（分页、关键词、分类筛选）
router.get("/all", async (req, res) => {
  const { page = 1, limit = 12, keyword = "", category = "" } = req.query;
  const offset = (page - 1) * limit;

  try {
    let conditions = [];
    let values = [];
    let idx = 1;

    if (keyword) {
      conditions.push(`p.name ILIKE $${idx++}`);
      values.push(`%${keyword}%`);
    }
    if (category) {
      conditions.push(`p.category = $${idx++}`);
      values.push(category);
    }

    const whereClause = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

    // 计算总数
    const countSql = `SELECT COUNT(*) FROM products p ${whereClause}`;
    const countResult = await query(countSql, values);
    const total = parseInt(countResult.rows[0].count);

    // 查询数据
    values.push(limit, offset);
    const dataSql = `
      SELECT
        p.id, p.name, p.description, p.price, p.stock, p.images, p.category,
        m.name AS seller_name
      FROM products p
      LEFT JOIN merchants m ON p.merchant_id = m.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    const dataResult = await query(dataSql, values);

    const data = dataResult.rows.map((row) => ({
      ...row,
      images: row.images ? JSON.parse(row.images) : [],
    }));

    // 这里还可以返回当前所有商品类别，供前端筛选用
    const categoriesResult = await query("SELECT DISTINCT category FROM products");
    const categories = categoriesResult.rows.map((r) => r.category);

    res.json({ total, data, categories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "获取商品失败" });
  }
});

export default router;
