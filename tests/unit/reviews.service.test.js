import { jest } from '@jest/globals';

const mockCreate = jest.fn();
const mockSort = jest.fn();

jest.unstable_mockModule('../../src/models/review.model.js', () => ({
  Review: {
    create: mockCreate,
    find: jest.fn(() => ({
      sort: mockSort,
    })),
  },
}));

const { reviewsService } = await import('../../src/services/reviews.service.js');

describe('reviewsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('creates a review with valid data', async () => {
    const reviewData = {
      productId: 4,
      userId: 2,
      rating: 5,
      comment: 'Excelente producto',
    };

    const createdReview = {
      productId: '4',
      userId: '2',
      rating: 5,
      comment: 'Excelente producto',
    };

    mockCreate.mockResolvedValue(createdReview);

    const result = await reviewsService.createReview(reviewData);

    expect(mockCreate).toHaveBeenCalledWith(createdReview);
    expect(result).toEqual(createdReview);
  });

  test('throws error when rating is lower than 1', async () => {
    await expect(
      reviewsService.createReview({
        productId: 4,
        userId: 2,
        rating: 0,
        comment: 'Mala review',
      })
    ).rejects.toThrow('Rating must be between 1 and 5');
  });

  test('throws error when rating is greater than 5', async () => {
    await expect(
      reviewsService.createReview({
        productId: 4,
        userId: 2,
        rating: 6,
        comment: 'Rating inválido',
      })
    ).rejects.toThrow('Rating must be between 1 and 5');
  });
});