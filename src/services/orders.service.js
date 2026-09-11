import prisma from '../config/prismaClient.js';

import {
  AppError,
} from '../utils/AppError.js';

import {
  ErrorSelector,
} from '../utils/errors.js';

const ORDER_SELECT = {
  id: true,
  status: true,
  total: true,
  createdAt: true,
  updatedAt: true,

  items: {
    select: {
      id: true,
      productId: true,
      quantity: true,
      productName: true,
      productImage: true,
      priceAtPurchase: true,
    },

    orderBy: {
      id: 'asc',
    },
  },
};

const ADMIN_ORDER_SELECT = {
  ...ORDER_SELECT,

  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
};

const parseUserId = (
  userId
) => {
  const cleanUserId =
    Number(userId);

  if (
    !Number.isInteger(
      cleanUserId
    ) ||
    cleanUserId <= 0
  ) {
    throw new AppError(
      ErrorSelector.UNAUTHORIZED,
      'Unauthorized'
    );
  }

  return cleanUserId;
};

const getOrdersByUserId = async (
  userId
) => {
  const cleanUserId =
    parseUserId(userId);

  return prisma.order.findMany({
    where: {
      userId: cleanUserId,
    },

    select: ORDER_SELECT,

    orderBy: [
      {
        createdAt: 'desc',
      },
      {
        id: 'desc',
      },
    ],
  });
};

const getOrderById = async ({
  orderId,
  userId,
}) => {
  const cleanUserId =
    parseUserId(userId);

  const order =
    await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: cleanUserId,
      },

      select: ORDER_SELECT,
    });

  if (!order) {
    throw new AppError(
      ErrorSelector.NOT_FOUND,
      'Order not found'
    );
  }

  return order;
};

const buildAdminOrderWhere = ({
  search,
  status,
}) => {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    const numericSearch =
      Number(search);

    const orFilters = [
      {
        user: {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
      {
        user: {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      },
    ];

    if (
      Number.isInteger(
        numericSearch
      ) &&
      numericSearch > 0
    ) {
      orFilters.unshift({
        id: numericSearch,
      });
    }

    where.OR =
      orFilters;
  }

  return where;
};

const getAdminOrders = async ({
  page = 1,
  limit = 20,
  search = '',
  status = '',
}) => {
  const where =
    buildAdminOrderWhere({
      search,
      status,
    });

  const skip =
    (page - 1) *
    limit;

  const [
    orders,
    total,
  ] =
    await Promise.all([
      prisma.order.findMany({
        where,

        select:
          ADMIN_ORDER_SELECT,

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

      prisma.order.count({
        where,
      }),
    ]);

  return {
    orders,

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

export const ordersService = {
  getOrdersByUserId,
  getOrderById,
  getAdminOrders,
};