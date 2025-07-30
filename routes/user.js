import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// 注册
router.post("/register", register);
// 登录
router.post("/login", login);
// 获取当前用户资料
router.get("/profile", authMiddleware, getProfile);
// 更新资料
router.put("/profile", authMiddleware, updateProfile);
// 修改密码
router.post("/change-password", authMiddleware, changePassword);

export default router;
