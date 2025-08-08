import express from "express";
import authMiddleware from "../middleware/auth.js";
import { pool } from "../config/db.js";

const router = express.Router();

// 获取商家订单列表
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      "SELECT * FROM orders WHERE merchant_id=$1 ORDER BY created_at DESC",
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "获取订单失败", error: err.message });
  }
});

// 更新订单状态
router.put("/:id/status", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    // 订单归属验证
    const check = await pool.query("SELECT * FROM orders WHERE id=$1 AND merchant_id=$2", [id, userId]);
    if (check.rows.length === 0) return res.status(403).json({ message: "无权限操作该订单" });

    await pool.query("UPDATE orders SET status=$1 WHERE id=$2", [status, id]);
    res.json({ message: "订单状态更新成功" });
  } catch (err) {
    res.status(500).json({ message: "更新订单失败", error: err.message });
  }
});

export default router;
