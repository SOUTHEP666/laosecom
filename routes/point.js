import express from "express";
import {
  getPoints,
  getHistory,
  addPointsManually,
} from "../controllers/pointController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { rbac } from "../middlewares/rbac.js";

const router = express.Router();

// 获取当前用户积分与等级
router.get("/me", authMiddleware, getPoints);

// 查看当前用户积分记录
router.get("/history", authMiddleware, getHistory);

// 管理员手动添加积分
router.post("/:userId", authMiddleware, rbac("积分管理"), addPointsManually);

export default router;
