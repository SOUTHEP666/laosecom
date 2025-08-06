import express from 'express';
import { 
  createProduct, 
  getAllProducts, 
  getProductById, 
  updateProduct, 
  reviewProduct 
} from '../controllers/productController.js';

const router = express.Router();

// 添加商品
router.post('/', createProduct);

// 获取商品列表（支持查询参数）
router.get('/', getAllProducts);

// 获取单个商品详情
router.get('/:id', getProductById);

// 修改商品信息
router.put('/:id', updateProduct);

// 添加商品评论
router.post('/:id/review', reviewProduct);

export default router;
