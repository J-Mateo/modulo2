import bcrypt from 'bcrypt';
import prisma from '../config/prismaClient.js';
import { generateToken } from '../utils/token.js';
import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

const register = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Email and password are required'
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(ErrorSelector.CONFLICT, 'User already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return user;
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Email and password are required'
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(ErrorSelector.UNAUTHORIZED, 'Invalid email or password');
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError(ErrorSelector.UNAUTHORIZED, 'Invalid email or password');
  }

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  };
};

export const authService = {
  register,
  login,
};