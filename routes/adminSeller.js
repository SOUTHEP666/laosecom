import express from "express";
import {
  getAllSellers,
  updateSellerStatus,
  updateAuditStatus,
} from "../controllers/adminSellerController.js";
import { adminOnly } from "../middleware/adminOnly.js";

const router = express.Router();

// 管理员获取商家列表
router.get("/", adminOnly, getAllSellers);

// 修改启用/禁用状态
router.put("/status/:id", adminOnly, updateSellerStatus);

// 修改审核状态
router.put("/audit/:id", adminOnly, updateAuditStatus);

export default router;
