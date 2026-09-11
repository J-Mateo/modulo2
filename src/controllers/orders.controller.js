import {
  ordersService,
} from '../services/orders.service.js';

import {
  AppError,
} from '../utils/AppError.js';

import {
  ErrorSelector,
} from '../utils/errors.js';

const VALID_ORDER_STATUSES = [
  'PENDING',
  'PAID',
  'CANCELLED',
  'REFUNDED',
];

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

const parsePositiveInteger = (
  value,
  fallback,
  max = null
) => {
  const parsed =
    Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    return fallback;
  }

  if (
    max &&
    parsed > max
  ) {
    return max;
  }

  return parsed;
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

const getAdminOrders = async (
  req,
  res,
  next
) => {
  try {
    const page =
      parsePositiveInteger(
        req.query.page,
        1
      );

    const limit =
      parsePositiveInteger(
        req.query.limit,
        20,
        100
      );

    const search =
      typeof req.query.search ===
      'string'
        ? req.query.search.trim()
        : '';

    const status =
      typeof req.query.status ===
      'string'
        ? req.query.status
            .trim()
            .toUpperCase()
        : '';

    if (
      search.length > 100
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Invalid order search'
      );
    }

    if (
      status &&
      !VALID_ORDER_STATUSES.includes(
        status
      )
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Invalid order status'
      );
    }

    const result =
      await ordersService
        .getAdminOrders({
          page,
          limit,
          search,
          status,
        });

    return res.status(200).json({
      success: true,
      data: result.orders,
      meta: result.meta,
    });
  } catch (error) {
    return next(error);
  }
};

export const ordersController = {
  getOrders,
  getOrderById,
  getAdminOrders,
};