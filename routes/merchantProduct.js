// routes/merchantProducts.js
import express from "express";
import { query } from "../config/db.js";
import { authenticate, authorize } from '../middleware/auth.js';
const router = express.Router();

router.use(authenticate); // 验证登录

router.get("/products", async (req, res) => {
  try {
    const userId = req.user.id; // token中解析用户id
    const result = await query(
      "SELECT * FROM products WHERE merchant_id = $1",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "获取商品失败" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, price } = req.body;
    await query(
      "INSERT INTO products (name, price, merchant_id) VALUES ($1, $2, $3)",
      [name, price, userId]
    );
    res.json({ message: "新增成功" });
  } catch (err) {
    res.status(500).json({ message: "新增失败" });
  }
});

router.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, price } = req.body;
    await query(
      "UPDATE products SET name=$1, price=$2 WHERE id=$3 AND merchant_id=$4",
      [name, price, id, userId]
    );
    res.json({ message: "更新成功" });
  } catch (err) {
    res.status(500).json({ message: "更新失败" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await query("DELETE FROM products WHERE id=$1 AND merchant_id=$2", [
      id,
      userId,
    ]);
    res.json({ message: "删除成功" });
  } catch (err) {
    res.status(500).json({ message: "删除失败" });
  }
});

export default router;
