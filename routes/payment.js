import express from 'express';
import { handlePayment, getPaymentStatus } from '../controllers/paymentController.js';

const router = express.Router();

router.post('/create', handlePayment); // 模拟支付发起
router.get('/status/:orderId', getPaymentStatus);

export default router;
