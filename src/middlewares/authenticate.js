import prisma from '../config/prismaClient.js';

import {
  verifyToken,
} from '../utils/token.js';

import {
  AppError,
} from '../utils/AppError.js';

import {
  ErrorSelector,
} from '../utils/errors.js';

export const authenticate =
  async (
    req,
    res,
    next
  ) => {
    const token =
      req.cookies
        ?.access_token;

    if (!token) {
      return next(
        new AppError(
          ErrorSelector.UNAUTHORIZED
        )
      );
    }

    try {
      const payload =
        verifyToken(
          token
        );

      const userId =
        Number(
          payload.userId
        );

      const authVersion =
        Number(
          payload.authVersion
        );

      if (
        !Number.isInteger(
          userId
        ) ||
        !Number.isInteger(
          authVersion
        )
      ) {
        throw new Error(
          'Invalid authentication payload'
        );
      }

      const user =
        await prisma.user.findUnique({
          where: {
            id:
              userId,
          },

          select: {
            id:
              true,

            email:
              true,

            role:
              true,

            authVersion:
              true,
          },
        });

      if (
        !user ||
        user.authVersion !==
          authVersion
      ) {
        throw new Error(
          'Authentication session is no longer valid'
        );
      }

      req.user = {
        userId:
          user.id,

        email:
          user.email,

        role:
          user.role,

        authVersion:
          user.authVersion,
      };

      return next();
    } catch {
      return next(
        new AppError(
          ErrorSelector.UNAUTHORIZED
        )
      );
    }
  };