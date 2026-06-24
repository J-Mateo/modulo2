import { wishlistService } from '../services/wishlist.service.js';

const getWishlist = async (req, res, next) => {
  try {
    const wishlist = await wishlistService.getWishlistByUserId(
      req.user.userId
    );

    return res.json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};

const toggleProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const wishlist = await wishlistService.toggleProduct(
      req.user.userId,
      productId
    );

    return res.json({
      success: true,
      data: wishlist,
    });
  } catch (error) {
    next(error);
  }
};

export const wishlistController = {
  getWishlist,
  toggleProduct,
};