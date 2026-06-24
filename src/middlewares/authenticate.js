import { verifyToken } from '../utils/token.js';
import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

export const authenticate = (req, res, next) => {
  try {
    const token = req.cookies?.access_token;

    if (!token) {
      throw new AppError(ErrorSelector.UNAUTHORIZED);
    }

    const payload = verifyToken(token);

    req.user = payload;

    next();
  } catch (err) {
    next(new AppError(ErrorSelector.UNAUTHORIZED));
  }
};