import rateLimit from 'express-rate-limit';

import env from '../config/env.js';

import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

const createAuthLimiter = ({
  windowMs,
  max,
  message,
  skipSuccessfulRequests = false,
}) =>
  rateLimit({
    windowMs,
    max,

    standardHeaders: true,
    legacyHeaders: false,

    skipSuccessfulRequests,

    /*
     * Los tests automatizados no deben
     * depender del estado interno del
     * rate limiter.
     *
     * En development/production sigue
     * funcionando normalmente.
     */
    skip: () =>
      env.NODE_ENV === 'test',

    handler: (
      req,
      res,
      next
    ) => {
      next(
        new AppError(
          ErrorSelector.TOO_MANY_REQUESTS,
          message
        )
      );
    },
  });

export const loginLimiter =
  createAuthLimiter({
    windowMs:
      15 * 60 * 1000,

    max: 10,

    skipSuccessfulRequests:
      true,

    message:
      'Demasiados intentos de inicio de sesión. Inténtalo de nuevo más tarde.',
  });

export const registerLimiter =
  createAuthLimiter({
    windowMs:
      60 * 60 * 1000,

    max: 10,

    message:
      'Demasiados intentos de registro. Inténtalo de nuevo más tarde.',
  });

export const forgotPasswordLimiter =
  createAuthLimiter({
    windowMs:
      15 * 60 * 1000,

    max: 5,

    message:
      'Demasiadas solicitudes de recuperación. Inténtalo de nuevo más tarde.',
  });

export const resetPasswordLimiter =
  createAuthLimiter({
    windowMs:
      15 * 60 * 1000,

    max: 10,

    message:
      'Demasiados intentos de cambio de contraseña. Inténtalo de nuevo más tarde.',
  });