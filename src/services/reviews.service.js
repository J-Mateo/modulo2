import { Review } from '../models/review.model.js';

const getReviewsByProductId = async (productId) => {
  return Review.find({
    productId: String(productId),
  }).sort({
    createdAt: -1,
  });
};

const createReview = async ({
  productId,
  userId,
  rating,
  comment,
}) => {
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