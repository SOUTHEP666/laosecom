// 文件路径：routes/cart.js

import express from 'express';
import { addToCart, getCart, removeFromCart } from '../controllers/cartController.js';

const router = express.Router();

// 添加商品到购物车
router.post('/', addToCart);

// 根据用户ID获取购物车内容
router.get('/:userId', getCart);

// 从购物车删除指定商品
router.delete('/:userId/:productId', removeFromCart);

export default router;
