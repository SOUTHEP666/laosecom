// routes/adminRoutes.js
import express from "express";
import { query } from "../config/db.js";

const router = express.Router();

// 获取所有用户
router.get("/users", async (req, res) => {
  try {
    const result = await query("SELECT id, username, email, role FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "获取用户失败" });
  }
});

export default router;
