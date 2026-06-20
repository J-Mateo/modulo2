import { reviewsService } from '../services/reviews.service.js';

const getReviewsByProductId = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const reviews = await reviewsService.getReviewsByProductId(productId);

    return res.json({
      ok: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

const createReview = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    const review = await reviewsService.createReview({
      productId,
      userId: req.user.userId,
      rating,
      comment,
    });

    return res.status(201).json({
      ok: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

export const reviewsController = {
  getReviewsByProductId,
  createReview,
};