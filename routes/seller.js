import express from "express";
import {
  getDashboard,
  getSellerProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/sellerController.js";
import { authMiddleware } from "../middlewares/auth.js";
import { isSeller } from "../middlewares/isSeller.js";

const router = express.Router();

router.use(authMiddleware, isSeller); // 所有接口都需登录且为商家

router.get("/dashboard", getDashboard);
router.get("/products", getSellerProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

export default router;
