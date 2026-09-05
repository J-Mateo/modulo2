import { Prisma } from '@prisma/client';

import prisma from '../config/prismaClient.js';

import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

const cartInclude = {
  items: {
    include: {
      product: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
};

const validatePositiveInteger = (
  value,
  errorMessage = 'Invalid numeric value'
) => {
  const parsedValue =
    Number(value);

  if (
    !Number.isInteger(
      parsedValue
    ) ||
    parsedValue <= 0
  ) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      errorMessage
    );
  }

  return parsedValue;
};

const findActiveCart = (
  databaseClient,
  userId
) => {
  return databaseClient.cart.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
    include: cartInclude,
  });
};

const getOrCreateActiveCart =
  async (
    userId
  ) => {
    const cleanUserId =
      validatePositiveInteger(
        userId,
        'Invalid user'
      );

    const existingCart =
      await findActiveCart(
        prisma,
        cleanUserId
      );

    if (existingCart) {
      return existingCart;
    }

    try {
      return await prisma.cart.create({
        data: {
          userId:
            cleanUserId,
        },
        include:
          cartInclude,
      });
    } catch (error) {
      if (
        error?.code ===
        'P2002'
      ) {
        const concurrentCart =
          await findActiveCart(
            prisma,
            cleanUserId
          );

        if (
          concurrentCart
        ) {
          return concurrentCart;
        }
      }

      throw error;
    }
  };

const addItemToCart =
  async ({
    userId,
    productId,
    quantity,
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

    const cleanQuantity =
      validatePositiveInteger(
        quantity,
        'Quantity must be a positive integer'
      );

    const product =
      await prisma.product.findFirst({
        where: {
          id:
            cleanProductId,
          isActive: true,
        },
        select: {
          id: true,
          stock: true,
        },
      });

    if (!product) {
      throw new AppError(
        ErrorSelector.NOT_FOUND,
        'Product not found or unavailable'
      );
    }

    const cart =
      await getOrCreateActiveCart(
        cleanUserId
      );

    const existingItem =
      cart.items.find(
        (item) =>
          item.productId ===
          cleanProductId
      );

    const currentQuantity =
      existingItem
        ?.quantity ?? 0;

    const newQuantity =
      currentQuantity +
      cleanQuantity;

    if (
      newQuantity >
      product.stock
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Insufficient stock'
      );
    }

    if (existingItem) {
      await prisma.cartItem.update({
        where: {
          id:
            existingItem.id,
        },
        data: {
          quantity:
            newQuantity,
        },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId:
            cart.id,
          productId:
            cleanProductId,
          quantity:
            cleanQuantity,
        },
      });
    }

    return findActiveCart(
      prisma,
      cleanUserId
    );
  };

const updateItemQuantity =
  async ({
    userId,
    itemId,
    quantity,
  }) => {
    const cleanUserId =
      validatePositiveInteger(
        userId,
        'Invalid user'
      );

    const cleanItemId =
      validatePositiveInteger(
        itemId,
        'Invalid cart item'
      );

    const cleanQuantity =
      validatePositiveInteger(
        quantity,
        'Quantity must be a positive integer'
      );

    const cart =
      await findActiveCart(
        prisma,
        cleanUserId
      );

    if (!cart) {
      throw new AppError(
        ErrorSelector.NOT_FOUND,
        'Active cart not found'
      );
    }

    const item =
      await prisma.cartItem.findFirst({
        where: {
          id:
            cleanItemId,
          cartId:
            cart.id,
        },
        include: {
          product: {
            select: {
              id: true,
              stock: true,
              isActive: true,
            },
          },
        },
      });

    if (!item) {
      throw new AppError(
        ErrorSelector.NOT_FOUND,
        'Cart item not found'
      );
    }

    if (
      !item.product
        .isActive
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Product is no longer available'
      );
    }

    if (
      cleanQuantity >
      item.product.stock
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Insufficient stock'
      );
    }

    await prisma.cartItem.update({
      where: {
        id:
          cleanItemId,
      },
      data: {
        quantity:
          cleanQuantity,
      },
    });

    return findActiveCart(
      prisma,
      cleanUserId
    );
  };

const removeItemFromCart =
  async ({
    userId,
    itemId,
  }) => {
    const cleanUserId =
      validatePositiveInteger(
        userId,
        'Invalid user'
      );

    const cleanItemId =
      validatePositiveInteger(
        itemId,
        'Invalid cart item'
      );

    const cart =
      await findActiveCart(
        prisma,
        cleanUserId
      );

    if (!cart) {
      throw new AppError(
        ErrorSelector.NOT_FOUND,
        'Active cart not found'
      );
    }

    const item =
      await prisma.cartItem.findFirst({
        where: {
          id:
            cleanItemId,
          cartId:
            cart.id,
        },
        select: {
          id: true,
        },
      });

    if (!item) {
      throw new AppError(
        ErrorSelector.NOT_FOUND,
        'Cart item not found'
      );
    }

    await prisma.cartItem.delete({
      where: {
        id:
          item.id,
      },
    });

    return findActiveCart(
      prisma,
      cleanUserId
    );
  };

const checkout = async (
  userId
) => {
  const cleanUserId =
    validatePositiveInteger(
      userId,
      'Invalid user'
    );

  return prisma.$transaction(
    async (tx) => {
      const cart =
        await findActiveCart(
          tx,
          cleanUserId
        );

      if (
        !cart ||
        cart.items.length ===
          0
      ) {
        throw new AppError(
          ErrorSelector.BAD_REQUEST,
          'Cart is empty'
        );
      }

      let total =
        new Prisma.Decimal(
          0
        );

      for (
        const item of
        cart.items
      ) {
        const product =
          item.product;

        if (
          !product.isActive
        ) {
          throw new AppError(
            ErrorSelector.BAD_REQUEST,
            `${product.name} is no longer available`
          );
        }

        const stockUpdate =
          await tx.product.updateMany({
            where: {
              id:
                product.id,
              isActive: true,
              stock: {
                gte:
                  item.quantity,
              },
            },
            data: {
              stock: {
                decrement:
                  item.quantity,
              },
            },
          });

        if (
          stockUpdate.count !==
          1
        ) {
          throw new AppError(
            ErrorSelector.BAD_REQUEST,
            `Insufficient stock for ${product.name}`
          );
        }

        const lineTotal =
          product.price.mul(
            item.quantity
          );

        total =
          total.add(
            lineTotal
          );
      }

      const order =
        await tx.order.create({
          data: {
            userId:
              cleanUserId,
            status:
              'PAID',
            total,
            items: {
              create:
                cart.items.map(
                  (
                    item
                  ) => ({
                    productId:
                      item.productId,
                    quantity:
                      item.quantity,
                    productName:
                      item.product
                        .name,
                    productImage:
                      item.product
                        .images?.[0] ??
                      null,
                    priceAtPurchase:
                      item.product
                        .price,
                  })
                ),
            },
          },
          include: {
            items: true,
          },
        });

      await tx.cart.update({
        where: {
          id:
            cart.id,
        },
        data: {
          status:
            'CHECKED_OUT',
        },
      });

      return order;
    }
  );
};

export const cartService = {
  getOrCreateActiveCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  checkout,
};