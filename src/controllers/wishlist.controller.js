import { wishlistService } from '../services/wishlist.service.js';
import { productsService } from '../services/products.service.js';
import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

const parseProductId = (value) => {
  const productId = Number(value);

  if (
    !Number.isInteger(productId) ||
    productId <= 0
  ) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Invalid product identifier'
    );
  }

  return productId;
};

const getWishlist = async (req, res, next) => {
  try {
    const wishlist =
      await wishlistService.getWishlistByUserId(
        req.user.userId
      );

    return res.status(200).json({
      success: true,
      data: {
        productIds: wishlist.productIds,
      },
    });
  } catch (error) {
    next(error);
  }
};

const toggleProduct = async (req, res, next) => {
  try {
    const productId = parseProductId(
      req.params.productId
    );

    const product =
      await productsService.getProductById(productId);

    if (!product) {
      throw new AppError(
        ErrorSelector.NOT_FOUND,
        'Product not found'
      );
    }

    const wishlist =
      await wishlistService.toggleProduct(
        req.user.userId,
        productId
      );

    return res.status(200).json({
      success: true,
      data: {
        productIds: wishlist.productIds,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const wishlistController = {
  getWishlist,
  toggleProduct,
};