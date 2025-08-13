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

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const offset = (pageNum - 1) * limitNum;

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
    console.log('新增商品请求体:', req.body);
    const merchant_id = req.user.merchant_id; // 从认证信息里获取商户ID
    if (!merchant_id) {
      return res.status(400).json({ error: "商户ID缺失" });
    }

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
         weight, dimensions, stock_quantity, min_stock_threshold, is_active, is_featured, is_bestseller, is_new, merchant_id, date_created, date_modified)
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

// 商品搜索接口（公开，无鉴权限制）
router.get("/search", async (req, res) => {
  try {
    const {
      keyword = "",
      category_id,
      attributes = "", // 格式: attrId:valueId,attrId:valueId
      min_price,
      max_price,
      is_active,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const offset = (pageNum - 1) * limitNum;

    const values = [];
    let idx = 1;
    let whereClauses = [];

    if (keyword) {
      whereClauses.push(`(product_name ILIKE $${idx} OR product_description ILIKE $${idx})`);
      values.push(`%${keyword}%`);
      idx++;
    }

    if (category_id) {
      whereClauses.push(`EXISTS (
        SELECT 1 FROM product_category pc WHERE pc.product_id = p.product_id AND pc.category_id = $${idx}
      )`);
      values.push(category_id);
      idx++;
    }

    if (attributes) {
      // attributes 示例: "1:3,2:5"
      const attrPairs = attributes.split(",");
      attrPairs.forEach(pair => {
        const [attrId, valId] = pair.split(":");
        whereClauses.push(`EXISTS (
          SELECT 1 FROM product_attribute_mapping pam 
          WHERE pam.product_id = p.product_id 
            AND pam.attribute_id = $${idx++} 
            AND pam.value_id = $${idx++}
        )`);
        values.push(parseInt(attrId));
        values.push(parseInt(valId));
      });
    }

    if (min_price) {
      whereClauses.push(`price >= $${idx++}`);
      values.push(min_price);
    }
    if (max_price) {
      whereClauses.push(`price <= $${idx++}`);
      values.push(max_price);
    }
    if (is_active !== undefined) {
      whereClauses.push(`is_active = $${idx++}`);
      values.push(is_active === "true");
    }

    const whereSQL = whereClauses.length ? "WHERE " + whereClauses.join(" AND ") : "";

    const totalRes = await query(`SELECT COUNT(*) FROM products p ${whereSQL}`, values);
    const total = parseInt(totalRes.rows[0].count);

    const dataRes = await query(
      `SELECT * FROM products p ${whereSQL} ORDER BY date_created DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...values, limitNum, offset]
    );

    res.json({
      page: pageNum,
      limit: limitNum,
      total,
      data: dataRes.rows,
    });
  } catch (err) {
    console.error("搜索失败:", err);
    res.status(500).json({ error: "搜索失败" });
  }
});

export default router;
