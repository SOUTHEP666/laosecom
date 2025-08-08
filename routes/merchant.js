import express from "express";
import authMiddleware from "../middleware/auth.js";
import { pool } from "../config/db.js";

const router = express.Router();

// 获取当前商家资料
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query("SELECT company_name, contact_name, contact_phone, email FROM merchants WHERE id=$1", [userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: "商家不存在" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "获取资料失败", error: err.message });
  }
});

// 更新资料
router.put("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { company_name, contact_name, contact_phone, email } = req.body;
    await pool.query(
      "UPDATE merchants SET company_name=$1, contact_name=$2, contact_phone=$3, email=$4 WHERE id=$5",
      [company_name, contact_name, contact_phone, email, userId]
    );
    res.json({ message: "资料更新成功" });
  } catch (err) {
    res.status(500).json({ message: "更新资料失败", error: err.message });
  }
});

export default router;
