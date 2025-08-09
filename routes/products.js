import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { query } from "../config/db.js";

const router = express.Router();

// 获取商品列表（分页+搜索+过滤）
router.get("/", authenticate, authorize(["merchant"]), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      keyword = "",
      is_active,
      is_featured,
      is_bestseller,
      is_new,
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClauses = [];
    let values = [];
    let idx = 1;

    if (keyword) {
      whereClauses.push(`product_name ILIKE $${idx++}`);
      values.push(`%${keyword}%`);
    }
    if (typeof is_active !== "undefined") {
      whereClauses.push(`is_active = $${idx++}`);
      values.push(is_active === "true");
    }
    if (typeof is_featured !== "undefined") {
      whereClauses.push(`is_featured = $${idx++}`);
      values.push(is_featured === "true");
    }
    if (typeof is_bestseller !== "undefined") {
      whereClauses.push(`is_bestseller = $${idx++}`);
      values.push(is_bestseller === "true");
    }
    if (typeof is_new !== "undefined") {
      whereClauses.push(`is_new = $${idx++}`);
      values.push(is_new === "true");
    }

    const whereSQL = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

    // 统计总数
    const totalRes = await query(`SELECT COUNT(*) FROM products ${whereSQL}`, values);
    const total = parseInt(totalRes.rows[0].count);

    // 查询数据
    values.push(limit);
    values.push(offset);
    const sql = `
      SELECT * FROM products
      ${whereSQL}
      ORDER BY date_created DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;
    const result = await query(sql, values);

    res.json({
      total,
      data: result.rows,
    });
  } catch (error) {
    console.error("获取商品列表失败:", error);
    res.status(500).json({ error: "获取商品列表失败" });
  }
});

// 获取单个商品详情
router.get("/:id", authenticate, authorize(["merchant"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("SELECT * FROM products WHERE product_id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "商品不存在" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("获取商品详情失败:", error);
    res.status(500).json({ error: "获取商品详情失败" });
  }
});

// 新增商品
router.post("/", authenticate, authorize(["merchant"]), async (req, res) => {
  try {
    const {
      product_name,
      product_description,
      short_description,
      sku,
      barcode,
      price,
      sale_price,
      cost_price,
      weight,
      dimensions,
      stock_quantity,
      min_stock_threshold,
      is_active = true,
      is_featured = false,
      is_bestseller = false,
      is_new = false,
    } = req.body;

    const result = await query(
      `INSERT INTO products
        (product_name, product_description, short_description, sku, barcode, price, sale_price, cost_price,
         weight, dimensions, stock_quantity, min_stock_threshold, is_active, is_featured, is_bestseller, is_new, date_created, date_modified)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW(),NOW())
       RETURNING *`,
      [
        product_name,
        product_description,
        short_description,
        sku,
        barcode,
        price,
        sale_price,
        cost_price,
        weight,
        dimensions,
        stock_quantity,
        min_stock_threshold,
        is_active,
        is_featured,
        is_bestseller,
        is_new,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("新增商品失败:", error);
    res.status(500).json({ error: "新增商品失败" });
  }
});

// 修改商品
router.put("/:id", authenticate, authorize(["merchant"]), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      product_name,
      product_description,
      short_description,
      sku,
      barcode,
      price,
      sale_price,
      cost_price,
      weight,
      dimensions,
      stock_quantity,
      min_stock_threshold,
      is_active,
      is_featured,
      is_bestseller,
      is_new,
    } = req.body;

    const result = await query(
      `UPDATE products SET
        product_name=$1, product_description=$2, short_description=$3, sku=$4, barcode=$5,
        price=$6, sale_price=$7, cost_price=$8, weight=$9, dimensions=$10, stock_quantity=$11,
        min_stock_threshold=$12, is_active=$13, is_featured=$14, is_bestseller=$15, is_new=$16,
        date_modified=NOW()
       WHERE product_id = $17
       RETURNING *`,
      [
        product_name,
        product_description,
        short_description,
        sku,
        barcode,
        price,
        sale_price,
        cost_price,
        weight,
        dimensions,
        stock_quantity,
        min_stock_threshold,
        is_active,
        is_featured,
        is_bestseller,
        is_new,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "商品不存在" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("修改商品失败:", error);
    res.status(500).json({ error: "修改商品失败" });
  }
});

// 删除商品
router.delete("/:id", authenticate, authorize(["merchant"]), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM products WHERE product_id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "商品不存在" });
    }
    res.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除商品失败:", error);
    res.status(500).json({ error: "删除商品失败" });
  }
});

export default router;
