import {
  usersService,
} from '../services/users.service.js';

import {
  AppError,
} from '../utils/AppError.js';

import {
  ErrorSelector,
} from '../utils/errors.js';

import {
  sendSuccess,
} from '../utils/responses.js';

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

const getProfile = async (
  req,
  res,
  next
) => {
  try {
    const user =
      await usersService
        .getProfile(
          req.user.userId
        );

    return sendSuccess(
      res,
      {
        data: user,
      }
    );
  } catch (err) {
    return next(err);
  }
};

const getAdminUsers = async (
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

    const role =
      typeof req.query.role ===
      'string'
        ? req.query.role
            .trim()
            .toUpperCase()
        : '';

    if (
      search.length > 100
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Invalid user search'
      );
    }

    if (
      role &&
      ![
        'USER',
        'ADMIN',
      ].includes(role)
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Invalid user role'
      );
    }

    const result =
      await usersService
        .getAdminUsers({
          page,
          limit,
          search,
          role,
        });

    return res.status(200).json({
      success: true,
      data: result.users,
      meta: result.meta,
    });
  } catch (error) {
    return next(error);
  }
};

export const usersController = {
  getProfile,
  getAdminUsers,
};