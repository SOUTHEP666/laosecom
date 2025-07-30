import express from "express";
import {
  getPoints,
  getHistory,
  addPointsManually,
} from "../controllers/pointController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// 用户查询积分总额和等级
router.get("/me", authMiddleware, getPoints);

// 用户查询积分历史
router.get("/me/history", authMiddleware, getHistory);

// 管理员手动给用户加积分
router.post("/:userId/add", adminMiddleware, addPointsManually);

export default router;
