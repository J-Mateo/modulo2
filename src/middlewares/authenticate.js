import { verifyToken } from '../utils/token.js';
import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(ErrorSelector.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    req.user = payload;

    next();
  } catch (err) {
    next(new AppError(ErrorSelector.UNAUTHORIZED));
  }
};