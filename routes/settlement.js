import express from "express";
import { authMiddleware } from "../middlewares/auth.js";
import pool from "../config/db.js";

const router = express.Router();

// 商家请求结算
router.post("/request", authMiddleware, async (req, res) => {
  const { amount } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO settlements (merchant_id, amount) VALUES ($1, $2) RETURNING *",
      [req.user.id, amount]
    );
    res.json({ message: "结算申请成功", settlement: result.rows[0] });
  } catch (err) {
    res.status(500).json({ message: "结算申请失败", error: err.message });
  }
});

// 管理员处理结算
router.put("/review/:id", authMiddleware, async (req, res) => {
  if (req.user.role !== 0) return res.status(403).json({ message: "无权限" });
  const { status } = req.body; // approved / rejected
  try {
    await pool.query("UPDATE settlements SET status=$1 WHERE id=$2", [status, req.params.id]);
    res.json({ message: "结算状态已更新" });
  } catch (err) {
    res.status(500).json({ message: "处理失败", error: err.message });
  }
});

export default router;
