import express from "express";
import { authMiddleware } from "../middlewares/auth.js";
import { pool } from "../config/db.js";

const router = express.Router();

// 获取当前商家所有商品
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query("SELECT * FROM products WHERE merchant_id=$1", [userId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "获取商品失败", error: err.message });
  }
});

// 添加商品
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log("添加商品请求体:", req.body);
    console.log("当前用户ID:", userId);

    const { name, price, status } = req.body;

    if (!name || typeof name !== "string") return res.status(400).json({ message: "商品名称必填" });
    if (typeof price !== "number" || price <= 0) return res.status(400).json({ message: "价格必须为正数" });
    if (!["active", "inactive"].includes(status)) return res.status(400).json({ message: "状态无效" });

    const result = await pool.query(
      "INSERT INTO products (merchant_id, name, price, status, created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING *",
      [userId, name, price, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("添加商品失败:", err.stack);
    res.status(500).json({ message: "添加商品失败", error: err.message });
  }
});


// 编辑商品
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, price, status } = req.body;
    // 确保商品属于当前商家
    const check = await pool.query("SELECT * FROM products WHERE id=$1 AND merchant_id=$2", [id, userId]);
    if (check.rows.length === 0) return res.status(403).json({ message: "无权限操作该商品" });

    await pool.query("UPDATE products SET name=$1, price=$2, status=$3 WHERE id=$4", [name, price, status, id]);
    res.json({ message: "商品更新成功" });
  } catch (err) {
    res.status(500).json({ message: "更新商品失败", error: err.message });
  }
});

// 删除商品
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    // 权限验证
    const check = await pool.query("SELECT * FROM products WHERE id=$1 AND merchant_id=$2", [id, userId]);
    if (check.rows.length === 0) return res.status(403).json({ message: "无权限删除该商品" });

    await pool.query("DELETE FROM products WHERE id=$1", [id]);
    res.json({ message: "商品删除成功" });
  } catch (err) {
    res.status(500).json({ message: "删除商品失败", error: err.message });
  }
});

export default router;
