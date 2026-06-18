import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new AppError(ErrorSelector.UNAUTHORIZED);
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw new AppError(ErrorSelector.FORBIDDEN);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};