import express from 'express';
import { createProduct, getAllProducts, updateProduct, reviewProduct } from '../controllers/productController.js';

const router = express.Router();

router.post('/', createProduct);
router.get('/', getAllProducts);
router.put('/:id', updateProduct);
router.post('/:id/review', reviewProduct); // 审核流程接口

export default router;
