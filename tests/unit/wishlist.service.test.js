import { jest } from '@jest/globals';

const findOneMock = jest.fn();
const createMock = jest.fn();

jest.unstable_mockModule(
  '../../src/models/wishlist.model.js',
  () => ({
    Wishlist: {
      findOne: findOneMock,
      create: createMock,
    },
  })
);

const { wishlistService } = await import(
  '../../src/services/wishlist.service.js'
);

describe('wishlistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns existing wishlist for user', async () => {
    const wishlist = {
      userId: '1',
      productIds: ['2'],
    };

    findOneMock.mockResolvedValue(wishlist);

    const result =
      await wishlistService.getWishlistByUserId(1);

    expect(findOneMock).toHaveBeenCalledWith({
      userId: '1',
    });

    expect(createMock).not.toHaveBeenCalled();
    expect(result).toBe(wishlist);
  });

  test('creates wishlist when user does not have one', async () => {
    const wishlist = {
      userId: '1',
      productIds: [],
    };

    findOneMock.mockResolvedValue(null);
    createMock.mockResolvedValue(wishlist);

    const result =
      await wishlistService.getWishlistByUserId(1);

    expect(createMock).toHaveBeenCalledWith({
      userId: '1',
      productIds: [],
    });

    expect(result).toBe(wishlist);
  });

  test('adds a product to wishlist', async () => {
    const wishlist = {
      userId: '1',
      productIds: ['2'],
      save: jest.fn().mockResolvedValue(undefined),
    };

    findOneMock.mockResolvedValue(wishlist);

    const result =
      await wishlistService.toggleProduct(1, 3);

    expect(result.productIds).toEqual([
      '2',
      '3',
    ]);

    expect(wishlist.save).toHaveBeenCalledTimes(1);
  });

  test('removes a product from wishlist', async () => {
    const wishlist = {
      userId: '1',
      productIds: ['2', '3'],
      save: jest.fn().mockResolvedValue(undefined),
    };

    findOneMock.mockResolvedValue(wishlist);

    const result =
      await wishlistService.toggleProduct(1, 3);

    expect(result.productIds).toEqual([
      '2',
    ]);

    expect(wishlist.save).toHaveBeenCalledTimes(1);
  });
});