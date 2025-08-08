import express from "express";
import { query } from "../config/db.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// 需要登录验证
router.use(authMiddleware);

// 获取指定商家的所有商品
router.get("/:merchantId", async (req, res) => {
  const { merchantId } = req.params;
  // 权限校验：只能查看自己的商品
  if (req.user.id.toString() !== merchantId) {
    return res.status(403).json({ message: "无权限访问" });
  }

  try {
    const result = await query(
      "SELECT * FROM products WHERE merchant_id = $1 ORDER BY created_at DESC",
      [merchantId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("查询商品失败", err);
    res.status(500).json({ message: "查询商品失败" });
  }
});

// 新增商品
router.post("/:merchantId", async (req, res) => {
  const { merchantId } = req.params;
  if (req.user.id.toString() !== merchantId) {
    return res.status(403).json({ message: "无权限操作" });
  }
  const { name, description, price, stock } = req.body;

  if (!name || price == null || stock == null) {
    return res.status(400).json({ message: "缺少必要字段" });
  }

  try {
    const result = await query(
      `INSERT INTO products (merchant_id, name, description, price, stock, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [merchantId, name, description || "", price, stock]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("新增商品失败", err);
    res.status(500).json({ message: "新增商品失败" });
  }
});

// 修改商品
router.put("/:merchantId/:productId", async (req, res) => {
  const { merchantId, productId } = req.params;
  if (req.user.id.toString() !== merchantId) {
    return res.status(403).json({ message: "无权限操作" });
  }
  const { name, description, price, stock } = req.body;

  try {
    const result = await query(
      `UPDATE products 
       SET name = $1, description = $2, price = $3, stock = $4, updated_at = NOW() 
       WHERE id = $5 AND merchant_id = $6 RETURNING *`,
      [name, description || "", price, stock, productId, merchantId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "商品不存在或无权限" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("更新商品失败", err);
    res.status(500).json({ message: "更新商品失败" });
  }
});

// 删除商品
router.delete("/:merchantId/:productId", async (req, res) => {
  const { merchantId, productId } = req.params;
  if (req.user.id.toString() !== merchantId) {
    return res.status(403).json({ message: "无权限操作" });
  }

  try {
    const result = await query(
      "DELETE FROM products WHERE id = $1 AND merchant_id = $2 RETURNING *",
      [productId, merchantId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "商品不存在或无权限" });
    }
    res.json({ message: "删除成功" });
  } catch (err) {
    console.error("删除商品失败", err);
    res.status(500).json({ message: "删除商品失败" });
  }
});

export default router;
