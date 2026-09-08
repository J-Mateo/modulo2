import {
  ordersService,
} from '../services/orders.service.js';

import {
  AppError,
} from '../utils/AppError.js';

import {
  ErrorSelector,
} from '../utils/errors.js';

const parseOrderId = (
  value
) => {
  const orderId =
    Number(value);

  if (
    !Number.isInteger(orderId) ||
    orderId <= 0
  ) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Invalid order identifier'
    );
  }

  return orderId;
};

const getOrders = async (
  req,
  res,
  next
) => {
  try {
    const orders =
      await ordersService
        .getOrdersByUserId(
          req.user.userId
        );

    return res.status(200).json({
      success: true,

      data: {
        orders,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const getOrderById = async (
  req,
  res,
  next
) => {
  try {
    const orderId =
      parseOrderId(
        req.params.id
      );

    const order =
      await ordersService
        .getOrderById({
          orderId,

          userId:
            req.user.userId,
        });

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return next(error);
  }
};

export const ordersController = {
  getOrders,
  getOrderById,
};