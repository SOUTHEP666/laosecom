// routes/merchantProducts.js

import express from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { query } from "../config/db.js";

const router = express.Router();

// 获取商家自己的商品列表（分页+搜索+筛选）
router.get("/", authenticate, authorize(["merchant"]), async (req, res) => {
  try {
    const merchant_id = req.user.merchant_id;
    if (!merchant_id) {
      return res.status(400).json({ error: "商户ID缺失" });
    }

    const {
      page = 1,
      limit = 10,
      keyword = "",
      is_active,
      is_featured,
      is_bestseller,
      is_new,
    } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const offset = (pageNum - 1) * limitNum;

    let whereClauses = ["merchant_id = $1"];
    let values = [merchant_id];
    let idx = 2;

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

    const whereSQL = "WHERE " + whereClauses.join(" AND ");

    // 查询总数
    const totalRes = await query(`SELECT COUNT(*) FROM products ${whereSQL}`, values);
    const total = parseInt(totalRes.rows[0].count, 10);

    // 查询数据
    values.push(limitNum);
    values.push(offset);

    const sql = `
      SELECT * FROM products
      ${whereSQL}
      ORDER BY date_created DESC
      LIMIT $${idx++} OFFSET $${idx}
    `;

    const result = await query(sql, values);

    res.json({
      page: pageNum,
      limit: limitNum,
      total,
      data: result.rows,
    });
  } catch (error) {
    console.error("获取商品列表失败:", error);
    res.status(500).json({ error: "获取商品列表失败" });
  }
});

// 获取单个商品详情（只能查看自己商家的商品）
router.get("/:id", authenticate, authorize(["merchant"]), async (req, res) => {
  try {
    const merchant_id = req.user.merchant_id;
    const { id } = req.params;

    if (!merchant_id) {
      return res.status(400).json({ error: "商户ID缺失" });
    }

    const result = await query(
      "SELECT * FROM products WHERE product_id = $1 AND merchant_id = $2",
      [id, merchant_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "商品不存在或无权限访问" });
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
    const merchant_id = req.user.merchant_id;
    if (!merchant_id) {
      return res.status(400).json({ error: "商户ID缺失" });
    }

    const {
      product_name,
      product_description = null,
      short_description = null,
      sku,
      barcode = null,
      price,
      sale_price = null,
      cost_price = null,
      weight = null,
      dimensions = null,
      stock_quantity = 0,
      min_stock_threshold = 0,
      is_active = true,
      is_featured = false,
      is_bestseller = false,
      is_new = false,
    } = req.body;

    if (!product_name || !sku || price === undefined) {
      return res.status(400).json({ error: "缺少必填字段" });
    }

    const result = await query(
      `INSERT INTO products
      (product_name, product_description, short_description, sku, barcode, price, sale_price, cost_price,
      weight, dimensions, stock_quantity, min_stock_threshold, is_active, is_featured, is_bestseller, is_new,
      merchant_id, date_created, date_modified)
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,NOW(),NOW())
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
        merchant_id,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("新增商品失败:", error);
    res.status(500).json({ error: "新增商品失败" });
  }
});

// 修改商品（只能修改自己商家的商品）
router.put("/:id", authenticate, authorize(["merchant"]), async (req, res) => {
  try {
    const merchant_id = req.user.merchant_id;
    const { id } = req.params;

    if (!merchant_id) {
      return res.status(400).json({ error: "商户ID缺失" });
    }

    const {
      product_name,
      product_description = null,
      short_description = null,
      sku,
      barcode = null,
      price,
      sale_price = null,
      cost_price = null,
      weight = null,
      dimensions = null,
      stock_quantity = 0,
      min_stock_threshold = 0,
      is_active,
      is_featured,
      is_bestseller,
      is_new,
    } = req.body;

    // 先确认商品归属商家，防止非法操作
    const existCheck = await query(
      "SELECT * FROM products WHERE product_id = $1 AND merchant_id = $2",
      [id, merchant_id]
    );
    if (existCheck.rows.length === 0) {
      return res.status(404).json({ error: "商品不存在或无权限操作" });
    }

    const result = await query(
      `UPDATE products SET
      product_name=$1, product_description=$2, short_description=$3, sku=$4, barcode=$5,
      price=$6, sale_price=$7, cost_price=$8, weight=$9, dimensions=$10, stock_quantity=$11,
      min_stock_threshold=$12, is_active=$13, is_featured=$14, is_bestseller=$15, is_new=$16,
      date_modified=NOW()
      WHERE product_id = $17 AND merchant_id = $18
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
        merchant_id,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error("修改商品失败:", error);
    res.status(500).json({ error: "修改商品失败" });
  }
});

// 删除商品（只能删除自己商家的商品）
router.delete("/:id", authenticate, authorize(["merchant"]), async (req, res) => {
  try {
    const merchant_id = req.user.merchant_id;
    const { id } = req.params;

    if (!merchant_id) {
      return res.status(400).json({ error: "商户ID缺失" });
    }

    const existCheck = await query(
      "SELECT * FROM products WHERE product_id = $1 AND merchant_id = $2",
      [id, merchant_id]
    );
    if (existCheck.rows.length === 0) {
      return res.status(404).json({ error: "商品不存在或无权限操作" });
    }

    await query("DELETE FROM products WHERE product_id = $1 AND merchant_id = $2", [
      id,
      merchant_id,
    ]);

    res.json({ message: "删除成功" });
  } catch (error) {
    console.error("删除商品失败:", error);
    res.status(500).json({ error: "删除商品失败" });
  }
});

export default router;
