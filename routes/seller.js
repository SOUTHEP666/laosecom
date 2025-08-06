import express from "express";
import {
  registerSeller,
  loginSeller,
  getSellerProfile,
  getMyProducts,
  addProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/sellerController.js";

import { authMiddleware, authorizeRoles } from "../middlewares/auth.js";

const router = express.Router();

// 公开接口
router.post("/register", registerSeller);
router.post("/login", loginSeller);

// 需要登录且角色是 seller
router.use(authMiddleware, authorizeRoles("seller"));

router.get("/profile", getSellerProfile);

router.get("/products", getMyProducts);
router.post("/products", addProduct);
router.put("/products/:productId", updateProduct);
router.delete("/products/:productId", deleteProduct);

export default router;
