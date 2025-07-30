import express from 'express';
import {
  registerMerchant,
  updateMerchantProfile,
  getMerchantById,
  listMerchants,
  approveMerchant,
  updateMerchantGradeCommission,
} from '../controllers/merchantController.js';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// 商家申请入驻
router.post('/register', registerMerchant);

// 商家资料更新
router.put('/:id', authMiddleware, updateMerchantProfile);

// 获取单个商家信息
router.get('/:id', getMerchantById);

// 获取全部商家（管理员）
router.get('/', adminMiddleware, listMerchants);

// 审核商家入驻（管理员）
router.post('/:id/approve', adminMiddleware, approveMerchant);

// 设置商家等级与佣金（管理员）
router.post('/:id/grade', adminMiddleware, updateMerchantGradeCommission);

export default router;
