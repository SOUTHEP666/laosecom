import express from "express";
import { authMiddleware, authorizeRoles } from "../middleware/authMiddleware.js"; // 注意路径是否正确

const router = express.Router();

router.get("/profile", authMiddleware, (req, res) => {
  res.json({ message: "这是用户资料", user: req.user });
});

router.get("/admin1-area", authMiddleware, authorizeRoles(3), (req, res) => {
  res.json({ message: "一级管理员专属区域" });
});

router.get("/seller-or-admin", authMiddleware, authorizeRoles(2, 3, 4), (req, res) => {
  res.json({ message: "商家或管理员区域" });
});

export default router;
