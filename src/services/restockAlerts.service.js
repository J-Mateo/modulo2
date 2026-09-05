import prisma from '../config/prismaClient.js';

import { emailService } from './email.service.js';

import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

const validatePositiveInteger = (
  value,
  errorMessage = 'Invalid numeric value'
) => {
  const parsedValue = Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue <= 0
  ) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      errorMessage
    );
  }

  return parsedValue;
};

const subscribe = async ({
  userId,
  productId,
}) => {
  const cleanUserId =
    validatePositiveInteger(
      userId,
      'Invalid user'
    );

  const cleanProductId =
    validatePositiveInteger(
      productId,
      'Invalid product'
    );

  const product =
    await prisma.product.findFirst({
      where: {
        id: cleanProductId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        stock: true,
      },
    });

  if (!product) {
    throw new AppError(
      ErrorSelector.NOT_FOUND,
      'Product not found or unavailable'
    );
  }

  if (product.stock > 0) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Product is already available'
    );
  }

  return prisma.restockAlert.upsert({
    where: {
      userId_productId: {
        userId: cleanUserId,
        productId: cleanProductId,
      },
    },

    create: {
      userId: cleanUserId,
      productId: cleanProductId,
      status: 'PENDING',
    },

    update: {
      status: 'PENDING',
      notifiedAt: null,
      cancelledAt: null,
    },

    include: {
      product: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

const cancel = async ({
  userId,
  productId,
}) => {
  const cleanUserId =
    validatePositiveInteger(
      userId,
      'Invalid user'
    );

  const cleanProductId =
    validatePositiveInteger(
      productId,
      'Invalid product'
    );

  const alert =
    await prisma.restockAlert.findUnique({
      where: {
        userId_productId: {
          userId: cleanUserId,
          productId: cleanProductId,
        },
      },
    });

  if (!alert) {
    throw new AppError(
      ErrorSelector.NOT_FOUND,
      'Restock alert not found'
    );
  }

  if (alert.status === 'CANCELLED') {
    return alert;
  }

  return prisma.restockAlert.update({
    where: {
      id: alert.id,
    },

    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });
};

const getSubscription = async ({
  userId,
  productId,
}) => {
  const cleanUserId =
    validatePositiveInteger(
      userId,
      'Invalid user'
    );

  const cleanProductId =
    validatePositiveInteger(
      productId,
      'Invalid product'
    );

  return prisma.restockAlert.findUnique({
    where: {
      userId_productId: {
        userId: cleanUserId,
        productId: cleanProductId,
      },
    },
    select: {
      id: true,
      productId: true,
      status: true,
      createdAt: true,
      notifiedAt: true,
      cancelledAt: true,
    },
  });
};

const notifyPendingAlerts = async (
  product
) => {
  if (
    !product ||
    Number(product.stock) <= 0
  ) {
    return {
      notified: 0,
      failed: 0,
    };
  }

  const alerts =
    await prisma.restockAlert.findMany({
      where: {
        productId: Number(product.id),
        status: 'PENDING',
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

  if (alerts.length === 0) {
    return {
      notified: 0,
      failed: 0,
    };
  }

  let notified = 0;
  let failed = 0;

  for (const alert of alerts) {
    try {
      await emailService.sendRestockEmail({
        to: alert.user.email,
        userName: alert.user.name,
        product,
      });

      await prisma.restockAlert.update({
        where: {
          id: alert.id,
        },

        data: {
          status: 'NOTIFIED',
          notifiedAt: new Date(),
          cancelledAt: null,
        },
      });

      notified += 1;
    } catch (error) {
      failed += 1;

      console.error(
        `Restock notification failed for alert ${alert.id}:`,
        error?.message || error
      );
    }
  }

  return {
    notified,
    failed,
  };
};

export const restockAlertsService = {
  subscribe,
  cancel,
  getSubscription,
  notifyPendingAlerts,
};