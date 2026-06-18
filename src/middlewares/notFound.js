import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

export const notFound = (req, res, next) => {
  next(new AppError(ErrorSelector.NOT_FOUND, 'Route not found'));
};