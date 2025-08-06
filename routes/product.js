import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { isSeller } from "../middlewares/isSeller.js";

const router = express.Router();

// 公开接口，获取商品列表和详情
router.get("/", getProducts);
router.get("/:id", getProductById);

// 下面接口需登录且为商家
router.post("/", authMiddleware, isSeller, createProduct);
router.put("/:id", authMiddleware, isSeller, updateProduct);
router.delete("/:id", authMiddleware, isSeller, deleteProduct);

export default router;
