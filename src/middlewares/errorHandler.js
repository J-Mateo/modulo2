import { ErrorSelector, errors } from '../utils/errors.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode =
    err.statusCode || errors[ErrorSelector.INTERNAL_ERROR].statusCode;

  const message =
    err.message || errors[ErrorSelector.INTERNAL_ERROR].message;

  return res.status(statusCode).json({
    success: false,
    error: {
      message,
    },
  });
};