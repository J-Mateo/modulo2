import bcrypt from 'bcrypt';

import {
  createHash,
  randomBytes,
} from 'node:crypto';

import prisma from '../config/prismaClient.js';

import {
  generateToken,
} from '../utils/token.js';

import {
  AppError,
} from '../utils/AppError.js';

import {
  ErrorSelector,
} from '../utils/errors.js';

import {
  getPasswordValidationMessage,
  validatePassword,
} from '../utils/passwordPolicy.js';

import {
  emailService,
} from './email.service.js';

const PASSWORD_HASH_ROUNDS =
  10;

const PASSWORD_RESET_TOKEN_BYTES =
  32;

const PASSWORD_RESET_EXPIRES_MS =
  15 * 60 * 1000;

const buildAuthResponse = (
  user
) => {
  const token =
    generateToken({
      userId:
        user.id,

      email:
        user.email,

      role:
        user.role,

      authVersion:
        user.authVersion,
    });

  return {
    token,

    user: {
      id:
        user.id,

      name:
        user.name,

      email:
        user.email,

      role:
        user.role,

      createdAt:
        user.createdAt,
    },
  };
};

const assertValidPassword = (
  password
) => {
  const {
    isValid,
    errors,
  } =
    validatePassword(
      password
    );

  if (!isValid) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      getPasswordValidationMessage(
        errors
      )
    );
  }
};

const hashResetToken = (
  token
) => {
  return createHash(
    'sha256'
  )
    .update(token)
    .digest('hex');
};

const register = async ({
  name,
  email,
  password,
}) => {
  if (
    !name?.trim() ||
    !email?.trim() ||
    !password
  ) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Name, email and password are required'
    );
  }

  assertValidPassword(
    password
  );

  const normalizedName =
    name.trim();

  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  const existingUser =
    await prisma.user.findUnique({
      where: {
        email:
          normalizedEmail,
      },
    });

  if (existingUser) {
    throw new AppError(
      ErrorSelector.CONFLICT,
      'User already exists'
    );
  }

  const passwordHash =
    await bcrypt.hash(
      password,
      PASSWORD_HASH_ROUNDS
    );

  const user =
    await prisma.user.create({
      data: {
        name:
          normalizedName,

        email:
          normalizedEmail,

        passwordHash,
      },

      select: {
        id:
          true,

        name:
          true,

        email:
          true,

        role:
          true,

        authVersion:
          true,

        createdAt:
          true,
      },
    });

  try {
    await emailService
      .sendWelcomeEmail({
        to:
          user.email,

        userName:
          user.name,
      });
  } catch (error) {
    console.error(
      'Welcome email error:',
      error?.message ||
        error
    );
  }

  return buildAuthResponse(
    user
  );
};

const login = async ({
  email,
  password,
}) => {
  if (
    !email?.trim() ||
    !password
  ) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Email and password are required'
    );
  }

  const normalizedEmail =
    email
      .trim()
      .toLowerCase();

  const user =
    await prisma.user.findUnique({
      where: {
        email:
          normalizedEmail,
      },
    });

  if (!user) {
    throw new AppError(
      ErrorSelector.UNAUTHORIZED,
      'Invalid email or password'
    );
  }

  const isValidPassword =
    await bcrypt.compare(
      password,
      user.passwordHash
    );

  if (!isValidPassword) {
    throw new AppError(
      ErrorSelector.UNAUTHORIZED,
      'Invalid email or password'
    );
  }

  return buildAuthResponse(
    user
  );
};

const forgotPassword =
  async ({
    email,
  }) => {
    if (
      typeof email !==
        'string' ||
      !email.trim()
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Email is required'
      );
    }

    const normalizedEmail =
      email
        .trim()
        .toLowerCase();

    const user =
      await prisma.user.findUnique({
        where: {
          email:
            normalizedEmail,
        },

        select: {
          id:
            true,

          name:
            true,

          email:
            true,
        },
      });

    /*
     * Evitamos enumeración de usuarios.
     *
     * El controller devolverá exactamente
     * la misma respuesta exista o no
     * esta dirección.
     */
    if (!user) {
      return;
    }

    const resetToken =
      randomBytes(
        PASSWORD_RESET_TOKEN_BYTES
      ).toString(
        'hex'
      );

    const resetTokenHash =
      hashResetToken(
        resetToken
      );

    const resetExpiresAt =
      new Date(
        Date.now() +
          PASSWORD_RESET_EXPIRES_MS
      );

    await prisma.user.update({
      where: {
        id:
          user.id,
      },

      data: {
        passwordResetTokenHash:
          resetTokenHash,

        passwordResetExpiresAt:
          resetExpiresAt,
      },
    });

    try {
      await emailService
        .sendPasswordResetEmail({
          to:
            user.email,

          userName:
            user.name,

          token:
            resetToken,
        });
    } catch (error) {
      /*
       * Si Resend falla, anulamos
       * ese token.
       *
       * updateMany evita borrar un
       * token más reciente si el usuario
       * lanzó otra petición mientras
       * esta estaba procesándose.
       */
      await prisma.user.updateMany({
        where: {
          id:
            user.id,

          passwordResetTokenHash:
            resetTokenHash,
        },

        data: {
          passwordResetTokenHash:
            null,

          passwordResetExpiresAt:
            null,
        },
      });

      console.error(
        'Password reset email error:',
        error?.message ||
          error
      );
    }
  };

const resetPassword =
  async ({
    token,
    password,
  }) => {
    if (
      typeof token !==
        'string' ||
      !token.trim() ||
      !password
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Reset token and password are required'
      );
    }

    assertValidPassword(
      password
    );

    const resetTokenHash =
      hashResetToken(
        token.trim()
      );

    const passwordHash =
      await bcrypt.hash(
        password,
        PASSWORD_HASH_ROUNDS
      );

    /*
     * updateMany hace la comprobación
     * y el consumo del token de forma
     * atómica.
     *
     * Dos peticiones simultáneas no
     * pueden consumir correctamente
     * el mismo token.
     */
    const result =
      await prisma.user.updateMany({
        where: {
          passwordResetTokenHash:
            resetTokenHash,

          passwordResetExpiresAt: {
            gt:
              new Date(),
          },
        },

        data: {
          passwordHash,

          passwordResetTokenHash:
            null,

          passwordResetExpiresAt:
            null,

          authVersion: {
            increment:
              1,
          },
        },
      });

    if (
      result.count !==
      1
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Invalid or expired password reset token'
      );
    }
  };

export const authService = {
  register,
  login,
  forgotPassword,
  resetPassword,
};