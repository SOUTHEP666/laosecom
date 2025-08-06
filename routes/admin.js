import express from 'express';
import { loginAdmin, getPendingSellers, reviewSeller } from '../controllers/adminController.js';
import { authMiddleware, authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

// 管理员登录
router.post('/login', loginAdmin);

// 以下接口需要登录且必须是管理员
router.use(authMiddleware, authorizeRoles('admin'));

router.get('/sellers/pending', getPendingSellers);
router.put('/sellers/:sellerId/review', reviewSeller);

export default router;
