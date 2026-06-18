import prisma from '../config/prismaClient.js';
import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(ErrorSelector.NOT_FOUND);
  }

  return user;
};

export const usersService = {
  getProfile,
};