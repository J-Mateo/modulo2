import { verifyToken } from '../utils/token.js';
import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

export const authenticate = (req, res, next) => {
  const token = req.cookies?.access_token;

  if (!token) {
    return next(new AppError(ErrorSelector.UNAUTHORIZED));
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return next(new AppError(ErrorSelector.UNAUTHORIZED));
  }
};