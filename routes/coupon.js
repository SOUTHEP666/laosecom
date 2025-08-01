import express from 'express';
import { createNewCoupon, userReceiveCoupon, getUserAvailableCoupons, useCoupon } from '../controllers/couponController.js';

const router = express.Router();

router.post('/create', createNewCoupon);
router.post('/receive', userReceiveCoupon);
router.get('/user/:userId', getUserAvailableCoupons);
router.post('/use', useCoupon);

export default router;
