import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// 获取公开商品列表（分页 + 关键字搜索 + 分类筛选）
router.get("/", async (req, res) => {
  try {
    let { page = 1, limit = 12, keyword = "", category = "" } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(Math.max(1, Number(limit) || 12), 100); // 最大100条
    const offset = (pageNum - 1) * limitNum;

    const values = [];
    let whereClauses = [];
    let idx = 1;

    // 关键词模糊搜索
    if (keyword) {
      whereClauses.push(`p.product_name ILIKE $${idx++}`);
      values.push(`%${keyword}%`);
    }

    // 分类筛选 - 这里用分类名称过滤，也可以用分类id，依据你需求调整
    if (category) {
      whereClauses.push(`EXISTS (
        SELECT 1 FROM product_category pc
        JOIN categories c ON pc.category_id = c.category_id
        WHERE pc.product_id = p.product_id AND c.category_name = $${idx++}
      )`);
      values.push(category);
    }

    const whereSQL = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    // 查询商品列表
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
      ${whereSQL}
      ORDER BY p.date_created DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    values.push(limitNum);
    values.push(offset);

    const result = await query(sql, values);

    // 统计总数
    const countSql = `
      SELECT COUNT(*) FROM products p
      ${whereSQL}
    `;
    const countResult = await query(countSql, values.slice(0, values.length - 2)); // 统计不需要limit offset

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
