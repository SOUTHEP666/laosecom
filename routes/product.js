// routes/product.js
import express from "express";
import {
  createProduct,
  getSellerProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

// 创建商品（仅商家）
router.post("/", authMiddleware, createProduct);

// 获取商家的所有商品（当前登录商家）
router.get("/", authMiddleware, getSellerProducts);

// 更新商品
router.put("/:id", authMiddleware, updateProduct);

// 删除商品
router.delete("/:id", authMiddleware, deleteProduct);

export default router;
