import express from 'express';

import { wishlistController } from '../controllers/wishlist.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = express.Router();

router.get('/', authenticate, wishlistController.getWishlist);

router.post('/:productId', authenticate, wishlistController.toggleProduct);

export default router;