import express from 'express';

import { reviewsController } from '../controllers/reviews.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = express.Router({ mergeParams: true });

router.get('/', reviewsController.getReviewsByProductId);

router.post(
  '/',
  authenticate,
  reviewsController.createReview
);

export default router;