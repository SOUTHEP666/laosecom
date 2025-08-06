// routes/sellerAdmin.js
import express from "express";
import {
  getAllSellers,
  updateSellerStatus,
  updateAuditStatus,
} from "../controllers/sellerAdminController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();

// 管理员查看所有商家
router.get("/", authMiddleware, getAllSellers);

// 修改启用状态
router.put("/:id/status", authMiddleware, updateSellerStatus);

// 修改审核状态
router.put("/:id/audit", authMiddleware, updateAuditStatus);

export default router;
