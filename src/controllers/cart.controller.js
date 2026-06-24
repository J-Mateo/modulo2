import { cartService } from '../services/cart.service.js';

const getCart = async (req, res, next) => {
  try {
    const cart = await cartService.getOrCreateActiveCart(req.user.userId);

    return res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

const addItem = async (req, res, next) => {
  try {
    const cart = await cartService.addItemToCart({
      userId: req.user.userId,
      productId: req.body.productId,
      quantity: req.body.quantity,
    });

    return res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

const removeItem = async (req, res, next) => {
  try {
    const cart = await cartService.removeItemFromCart({
      userId: req.user.userId,
      itemId: req.params.itemId,
    });

    return res.json({
      success: true,
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

const checkout = async (req, res, next) => {
  try {
    const order = await cartService.checkout(req.user.userId);

    return res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const cartController = {
  getCart,
  addItem,
  removeItem,
  checkout,
};