import express from "express";
import { getPendingProducts, auditProduct } from "../controllers/productAuditController.js";
import { adminOnly } from "../middlewares/adminOnly.js";

const router = express.Router();

// 获取待审核商品列表
router.get("/pending", adminOnly, getPendingProducts);

// 审核商品
router.put("/:id/audit", adminOnly, auditProduct);

export default router;
