import express from 'express';

import { reviewsController } from '../controllers/reviews.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = express.Router();

router.get(
  '/products/:id/reviews',
  reviewsController.getReviewsByProductId
);

router.post(
  '/products/:id/reviews',
  authenticate,
  reviewsController.createReview
);

export default router;