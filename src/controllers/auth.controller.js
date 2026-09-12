import {
  authService,
} from '../services/auth.service.js';

import env from '../config/env.js';

import {
  sendSuccess,
} from '../utils/responses.js';

const AUTH_COOKIE_NAME =
  'access_token';

const isProduction =
  env.NODE_ENV ===
  'production';

const authCookieOptions = {
  httpOnly:
    true,

  secure:
    isProduction,

  sameSite:
    isProduction
      ? 'none'
      : 'lax',

  path:
    '/',
};

const setAuthCookie = (
  res,
  token
) => {
  res.cookie(
    AUTH_COOKIE_NAME,
    token,
    {
      ...authCookieOptions,

      maxAge:
        7 *
        24 *
        60 *
        60 *
        1000,
    }
  );
};

const register = async (
  req,
  res,
  next
) => {
  try {
    const {
      token,
      user,
    } =
      await authService
        .register(
          req.body
        );

    setAuthCookie(
      res,
      token
    );

    return sendSuccess(
      res,
      {
        statusCode:
          201,

        data: {
          user,
        },
      }
    );
  } catch (err) {
    next(err);
  }
};

const login = async (
  req,
  res,
  next
) => {
  try {
    const {
      token,
      user,
    } =
      await authService
        .login(
          req.body
        );

    setAuthCookie(
      res,
      token
    );

    return sendSuccess(
      res,
      {
        data: {
          user,
        },
      }
    );
  } catch (err) {
    next(err);
  }
};

const logout = async (
  req,
  res,
  next
) => {
  try {
    res.clearCookie(
      AUTH_COOKIE_NAME,
      authCookieOptions
    );

    return sendSuccess(
      res,
      {
        message:
          'Sesión cerrada correctamente',
      }
    );
  } catch (err) {
    next(err);
  }
};

const forgotPassword =
  async (
    req,
    res,
    next
  ) => {
    try {
      await authService
        .forgotPassword(
          req.body
        );

      return sendSuccess(
        res,
        {
          message:
            'Si existe una cuenta asociada a ese correo, recibirás instrucciones para restablecer la contraseña.',
        }
      );
    } catch (err) {
      next(err);
    }
  };

const resetPassword =
  async (
    req,
    res,
    next
  ) => {
    try {
      await authService
        .resetPassword(
          req.body
        );

      return sendSuccess(
        res,
        {
          message:
            'Contraseña actualizada correctamente. Ya puedes iniciar sesión.',
        }
      );
    } catch (err) {
      next(err);
    }
  };

export const authController = {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
};