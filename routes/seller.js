import express from 'express';
import {
  registerSeller,
  loginSeller,
  getSellerProfile,
  getMyProducts,
  addProduct,
  updateProduct,
  deleteProduct
} from '../controllers/sellerController.js';

import { authMiddleware, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// 公开接口
router.post('/register', registerSeller);
router.post('/login', loginSeller);

// 以下接口需要登录，且必须是 seller 角色
router.use(authMiddleware, authorizeRoles('seller'));

router.get('/profile', getSellerProfile);

router.get('/products', getMyProducts);
router.post('/products', addProduct);
router.put('/products/:productId', updateProduct);
router.delete('/products/:productId', deleteProduct);

export default router;
