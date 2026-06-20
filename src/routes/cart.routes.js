import express from 'express';
import { cartController } from '../controllers/cart.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = express.Router();


router.get('/', authenticate, cartController.getCart);
router.post('/items', authenticate, cartController.addItem);
router.delete('/items/:itemId', authenticate, cartController.removeItem);
router.post('/checkout', authenticate, cartController.checkout);

export default router;