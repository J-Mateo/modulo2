import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },

    productIds: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Wishlist = mongoose.model(
  'Wishlist',
  wishlistSchema
);