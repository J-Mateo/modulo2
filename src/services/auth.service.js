import bcrypt from 'bcrypt';

import prisma from '../config/prismaClient.js';
import { generateToken } from '../utils/token.js';
import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

const buildAuthResponse = (user) => {
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  };
};

const register = async ({ name, email, password }) => {
  if (!name?.trim() || !email?.trim() || !password) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Name, email and password are required'
    );
  }

  const normalizedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new AppError(
      ErrorSelector.CONFLICT,
      'User already exists'
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return buildAuthResponse(user);
};

const login = async ({ email, password }) => {
  if (!email?.trim() || !password) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Email and password are required'
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new AppError(
      ErrorSelector.UNAUTHORIZED,
      'Invalid email or password'
    );
  }

  const isValidPassword = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isValidPassword) {
    throw new AppError(
      ErrorSelector.UNAUTHORIZED,
      'Invalid email or password'
    );
  }

  return buildAuthResponse(user);
};

export const authService = {
  register,
  login,
};