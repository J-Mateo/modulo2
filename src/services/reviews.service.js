import { Review } from '../models/review.model.js';
import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

const getReviewsByProductId = async (productId) => {
  return Review.find({
    productId: String(productId),
  }).sort({
    createdAt: -1,
  });
};

const createReview = async ({ productId, userId, rating, comment }) => {
  if (!rating || rating < 1 || rating > 5) {
    throw new AppError(ErrorSelector.BAD_REQUEST, 'Rating must be between 1 and 5');
  }

  return Review.create({
    productId: String(productId),
    userId: String(userId),
    rating,
    comment,
  });
};

export const reviewsService = {
  getReviewsByProductId,
  createReview,
};