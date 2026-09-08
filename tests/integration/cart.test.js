import {
  jest,
} from '@jest/globals';

import request from 'supertest';

const createCheckoutSessionMock =
  jest.fn();

const expireCheckoutSessionMock =
  jest.fn();

let stripeSessionSequence = 0;

const createUniqueStripeSession =
  ({
    prefix = 'cart',
    url =
      'https://checkout.stripe.com/c/pay/test-session',
  } = {}) => {
    stripeSessionSequence += 1;

    return {
      id:
        `cs_test_${prefix}_${Date.now()}_${stripeSessionSequence}`,
      url,
    };
  };

jest.unstable_mockModule(
  '../../src/services/stripe.service.js',
  () => ({
    stripeService: {
      createCheckoutSession:
        createCheckoutSessionMock,

      expireCheckoutSession:
        expireCheckoutSessionMock,
    },
  })
);

const {
  default: app,
} = await import(
  '../../src/app.js'
);

const {
  default: prisma,
} = await import(
  '../../src/config/prismaClient.js'
);

const createdOrderIds =
  new Set();

const getAuthenticatedCookies =
  async () => {
    const loginResponse =
      await request(app)
        .post(
          '/api/auth/login'
        )
        .send({
          email:
            'user@test.com',

          password:
            'password123',
        });

    expect(
      loginResponse.statusCode
    ).toBe(200);

    return loginResponse
      .headers[
        'set-cookie'
      ];
  };

const clearUserCart =
  async (cookies) => {
    const cartResponse =
      await request(app)
        .get(
          '/api/cart'
        )
        .set(
          'Cookie',
          cookies
        );

    const items =
      cartResponse.body
        ?.data
        ?.items ?? [];

    for (
      const item of
      items
    ) {
      await request(app)
        .delete(
          `/api/cart/items/${item.id}`
        )
        .set(
          'Cookie',
          cookies
        );
    }
  };

const getAvailableProduct =
  async () => {
    const productsResponse =
      await request(app)
        .get(
          '/api/products'
        );

    expect(
      productsResponse.statusCode
    ).toBe(200);

    const product =
      productsResponse
        .body
        .data
        .find(
          (item) =>
            item.stock > 0
        );

    expect(
      product
    ).toBeDefined();

    return product;
  };

const getProductStock =
  async (productId) => {
    const product =
      await prisma.product.findUnique({
        where: {
          id: productId,
        },

        select: {
          stock: true,
        },
      });

    return product.stock;
  };

const cleanupCreatedOrders =
  async () => {
    for (
      const orderId of
      createdOrderIds
    ) {
      const order =
        await prisma.order
          .findUnique({
            where: {
              id: orderId,
            },

            include: {
              items: true,
            },
          });

      if (
        !order ||
        order.status !==
          'PENDING'
      ) {
        continue;
      }

      await prisma
        .$transaction(
          async (tx) => {
            const cancelled =
              await tx.order
                .updateMany({
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

              await tx.product
                .update({
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
    }

    createdOrderIds.clear();
  };

describe(
  'Cart endpoints',
  () => {
    beforeEach(() => {
      jest.clearAllMocks();

      createCheckoutSessionMock
        .mockImplementation(
          async () =>
            createUniqueStripeSession()
        );

      expireCheckoutSessionMock
        .mockResolvedValue({
          status: 'expired',
        });
    });

    afterEach(
      async () => {
        await cleanupCreatedOrders();
      }
    );

    it(
      'GET /api/cart should fail without token',
      async () => {
        const response =
          await request(app)
            .get(
              '/api/cart'
            );

        expect(
          response.statusCode
        ).toBe(401);

        expect(
          response.body.success
        ).toBe(false);

        expect(
          response.body.error
        ).toHaveProperty(
          'message'
        );
      }
    );

    it(
      'GET /api/cart should return cart with valid token',
      async () => {
        const cookies =
          await getAuthenticatedCookies();

        const response =
          await request(app)
            .get(
              '/api/cart'
            )
            .set(
              'Cookie',
              cookies
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data
        ).toHaveProperty(
          'id'
        );

        expect(
          response.body.data
        ).toHaveProperty(
          'userId'
        );

        expect(
          response.body.data
        ).toHaveProperty(
          'status'
        );

        expect(
          response.body.data
        ).toHaveProperty(
          'items'
        );

        expect(
          Array.isArray(
            response
              .body
              .data
              .items
          )
        ).toBe(true);
      }
    );

    it(
      'POST /api/cart/items should add product to cart with valid token',
      async () => {
        const cookies =
          await getAuthenticatedCookies();

        await clearUserCart(
          cookies
        );

        const product =
          await getAvailableProduct();

        const response =
          await request(app)
            .post(
              '/api/cart/items'
            )
            .set(
              'Cookie',
              cookies
            )
            .send({
              productId:
                product.id,

              quantity:
                1,
            });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data
        ).toHaveProperty(
          'items'
        );

        const addedItem =
          response
            .body
            .data
            .items
            .find(
              (item) =>
                item.productId ===
                product.id
            );

        expect(
          addedItem
        ).toBeDefined();

        expect(
          addedItem.quantity
        ).toBeGreaterThanOrEqual(
          1
        );
      }
    );

    it(
      'DELETE /api/cart/items/:itemId should remove product from cart with valid token',
      async () => {
        const cookies =
          await getAuthenticatedCookies();

        await clearUserCart(
          cookies
        );

        const product =
          await getAvailableProduct();

        const addResponse =
          await request(app)
            .post(
              '/api/cart/items'
            )
            .set(
              'Cookie',
              cookies
            )
            .send({
              productId:
                product.id,

              quantity:
                1,
            });

        expect(
          addResponse.statusCode
        ).toBe(200);

        const addedItem =
          addResponse
            .body
            .data
            .items
            .find(
              (item) =>
                item.productId ===
                product.id
            );

        expect(
          addedItem
        ).toBeDefined();

        const response =
          await request(app)
            .delete(
              `/api/cart/items/${addedItem.id}`
            )
            .set(
              'Cookie',
              cookies
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        const removedItem =
          response
            .body
            .data
            .items
            .find(
              (item) =>
                item.id ===
                addedItem.id
            );

        expect(
          removedItem
        ).toBeUndefined();
      }
    );

    it(
      'POST /api/cart/checkout should create a pending order and return Stripe Checkout URL',
      async () => {
        const cookies =
          await getAuthenticatedCookies();

        await clearUserCart(
          cookies
        );

        const product =
          await getAvailableProduct();

        const stripeSession =
          createUniqueStripeSession({
            prefix:
              'checkout_success',
          });

        createCheckoutSessionMock
          .mockResolvedValueOnce(
            stripeSession
          );

        const addResponse =
          await request(app)
            .post(
              '/api/cart/items'
            )
            .set(
              'Cookie',
              cookies
            )
            .send({
              productId:
                product.id,

              quantity:
                1,
            });

        expect(
          addResponse.statusCode
        ).toBe(200);

        const response =
          await request(app)
            .post(
              '/api/cart/checkout'
            )
            .set(
              'Cookie',
              cookies
            );

        expect(
          response.statusCode
        ).toBe(201);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data
        ).toEqual({
          orderId:
            expect.any(
              Number
            ),

          checkoutUrl:
            stripeSession.url,
        });

        const {
          orderId,
        } =
          response.body.data;

        createdOrderIds.add(
          orderId
        );

        expect(
          createCheckoutSessionMock
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          expireCheckoutSessionMock
        ).not.toHaveBeenCalled();

        const stripeCall =
          createCheckoutSessionMock
            .mock
            .calls[0][0];

        expect(
          stripeCall.userEmail
        ).toBe(
          'user@test.com'
        );

        expect(
          stripeCall.order.id
        ).toBe(
          orderId
        );

        expect(
          stripeCall.order.status
        ).toBe(
          'PENDING'
        );

        expect(
          stripeCall.order.items
            .length
        ).toBeGreaterThan(
          0
        );

        const order =
          await prisma.order
            .findUnique({
              where: {
                id:
                  orderId,
              },

              include: {
                items: true,
              },
            });

        expect(
          order
        ).not.toBeNull();

        expect(
          order.status
        ).toBe(
          'PENDING'
        );

        expect(
          order
            .stripeCheckoutSessionId
        ).toBe(
          stripeSession.id
        );

        expect(
          order
            .stripePaymentIntentId
        ).toBeNull();

        expect(
          order.items.length
        ).toBeGreaterThan(
          0
        );
      }
    );

    it(
      'POST /api/cart/checkout should restore stock and reactivate cart when Stripe session creation fails',
      async () => {
        const cookies =
          await getAuthenticatedCookies();

        await clearUserCart(
          cookies
        );

        const product =
          await getAvailableProduct();

        const productStockBefore =
          await getProductStock(
            product.id
          );

        const addResponse =
          await request(app)
            .post(
              '/api/cart/items'
            )
            .set(
              'Cookie',
              cookies
            )
            .send({
              productId:
                product.id,

              quantity:
                1,
            });

        expect(
          addResponse.statusCode
        ).toBe(200);

        const cartId =
          addResponse
            .body
            .data
            .id;

        createCheckoutSessionMock
          .mockRejectedValueOnce(
            new Error(
              'Stripe unavailable'
            )
          );

        const response =
          await request(app)
            .post(
              '/api/cart/checkout'
            )
            .set(
              'Cookie',
              cookies
            );

        expect(
          response.statusCode
        ).toBe(500);

        expect(
          response.body.success
        ).toBe(false);

        expect(
          expireCheckoutSessionMock
        ).not.toHaveBeenCalled();

        const productStockAfter =
          await getProductStock(
            product.id
          );

        expect(
          productStockAfter
        ).toBe(
          productStockBefore
        );

        const cart =
          await prisma.cart
            .findUnique({
              where: {
                id:
                  cartId,
              },

              select: {
                status: true,
              },
            });

        expect(
          cart.status
        ).toBe(
          'ACTIVE'
        );

        const cancelledOrder =
          await prisma.order
            .findFirst({
              where: {
                userId:
                  addResponse
                    .body
                    .data
                    .userId,

                status:
                  'CANCELLED',

                items: {
                  some: {
                    productId:
                      product.id,
                  },
                },
              },

              orderBy: {
                createdAt:
                  'desc',
              },
            });

        expect(
          cancelledOrder
        ).not.toBeNull();
      }
    );

    it(
      'POST /api/cart/checkout should expire Stripe session and compensate when session persistence fails',
      async () => {
        const cookies =
          await getAuthenticatedCookies();

        await clearUserCart(
          cookies
        );

        const product =
          await getAvailableProduct();

        const productStockBefore =
          await getProductStock(
            product.id
          );

        const addResponse =
          await request(app)
            .post(
              '/api/cart/items'
            )
            .set(
              'Cookie',
              cookies
            )
            .send({
              productId:
                product.id,

              quantity:
                1,
            });

        expect(
          addResponse.statusCode
        ).toBe(200);

        const {
          id: cartId,
          userId,
        } =
          addResponse.body.data;

        const duplicateSessionId =
          `cs_test_collision_${Date.now()}_${++stripeSessionSequence}`;

        const blockingOrder =
          await prisma.order.create({
            data: {
              userId,
              total: '0.00',
              status:
                'CANCELLED',
              stripeCheckoutSessionId:
                duplicateSessionId,
            },
          });

        createdOrderIds.add(
          blockingOrder.id
        );

        createCheckoutSessionMock
          .mockResolvedValueOnce({
            id:
              duplicateSessionId,

            url:
              'https://checkout.stripe.com/c/pay/persistence-failure',
          });

        const response =
          await request(app)
            .post(
              '/api/cart/checkout'
            )
            .set(
              'Cookie',
              cookies
            );

        expect(
          response.statusCode
        ).toBe(500);

        expect(
          expireCheckoutSessionMock
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          expireCheckoutSessionMock
        ).toHaveBeenCalledWith(
          duplicateSessionId
        );

        const productStockAfter =
          await getProductStock(
            product.id
          );

        expect(
          productStockAfter
        ).toBe(
          productStockBefore
        );

        const cart =
          await prisma.cart.findUnique({
            where: {
              id: cartId,
            },

            select: {
              status: true,
            },
          });

        expect(
          cart.status
        ).toBe(
          'ACTIVE'
        );

        const compensatedOrder =
          await prisma.order.findFirst({
            where: {
              userId,
              status:
                'CANCELLED',
              stripeCheckoutSessionId:
                null,

              items: {
                some: {
                  productId:
                    product.id,
                },
              },
            },

            orderBy: {
              createdAt:
                'desc',
            },
          });

        expect(
          compensatedOrder
        ).not.toBeNull();
      }
    );

    it(
      'POST /api/cart/checkout should keep order pending and stock reserved when Stripe expiration cannot be confirmed',
      async () => {
        const cookies =
          await getAuthenticatedCookies();

        await clearUserCart(
          cookies
        );

        const product =
          await getAvailableProduct();

        const productStockBefore =
          await getProductStock(
            product.id
          );

        const addResponse =
          await request(app)
            .post(
              '/api/cart/items'
            )
            .set(
              'Cookie',
              cookies
            )
            .send({
              productId:
                product.id,

              quantity:
                1,
            });

        expect(
          addResponse.statusCode
        ).toBe(200);

        const {
          id: cartId,
          userId,
        } =
          addResponse.body.data;

        const duplicateSessionId =
          `cs_test_unverified_${Date.now()}_${++stripeSessionSequence}`;

        const blockingOrder =
          await prisma.order.create({
            data: {
              userId,
              total: '0.00',
              status:
                'CANCELLED',
              stripeCheckoutSessionId:
                duplicateSessionId,
            },
          });

        createdOrderIds.add(
          blockingOrder.id
        );

        createCheckoutSessionMock
          .mockResolvedValueOnce({
            id:
              duplicateSessionId,

            url:
              'https://checkout.stripe.com/c/pay/unverified-session',
          });

        expireCheckoutSessionMock
          .mockRejectedValueOnce(
            new Error(
              'Stripe expiration unavailable'
            )
          );

        const response =
          await request(app)
            .post(
              '/api/cart/checkout'
            )
            .set(
              'Cookie',
              cookies
            );

        expect(
          response.statusCode
        ).toBe(500);

        expect(
          expireCheckoutSessionMock
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          expireCheckoutSessionMock
        ).toHaveBeenCalledWith(
          duplicateSessionId
        );

        const pendingOrder =
          await prisma.order.findFirst({
            where: {
              userId,
              status:
                'PENDING',
              stripeCheckoutSessionId:
                null,

              items: {
                some: {
                  productId:
                    product.id,
                },
              },
            },

            orderBy: {
              createdAt:
                'desc',
            },

            include: {
              items: true,
            },
          });

        expect(
          pendingOrder
        ).not.toBeNull();

        createdOrderIds.add(
          pendingOrder.id
        );

        const productStockAfter =
          await getProductStock(
            product.id
          );

        expect(
          productStockAfter
        ).toBe(
          productStockBefore - 1
        );

        const cart =
          await prisma.cart.findUnique({
            where: {
              id: cartId,
            },

            select: {
              status: true,
            },
          });

        expect(
          cart.status
        ).toBe(
          'CHECKED_OUT'
        );
      }
    );

    it(
      'POST /api/cart/buy-now should create a pending order without modifying normal cart',
      async () => {
        const cookies =
          await getAuthenticatedCookies();

        await clearUserCart(
          cookies
        );

        const cartBefore =
          await request(app)
            .get(
              '/api/cart'
            )
            .set(
              'Cookie',
              cookies
            );

        expect(
          cartBefore.statusCode
        ).toBe(200);

        const cartId =
          cartBefore
            .body
            .data
            .id;

        const product =
          await getAvailableProduct();

        const stripeSession =
          createUniqueStripeSession({
            prefix:
              'buy_now',

            url:
              'https://checkout.stripe.com/c/pay/buy-now-session',
          });

        createCheckoutSessionMock
          .mockResolvedValueOnce(
            stripeSession
          );

        const response =
          await request(app)
            .post(
              '/api/cart/buy-now'
            )
            .set(
              'Cookie',
              cookies
            )
            .send({
              productId:
                product.id,

              quantity:
                1,
            });

        expect(
          response.statusCode
        ).toBe(201);

        expect(
          response.body.data
        ).toEqual({
          orderId:
            expect.any(
              Number
            ),

          checkoutUrl:
            stripeSession.url,
        });

        const {
          orderId,
        } =
          response.body.data;

        createdOrderIds.add(
          orderId
        );

        const order =
          await prisma.order
            .findUnique({
              where: {
                id:
                  orderId,
              },

              include: {
                items: true,
              },
            });

        expect(
          order.status
        ).toBe(
          'PENDING'
        );

        expect(
          order
            .stripeCheckoutSessionId
        ).toBe(
          stripeSession.id
        );

        expect(
          order.items
        ).toHaveLength(
          1
        );

        const cartAfter =
          await prisma.cart
            .findUnique({
              where: {
                id:
                  cartId,
              },

              include: {
                items: true,
              },
            });

        expect(
          cartAfter.status
        ).toBe(
          'ACTIVE'
        );

        expect(
          cartAfter.items
        ).toHaveLength(
          0
        );
      }
    );

    it(
      'POST /api/cart/buy-now should restore stock and cancel pending order when Stripe fails',
      async () => {
        const cookies =
          await getAuthenticatedCookies();

        const product =
          await getAvailableProduct();

        const productStockBefore =
          await getProductStock(
            product.id
          );

        createCheckoutSessionMock
          .mockRejectedValueOnce(
            new Error(
              'Stripe unavailable'
            )
          );

        const response =
          await request(app)
            .post(
              '/api/cart/buy-now'
            )
            .set(
              'Cookie',
              cookies
            )
            .send({
              productId:
                product.id,

              quantity:
                1,
            });

        expect(
          response.statusCode
        ).toBe(500);

        expect(
          expireCheckoutSessionMock
        ).not.toHaveBeenCalled();

        const productStockAfter =
          await getProductStock(
            product.id
          );

        expect(
          productStockAfter
        ).toBe(
          productStockBefore
        );

        const cancelledOrder =
          await prisma.order
            .findFirst({
              where: {
                status:
                  'CANCELLED',

                items: {
                  some: {
                    productId:
                      product.id,
                  },
                },
              },

              orderBy: {
                createdAt:
                  'desc',
              },
            });

        expect(
          cancelledOrder
        ).not.toBeNull();
      }
    );
  }
);