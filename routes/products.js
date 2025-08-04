import express from 'express';
import { createProduct, getAllProducts, getProductById, updateProduct, reviewProduct } from '../controllers/productController.js';

const router = express.Router();

router.post('/', createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.post('/:id/review', reviewProduct);

export default router;
