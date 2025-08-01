// import express from 'express';
// import { addToCart, getCart, removeFromCart } from '../controllers/cartController.js';

// const router = express.Router();

// router.post('/', addToCart);

// router.get('/:userId', getCart);

// router.delete('/:userId/:productId', removeFromCart);

// export default router;
import express from 'express';
import { addToCart, getCartByUser, removeFromCart } from '../controllers/cartController.js';

const router = express.Router();

router.post('/', addToCart);
router.get('/:userId', getCartByUser);
router.delete('/:userId/:productId', removeFromCart);

export default router;
