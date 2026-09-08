import bcrypt from 'bcrypt';
import request from 'supertest';

import app from '../../src/app.js';
import prisma from '../../src/config/prismaClient.js';

const TEST_PASSWORD =
  'Password123!';

const createdUserIds =
  new Set();

const createdProductIds =
  new Set();

const createdOrderIds =
  new Set();

let sequence = 0;

const createUniqueEmail = (
  prefix = 'orders'
) => {
  sequence += 1;

  return `${prefix}-${Date.now()}-${sequence}@test.local`;
};

const createTestUser =
  async ({
    name =
      'Orders Test User',
  } = {}) => {
    const passwordHash =
      await bcrypt.hash(
        TEST_PASSWORD,
        10
      );

    const user =
      await prisma.user.create({
        data: {
          name,
          email:
            createUniqueEmail(),
          passwordHash,
          role:
            'USER',
        },
      });

    createdUserIds.add(
      user.id
    );

    return user;
  };

const loginUser =
  async (
    user
  ) => {
    const response =
      await request(app)
        .post(
          '/api/auth/login'
        )
        .send({
          email:
            user.email,

          password:
            TEST_PASSWORD,
        });

    expect(
      response.statusCode
    ).toBe(200);

    const cookies =
      response.headers[
        'set-cookie'
      ] ?? [];

    const accessTokenCookie =
      cookies.find(
        (cookie) =>
          cookie.startsWith(
            'access_token='
          )
      );

    expect(
      accessTokenCookie
    ).toBeDefined();

    return accessTokenCookie;
  };

const createTestProduct =
  async () => {
    const product =
      await prisma.product.create({
        data: {
          name:
            `Orders product ${Date.now()} ${Math.random()}`,

          description:
            'Temporary order history test product',

          price:
            '49.90',

          stock:
            20,

          images: [
            'https://example.com/orders-product.jpg',
          ],

          category:
            'Test',

          isActive:
            true,
        },
      });

    createdProductIds.add(
      product.id
    );

    return product;
  };

const createTestOrder =
  async ({
    userId,
    productId,
    status = 'PAID',
    quantity = 1,
    total = '49.90',
    createdAt,
    productName =
      'Historic Product Name',
    productImage =
      'https://example.com/historic-product.jpg',
    priceAtPurchase =
      '49.90',
  }) => {
    const order =
      await prisma.order.create({
        data: {
          userId,
          total,
          status,

          ...(createdAt
            ? {
                createdAt,
              }
            : {}),

          items: {
            create: {
              productId,
              quantity,
              productName,
              productImage,
              priceAtPurchase,
            },
          },
        },

        include: {
          items: true,
        },
      });

    createdOrderIds.add(
      order.id
    );

    return order;
  };

const cleanup = async () => {
  if (
    createdOrderIds.size >
    0
  ) {
    await prisma.order.deleteMany({
      where: {
        id: {
          in: [
            ...createdOrderIds,
          ],
        },
      },
    });

    createdOrderIds.clear();
  }

  if (
    createdProductIds.size >
    0
  ) {
    await prisma.product.deleteMany({
      where: {
        id: {
          in: [
            ...createdProductIds,
          ],
        },
      },
    });

    createdProductIds.clear();
  }

  if (
    createdUserIds.size >
    0
  ) {
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [
            ...createdUserIds,
          ],
        },
      },
    });

    createdUserIds.clear();
  }
};

describe(
  'Orders endpoints',
  () => {
    afterEach(
      async () => {
        await cleanup();
      }
    );

    afterAll(
      async () => {
        await cleanup();

        await prisma
          .$disconnect();
      }
    );

    it(
      'GET /api/orders should require authentication',
      async () => {
        const response =
          await request(app)
            .get(
              '/api/orders'
            );

        expect(
          response.statusCode
        ).toBe(401);

        expect(
          response.body.success
        ).toBe(false);
      }
    );

    it(
      'GET /api/orders should return only authenticated user orders newest first',
      async () => {
        const user =
          await createTestUser();

        const otherUser =
          await createTestUser({
            name:
              'Other Orders User',
          });

        const product =
          await createTestProduct();

        const olderOrder =
          await createTestOrder({
            userId:
              user.id,

            productId:
              product.id,

            createdAt:
              new Date(
                '2026-01-01T10:00:00.000Z'
              ),
          });

        const newerOrder =
          await createTestOrder({
            userId:
              user.id,

            productId:
              product.id,

            status:
              'CANCELLED',

            createdAt:
              new Date(
                '2026-02-01T10:00:00.000Z'
              ),
          });

        const foreignOrder =
          await createTestOrder({
            userId:
              otherUser.id,

            productId:
              product.id,

            createdAt:
              new Date(
                '2026-03-01T10:00:00.000Z'
              ),
          });

        const cookie =
          await loginUser(
            user
          );

        const response =
          await request(app)
            .get(
              '/api/orders'
            )
            .set(
              'Cookie',
              cookie
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          Array.isArray(
            response.body
              .data
              .orders
          )
        ).toBe(true);

        const orders =
          response.body
            .data
            .orders;

        expect(
          orders.map(
            (order) =>
              order.id
          )
        ).toEqual([
          newerOrder.id,
          olderOrder.id,
        ]);

        expect(
          orders.some(
            (order) =>
              order.id ===
              foreignOrder.id
          )
        ).toBe(false);
      }
    );

    it(
      'GET /api/orders should preserve historic OrderItem snapshot data',
      async () => {
        const user =
          await createTestUser();

        const product =
          await createTestProduct();

        const order =
          await createTestOrder({
            userId:
              user.id,

            productId:
              product.id,

            quantity:
              2,

            total:
              '79.98',

            productName:
              'Original Product Name',

            productImage:
              'https://example.com/original-image.jpg',

            priceAtPurchase:
              '39.99',
          });

        const cookie =
          await loginUser(
            user
          );

        const response =
          await request(app)
            .get(
              '/api/orders'
            )
            .set(
              'Cookie',
              cookie
            );

        expect(
          response.statusCode
        ).toBe(200);

        const returnedOrder =
          response.body
            .data
            .orders
            .find(
              (item) =>
                item.id ===
                order.id
            );

        expect(
          returnedOrder
        ).toBeDefined();

        expect(
          Number(
            returnedOrder.total
          )
        ).toBeCloseTo(
          79.98
        );

        expect(
          returnedOrder.items
        ).toHaveLength(1);

        expect(
          returnedOrder.items[0]
        ).toMatchObject({
          productId:
            product.id,

          quantity:
            2,

          productName:
            'Original Product Name',

          productImage:
            'https://example.com/original-image.jpg',
        });

        expect(
          Number(
            returnedOrder
              .items[0]
              .priceAtPurchase
          )
        ).toBeCloseTo(
          39.99
        );

        expect(
          returnedOrder
        ).not.toHaveProperty(
          'stripeCheckoutSessionId'
        );

        expect(
          returnedOrder
        ).not.toHaveProperty(
          'stripePaymentIntentId'
        );
      }
    );

    it(
      'GET /api/orders/:id should return an authenticated user own order',
      async () => {
        const user =
          await createTestUser();

        const product =
          await createTestProduct();

        const order =
          await createTestOrder({
            userId:
              user.id,

            productId:
              product.id,
          });

        const cookie =
          await loginUser(
            user
          );

        const response =
          await request(app)
            .get(
              `/api/orders/${order.id}`
            )
            .set(
              'Cookie',
              cookie
            );

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data.id
        ).toBe(
          order.id
        );

        expect(
          response.body.data.status
        ).toBe(
          'PAID'
        );

        expect(
          response.body.data.items
        ).toHaveLength(1);
      }
    );

    it(
      'GET /api/orders/:id should not expose another user order',
      async () => {
        const user =
          await createTestUser();

        const otherUser =
          await createTestUser({
            name:
              'Foreign Order User',
          });

        const product =
          await createTestProduct();

        const foreignOrder =
          await createTestOrder({
            userId:
              otherUser.id,

            productId:
              product.id,
          });

        const cookie =
          await loginUser(
            user
          );

        const response =
          await request(app)
            .get(
              `/api/orders/${foreignOrder.id}`
            )
            .set(
              'Cookie',
              cookie
            );

        expect(
          response.statusCode
        ).toBe(404);

        expect(
          response.body.success
        ).toBe(false);
      }
    );

    it(
      'GET /api/orders/:id should reject invalid order identifiers',
      async () => {
        const user =
          await createTestUser();

        const cookie =
          await loginUser(
            user
          );

        const response =
          await request(app)
            .get(
              '/api/orders/not-an-id'
            )
            .set(
              'Cookie',
              cookie
            );

        expect(
          response.statusCode
        ).toBe(400);

        expect(
          response.body.success
        ).toBe(false);
      }
    );
  }
);