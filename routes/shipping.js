import express from 'express';
import {
  createShippingOrder,
  addTracking,
  getShipmentInfo,
  confirmDelivery,
} from '../controllers/shippingController.js';

const router = express.Router();

router.post('/create', createShippingOrder);
router.post('/track', addTracking);
router.get('/info/:order_id', getShipmentInfo);
router.post('/confirm', confirmDelivery);

export default router;
