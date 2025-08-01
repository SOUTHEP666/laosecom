// import express from 'express';
// import {
//   createOrder,
//   getUserOrders,
//   updateOrderStatus
// } from '../controllers/orderController.js';

// const router = express.Router();

// router.post('/', createOrder);
// router.get('/:userId', getUserOrders);
// router.put('/:orderId/status', updateOrderStatus);

// export default router;
import express from 'express';
import { createOrder, getUserOrders, updateOrderStatus } from '../controllers/orderController.js';

const router = express.Router();

router.post('/', createOrder);
router.get('/:userId', getUserOrders);
router.put('/:orderId/status', updateOrderStatus);

export default router;
