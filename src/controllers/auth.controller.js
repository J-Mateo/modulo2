import { authService } from '../services/auth.service.js';
import env from '../config/env.js';
import { sendSuccess } from '../utils/responses.js';

const AUTH_COOKIE_NAME = 'access_token';

const authCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
};

const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, {
    ...authCookieOptions,
    maxAge: 60 * 60 * 1000,
  });
};

const register = async (req, res, next) => {
  try {
    const { token, user } = await authService.register(req.body);

    setAuthCookie(res, token);

    return sendSuccess(res, {
      statusCode: 201,
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { token, user } = await authService.login(req.body);

    setAuthCookie(res, token);

    return sendSuccess(res, {
      data: { user },
    });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie(AUTH_COOKIE_NAME, authCookieOptions);

    return sendSuccess(res, {
      message: 'Sesión cerrada correctamente',
    });
  } catch (err) {
    next(err);
  }
};

export const authController = {
  register,
  login,
  logout,
};