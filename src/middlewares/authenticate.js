import { verifyToken } from '../utils/token.js';
import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const bearerToken =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    const cookieToken = req.cookies?.access_token;

    const token = cookieToken || bearerToken;

    const payload = verifyToken(token);

    req.user = payload;

    next();
  } catch (err) {
    next(new AppError(ErrorSelector.UNAUTHORIZED));
  }
};