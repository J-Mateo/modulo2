import { Wishlist } from '../models/wishlist.model.js';

const getWishlistByUserId = async (userId) => {
  let wishlist = await Wishlist.findOne({
    userId: String(userId),
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      userId: String(userId),
      productIds: [],
    });
  }

  return wishlist;
};

const toggleProduct = async (userId, productId) => {
  const wishlist = await getWishlistByUserId(userId);

  const exists = wishlist.productIds.includes(
    String(productId)
  );

  if (exists) {
    wishlist.productIds = wishlist.productIds.filter(
      (id) => id !== String(productId)
    );
  } else {
    wishlist.productIds.push(String(productId));
  }

  await wishlist.save();

  return wishlist;
};

export const wishlistService = {
  getWishlistByUserId,
  toggleProduct,
};