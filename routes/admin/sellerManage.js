import express from "express";
import {
  getAllSellers,
  updateSellerStatus,
  updateSellerReview,
} from "../../controllers/admin/sellerManageController.js";
import { adminOnly } from "../../middlewares/auth.js";

const router = express.Router();

// 获取所有商家
router.get("/sellers", adminOnly, getAllSellers);

// 更新商家启用状态
router.put("/sellers/:id/status", adminOnly, updateSellerStatus);

// 审核商家状态
router.put("/sellers/:id/review", adminOnly, updateSellerReview);

export default router;
