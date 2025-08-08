// backend/routes/products.js
import express from "express";
import { query } from "../config/db.js";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// 所有路由均需要身份验证 + 商家权限
router.use(authMiddleware, authorizeRoles("merchant"));

// 获取当前登录商家的商品列表
router.get("/", async (req, res) => {
  const merchantId = req.user.id;
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

// 添加商品
router.post("/", async (req, res) => {
  const merchantId = req.user.id;
  const { name, description, price, stock } = req.body;
  try {
    const result = await query(
      `INSERT INTO products (merchant_id, name, description, price, stock) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [merchantId, name, description, price, stock]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("新增商品失败", err);
    res.status(500).json({ message: "新增商品失败" });
  }
});

// 修改商品
router.put("/:id", async (req, res) => {
  const merchantId = req.user.id;
  const { id } = req.params;
  const { name, description, price, stock } = req.body;

  try {
    const result = await query(
      `UPDATE products 
       SET name = $1, description = $2, price = $3, stock = $4, updated_at = NOW() 
       WHERE id = $5 AND merchant_id = $6 RETURNING *`,
      [name, description, price, stock, id, merchantId]
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
router.delete("/:id", async (req, res) => {
  const merchantId = req.user.id;
  const { id } = req.params;

  try {
    const result = await query(
      `DELETE FROM products WHERE id = $1 AND merchant_id = $2 RETURNING *`,
      [id, merchantId]
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
