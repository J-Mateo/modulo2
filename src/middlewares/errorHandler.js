import { ErrorSelector, errors } from '../utils/errors.js';
import { sendError } from '../utils/responses.js';

export const errorHandler = (err, req, res, next) => {
  const internalError = errors[ErrorSelector.INTERNAL_ERROR];

  const isOperational = err?.isOperational === true;

  const statusCode = isOperational
    ? err.statusCode
    : internalError.statusCode;

  const code = isOperational
    ? err.type
    : ErrorSelector.INTERNAL_ERROR;

  const message = isOperational
    ? err.message
    : internalError.message;

  if (!isOperational) {
    console.error(err);
  }

  return sendError(res, {
    statusCode,
    code,
    message,
  });
};