import { Prisma } from '@prisma/client';

import prisma from '../config/prismaClient.js';

import { stripeService } from './stripe.service.js';

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

const orderInclude = {
  items: true,
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

    include:
      cartInclude,
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

          isActive:
            true,
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

const reserveCartOrder =
  async (
    userId
  ) => {
    return prisma.$transaction(
      async (tx) => {
        const cart =
          await findActiveCart(
            tx,
            userId
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

                isActive:
                  true,

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
              userId,

              status:
                'PENDING',

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

            include:
              orderInclude,
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

        return {
          order,
          cartId:
            cart.id,
        };
      }
    );
  };

const compensateCartOrder =
  async ({
    orderId,
    cartId,
  }) => {
    await prisma.$transaction(
      async (tx) => {
        const order =
          await tx.order.findUnique({
            where: {
              id:
                orderId,
            },

            include:
              orderInclude,
          });

        if (
          !order ||
          order.status !==
            'PENDING'
        ) {
          return;
        }

        const cancelled =
          await tx.order.updateMany({
            where: {
              id:
                order.id,

              status:
                'PENDING',
            },

            data: {
              status:
                'CANCELLED',
            },
          });

        if (
          cancelled.count !==
          1
        ) {
          return;
        }

        for (
          const item of
          order.items
        ) {
          if (
            item.productId ===
            null
          ) {
            continue;
          }

          await tx.product.update({
            where: {
              id:
                item.productId,
            },

            data: {
              stock: {
                increment:
                  item.quantity,
              },
            },
          });
        }

        await tx.cart.updateMany({
          where: {
            id:
              cartId,

            userId:
              order.userId,

            status:
              'CHECKED_OUT',
          },

          data: {
            status:
              'ACTIVE',
          },
        });
      }
    );
  };

const compensateBuyNowOrder =
  async (
    orderId
  ) => {
    await prisma.$transaction(
      async (tx) => {
        const order =
          await tx.order.findUnique({
            where: {
              id:
                orderId,
            },

            include:
              orderInclude,
          });

        if (
          !order ||
          order.status !==
            'PENDING'
        ) {
          return;
        }

        const cancelled =
          await tx.order.updateMany({
            where: {
              id:
                order.id,

              status:
                'PENDING',
            },

            data: {
              status:
                'CANCELLED',
            },
          });

        if (
          cancelled.count !==
          1
        ) {
          return;
        }

        for (
          const item of
          order.items
        ) {
          if (
            item.productId ===
            null
          ) {
            continue;
          }

          await tx.product.update({
            where: {
              id:
                item.productId,
            },

            data: {
              stock: {
                increment:
                  item.quantity,
              },
            },
          });
        }
      }
    );
  };

const compensateCheckout =
  async ({
    orderId,
    cartId = null,
  }) => {
    if (cartId) {
      await compensateCartOrder({
        orderId,
        cartId,
      });

      return;
    }

    await compensateBuyNowOrder(
      orderId
    );
  };

const compensateCheckoutSafely =
  async ({
    orderId,
    cartId = null,
    context,
  }) => {
    try {
      await compensateCheckout({
        orderId,
        cartId,
      });

      return true;
    } catch (
      compensationError
    ) {
      console.error(
        '[CHECKOUT_COMPENSATION_FAILED]',
        {
          orderId,
          context,
          error:
            compensationError,
        }
      );

      return false;
    }
  };

const createStripeCheckout =
  async ({
    order,
    cartId = null,
  }) => {
    const user =
      await prisma.user.findUnique({
        where: {
          id:
            order.userId,
        },

        select: {
          email: true,
        },
      });

    if (!user) {
      await compensateCheckoutSafely({
        orderId:
          order.id,

        cartId,

        context:
          'user_not_found',
      });

      throw new AppError(
        ErrorSelector.NOT_FOUND,
        'User not found'
      );
    }

    let session;

    /*
     * Phase 1:
     * create the Stripe Checkout Session.
     *
     * If Stripe creation itself fails, there is no
     * confirmed Checkout Session available to the
     * application, so the local reservation is
     * compensated immediately.
     */
    try {
      session =
        await stripeService.createCheckoutSession({
          order,
          userEmail:
            user.email,
        });

      if (
        !session?.id ||
        !session?.url
      ) {
        throw new Error(
          'Stripe Checkout Session is invalid'
        );
      }
    } catch (error) {
      await compensateCheckoutSafely({
        orderId:
          order.id,

        cartId,

        context:
          'stripe_session_creation_failed',
      });

      throw error;
    }

    /*
     * Phase 2:
     * persist the Stripe Checkout Session ID.
     *
     * At this point Stripe has returned a valid
     * session. If the database write fails, we must
     * not restore stock while that Stripe session
     * could still be payable.
     */
    try {
      await prisma.order.update({
        where: {
          id:
            order.id,
        },

        data: {
          stripeCheckoutSessionId:
            session.id,
        },
      });
    } catch (databaseError) {
      let stripeSessionExpired =
        false;

      try {
        await stripeService
          .expireCheckoutSession(
            session.id
          );

        stripeSessionExpired =
          true;
      } catch (
        expirationError
      ) {
        console.error(
          '[CRITICAL_CHECKOUT_DESYNC]',
          {
            orderId:
              order.id,

            stripeCheckoutSessionId:
              session.id,

            databaseError,

            expirationError,

            message:
              'Stripe Checkout Session persistence failed and session expiration could not be confirmed. Order remains PENDING and stock remains reserved.',
          }
        );
      }

      /*
       * Only compensate after Stripe confirms that
       * the Checkout Session has been expired.
       *
       * If expiration cannot be confirmed, keeping
       * the order PENDING and the stock reserved is
       * the conservative state: the external session
       * may still be payable.
       */
      if (
        stripeSessionExpired
      ) {
        await compensateCheckoutSafely({
          orderId:
            order.id,

          cartId,

          context:
            'stripe_session_persistence_failed_after_confirmed_expiration',
        });
      }

      throw databaseError;
    }

    return {
      orderId:
        order.id,

      checkoutUrl:
        session.url,
    };
  };

const checkout = async (
  userId
) => {
  const cleanUserId =
    validatePositiveInteger(
      userId,
      'Invalid user'
    );

  const {
    order,
    cartId,
  } =
    await reserveCartOrder(
      cleanUserId
    );

  return createStripeCheckout({
    order,
    cartId,
  });
};

const reserveBuyNowOrder =
  async ({
    userId,
    productId,
    quantity,
  }) => {
    return prisma.$transaction(
      async (tx) => {
        const product =
          await tx.product.findFirst({
            where: {
              id:
                productId,

              isActive:
                true,
            },
          });

        if (!product) {
          throw new AppError(
            ErrorSelector.NOT_FOUND,
            'Product not found or unavailable'
          );
        }

        const stockUpdate =
          await tx.product.updateMany({
            where: {
              id:
                productId,

              isActive:
                true,

              stock: {
                gte:
                  quantity,
              },
            },

            data: {
              stock: {
                decrement:
                  quantity,
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

        const total =
          product.price.mul(
            quantity
          );

        return tx.order.create({
          data: {
            userId,

            status:
              'PENDING',

            total,

            items: {
              create: {
                productId:
                  product.id,

                quantity,

                productName:
                  product.name,

                productImage:
                  product
                    .images?.[0] ??
                  null,

                priceAtPurchase:
                  product.price,
              },
            },
          },

          include:
            orderInclude,
        });
      }
    );
  };

const buyNow = async ({
  userId,
  productId,
  quantity = 1,
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

  const order =
    await reserveBuyNowOrder({
      userId:
        cleanUserId,

      productId:
        cleanProductId,

      quantity:
        cleanQuantity,
    });

  return createStripeCheckout({
    order,
  });
};

export const cartService = {
  getOrCreateActiveCart,
  addItemToCart,
  updateItemQuantity,
  removeItemFromCart,
  checkout,
  buyNow,
};