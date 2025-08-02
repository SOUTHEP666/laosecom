import express from 'express';
import { createSKU, updateStock, getStockByProduct } from '../controllers/stockController.js';

const router = express.Router();

router.post('/', createSKU);
router.get('/:productId', getStockByProduct);
router.put('/:skuId', updateStock);

export default router;
