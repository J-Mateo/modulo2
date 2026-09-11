import prisma from '../config/prismaClient.js';

import {
  AppError,
} from '../utils/AppError.js';

import {
  ErrorSelector,
} from '../utils/errors.js';

const getProfile = async (
  userId
) => {
  const user =
    await prisma.user.findUnique({
      where: {
        id:
          Number(userId),
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  if (!user) {
    throw new AppError(
      ErrorSelector.NOT_FOUND
    );
  }

  return user;
};

const getAdminUsers = async ({
  page = 1,
  limit = 20,
  search = '',
  role = '',
}) => {
  const where = {};

  if (role) {
    where.role = role;
  }

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        email: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  const skip =
    (page - 1) *
    limit;

  const [
    users,
    total,
  ] =
    await Promise.all([
      prisma.user.findMany({
        where,

        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,

          _count: {
            select: {
              orders: true,
            },
          },
        },

        orderBy: [
          {
            createdAt:
              'desc',
          },
          {
            id: 'desc',
          },
        ],

        skip,
        take: limit,
      }),

      prisma.user.count({
        where,
      }),
    ]);

  return {
    users:
      users.map(
        (user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt:
            user.createdAt,
          updatedAt:
            user.updatedAt,
          ordersCount:
            user._count
              .orders,
        })
      ),

    meta: {
      page,
      limit,
      total,
      totalPages:
        Math.ceil(
          total / limit
        ),
    },
  };
};

export const usersService = {
  getProfile,
  getAdminUsers,
};