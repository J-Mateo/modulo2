import { errors, ErrorSelector } from '../misc/errors.js';

export const errorHandler = (err, req, res, next) => {
  if (err.type && errors[err.type]) {
    return res.status(errors[err.type].statusCode).json({
      ok: false,
      error: {
        message: errors[err.type].message,
      },
    });
  }

  return res.status(500).json({
    ok: false,
    error: {
      message: errors[ErrorSelector.INTERNAL_ERROR].message,
    },
  });
};