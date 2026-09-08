import Stripe from 'stripe';
import request from 'supertest';

const TEST_WEBHOOK_SECRET =
  'whsec_test_integration_secret';

process.env.STRIPE_WEBHOOK_SECRET =
  TEST_WEBHOOK_SECRET;

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

const stripe =
  new Stripe(
    process.env.STRIPE_SECRET_KEY ||
      'sk_test_integration'
  );

let sequence = 0;

const createdUserIds =
  new Set();

const createdProductIds =
  new Set();

const createdOrderIds =
  new Set();

const uniqueStripeId = (
  prefix
) => {
  sequence += 1;

  return `${prefix}_${Date.now()}_${sequence}`;
};

const createTestUser =
  async () => {
    const user =
      await prisma.user.create({
        data: {
          name:
            'Payments Test User',

          email:
            `payments-${Date.now()}-${Math.random()}@test.local`,

          passwordHash:
            'not-used-by-payments-tests',

          role:
            'USER',
        },
      });

    createdUserIds.add(
      user.id
    );

    return user;
  };

const createTestProduct =
  async ({
    stock = 10,
  } = {}) => {
    const product =
      await prisma.product.create({
        data: {
          name:
            `Payments product ${Date.now()} ${Math.random()}`,

          description:
            'Temporary payments integration test product',

          price:
            '25.00',

          stock,

          images: [
            'https://example.com/payment-product.jpg',
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

const createPendingOrder =
  async ({
    userId,
    productId,
    quantity = 1,
    stripeCheckoutSessionId = null,
  }) => {
    const order =
      await prisma.order.create({
        data: {
          userId,

          total:
            (
              25 * quantity
            ).toFixed(2),

          status:
            'PENDING',

          stripeCheckoutSessionId,

          items: {
            create: {
              productId,

              quantity,

              productName:
                'Payments Test Product',

              productImage:
                'https://example.com/payment-product.jpg',

              priceAtPurchase:
                '25.00',
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

const createStripeEventPayload =
  ({
    type,
    session,
  }) => {
    return JSON.stringify({
      id:
        uniqueStripeId(
          'evt_test'
        ),

      object:
        'event',

      type,

      data: {
        object:
          session,
      },
    });
  };

const createStripeSignature =
  (
    rawPayload
  ) => {
    return stripe.webhooks
      .generateTestHeaderString({
        payload:
          rawPayload,

        secret:
          TEST_WEBHOOK_SECRET,
      });
  };

const sendSignedWebhook =
  async (
    payload
  ) => {
    const signature =
      createStripeSignature(
        payload
      );

    return request(app)
      .post(
        '/api/payments/webhook'
      )
      .set(
        'Content-Type',
        'application/json'
      )
      .set(
        'stripe-signature',
        signature
      )
      .send(
        payload
      );
  };

afterEach(
  async () => {
    if (
      createdOrderIds.size >
      0
    ) {
      await prisma.orderItem
        .deleteMany({
          where: {
            orderId: {
              in:
                Array.from(
                  createdOrderIds
                ),
            },
          },
        });

      await prisma.order
        .deleteMany({
          where: {
            id: {
              in:
                Array.from(
                  createdOrderIds
                ),
            },
          },
        });

      createdOrderIds.clear();
    }

    if (
      createdProductIds.size >
      0
    ) {
      await prisma.product
        .deleteMany({
          where: {
            id: {
              in:
                Array.from(
                  createdProductIds
                ),
            },
          },
        });

      createdProductIds.clear();
    }

    if (
      createdUserIds.size >
      0
    ) {
      await prisma.user
        .deleteMany({
          where: {
            id: {
              in:
                Array.from(
                  createdUserIds
                ),
            },
          },
        });

      createdUserIds.clear();
    }
  }
);

describe(
  'Stripe payment webhooks',
  () => {
    it(
      'POST /api/payments/webhook should reject request without Stripe signature',
      async () => {
        const response =
          await request(app)
            .post(
              '/api/payments/webhook'
            )
            .set(
              'Content-Type',
              'application/json'
            )
            .send(
              JSON.stringify({
                type:
                  'checkout.session.completed',
              })
            );

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          response.body.success
        ).toBe(
          false
        );

        expect(
          response.body.error
            .message
        ).toBe(
          'Missing Stripe signature'
        );
      }
    );

    it(
      'POST /api/payments/webhook should reject invalid Stripe signature',
      async () => {
        const payload =
          JSON.stringify({
            id:
              uniqueStripeId(
                'evt_invalid'
              ),

            type:
              'checkout.session.completed',

            data: {
              object: {},
            },
          });

        const response =
          await request(app)
            .post(
              '/api/payments/webhook'
            )
            .set(
              'Content-Type',
              'application/json'
            )
            .set(
              'stripe-signature',
              'invalid-signature'
            )
            .send(
              payload
            );

        expect(
          response.statusCode
        ).toBe(
          400
        );

        expect(
          response.body.success
        ).toBe(
          false
        );

        expect(
          response.body.error
            .message
        ).toBe(
          'Invalid Stripe signature'
        );
      }
    );

    it(
      'checkout.session.completed should transition PENDING order to PAID',
      async () => {
        const user =
          await createTestUser();

        const product =
          await createTestProduct({
            stock:
              9,
          });

        const sessionId =
          uniqueStripeId(
            'cs_test_completed'
          );

        const paymentIntentId =
          uniqueStripeId(
            'pi_test_completed'
          );

        const order =
          await createPendingOrder({
            userId:
              user.id,

            productId:
              product.id,

            quantity:
              1,

            stripeCheckoutSessionId:
              sessionId,
          });

        const stockBefore =
          product.stock;

        const payload =
          createStripeEventPayload({
            type:
              'checkout.session.completed',

            session: {
              id:
                sessionId,

              object:
                'checkout.session',

              payment_status:
                'paid',

              payment_intent:
                paymentIntentId,

              client_reference_id:
                String(
                  order.id
                ),

              metadata: {
                orderId:
                  String(
                    order.id
                  ),

                userId:
                  String(
                    user.id
                  ),
              },
            },
          });

        const response =
          await sendSignedWebhook(
            payload
          );

        expect(
          response.statusCode
        ).toBe(
          200
        );

        expect(
          response.body
        ).toEqual({
          received:
            true,
        });

        const persistedOrder =
          await prisma.order
            .findUnique({
              where: {
                id:
                  order.id,
              },
            });

        expect(
          persistedOrder.status
        ).toBe(
          'PAID'
        );

        expect(
          persistedOrder
            .stripeCheckoutSessionId
        ).toBe(
          sessionId
        );

        expect(
          persistedOrder
            .stripePaymentIntentId
        ).toBe(
          paymentIntentId
        );

        const persistedProduct =
          await prisma.product
            .findUnique({
              where: {
                id:
                  product.id,
              },
            });

        /*
         * El webhook de pago NO vuelve
         * a descontar stock.
         */
        expect(
          persistedProduct.stock
        ).toBe(
          stockBefore
        );
      }
    );

    it(
      'duplicate checkout.session.completed should be idempotent',
      async () => {
        const user =
          await createTestUser();

        const product =
          await createTestProduct({
            stock:
              8,
          });

        const sessionId =
          uniqueStripeId(
            'cs_test_completed_duplicate'
          );

        const paymentIntentId =
          uniqueStripeId(
            'pi_test_completed_duplicate'
          );

        const order =
          await createPendingOrder({
            userId:
              user.id,

            productId:
              product.id,

            quantity:
              2,

            stripeCheckoutSessionId:
              sessionId,
          });

        const payload =
          createStripeEventPayload({
            type:
              'checkout.session.completed',

            session: {
              id:
                sessionId,

              object:
                'checkout.session',

              payment_status:
                'paid',

              payment_intent:
                paymentIntentId,

              metadata: {
                orderId:
                  String(
                    order.id
                  ),
              },
            },
          });

        const firstResponse =
          await sendSignedWebhook(
            payload
          );

        const secondResponse =
          await sendSignedWebhook(
            payload
          );

        expect(
          firstResponse.statusCode
        ).toBe(
          200
        );

        expect(
          secondResponse.statusCode
        ).toBe(
          200
        );

        const persistedOrder =
          await prisma.order
            .findUnique({
              where: {
                id:
                  order.id,
              },
            });

        expect(
          persistedOrder.status
        ).toBe(
          'PAID'
        );

        expect(
          persistedOrder
            .stripePaymentIntentId
        ).toBe(
          paymentIntentId
        );

        const persistedProduct =
          await prisma.product
            .findUnique({
              where: {
                id:
                  product.id,
              },
            });

        expect(
          persistedProduct.stock
        ).toBe(
          8
        );
      }
    );

    it(
      'checkout.session.completed should reconcile pending order when local session ID was not persisted',
      async () => {
        const user =
          await createTestUser();

        const product =
          await createTestProduct({
            stock:
              9,
          });

        const order =
          await createPendingOrder({
            userId:
              user.id,

            productId:
              product.id,

            stripeCheckoutSessionId:
              null,
          });

        const sessionId =
          uniqueStripeId(
            'cs_test_recovery'
          );

        const paymentIntentId =
          uniqueStripeId(
            'pi_test_recovery'
          );

        const payload =
          createStripeEventPayload({
            type:
              'checkout.session.completed',

            session: {
              id:
                sessionId,

              object:
                'checkout.session',

              payment_status:
                'paid',

              payment_intent:
                paymentIntentId,

              client_reference_id:
                String(
                  order.id
                ),

              metadata: {
                orderId:
                  String(
                    order.id
                  ),
              },
            },
          });

        const response =
          await sendSignedWebhook(
            payload
          );

        expect(
          response.statusCode
        ).toBe(
          200
        );

        const persistedOrder =
          await prisma.order
            .findUnique({
              where: {
                id:
                  order.id,
              },
            });

        expect(
          persistedOrder.status
        ).toBe(
          'PAID'
        );

        expect(
          persistedOrder
            .stripeCheckoutSessionId
        ).toBe(
          sessionId
        );

        expect(
          persistedOrder
            .stripePaymentIntentId
        ).toBe(
          paymentIntentId
        );
      }
    );

    it(
      'checkout.session.expired should cancel pending order and restore stock',
      async () => {
        const user =
          await createTestUser();

        /*
         * Simulamos que antes del Order
         * se reservaron 2 unidades.
         *
         * Stock original: 10
         * Stock reservado: 2
         * Stock actual: 8
         */
        const product =
          await createTestProduct({
            stock:
              8,
          });

        const sessionId =
          uniqueStripeId(
            'cs_test_expired'
          );

        const order =
          await createPendingOrder({
            userId:
              user.id,

            productId:
              product.id,

            quantity:
              2,

            stripeCheckoutSessionId:
              sessionId,
          });

        const payload =
          createStripeEventPayload({
            type:
              'checkout.session.expired',

            session: {
              id:
                sessionId,

              object:
                'checkout.session',

              client_reference_id:
                String(
                  order.id
                ),

              metadata: {
                orderId:
                  String(
                    order.id
                  ),
              },
            },
          });

        const response =
          await sendSignedWebhook(
            payload
          );

        expect(
          response.statusCode
        ).toBe(
          200
        );

        const persistedOrder =
          await prisma.order
            .findUnique({
              where: {
                id:
                  order.id,
              },
            });

        expect(
          persistedOrder.status
        ).toBe(
          'CANCELLED'
        );

        const persistedProduct =
          await prisma.product
            .findUnique({
              where: {
                id:
                  product.id,
              },
            });

        expect(
          persistedProduct.stock
        ).toBe(
          10
        );
      }
    );

    it(
      'duplicate checkout.session.expired should not restore stock twice',
      async () => {
        const user =
          await createTestUser();

        const product =
          await createTestProduct({
            stock:
              9,
          });

        const sessionId =
          uniqueStripeId(
            'cs_test_expired_duplicate'
          );

        const order =
          await createPendingOrder({
            userId:
              user.id,

            productId:
              product.id,

            quantity:
              1,

            stripeCheckoutSessionId:
              sessionId,
          });

        const payload =
          createStripeEventPayload({
            type:
              'checkout.session.expired',

            session: {
              id:
                sessionId,

              object:
                'checkout.session',

              metadata: {
                orderId:
                  String(
                    order.id
                  ),
              },
            },
          });

        const firstResponse =
          await sendSignedWebhook(
            payload
          );

        const secondResponse =
          await sendSignedWebhook(
            payload
          );

        expect(
          firstResponse.statusCode
        ).toBe(
          200
        );

        expect(
          secondResponse.statusCode
        ).toBe(
          200
        );

        const persistedOrder =
          await prisma.order
            .findUnique({
              where: {
                id:
                  order.id,
              },
            });

        expect(
          persistedOrder.status
        ).toBe(
          'CANCELLED'
        );

        const persistedProduct =
          await prisma.product
            .findUnique({
              where: {
                id:
                  product.id,
              },
            });

        /*
         * Si el segundo webhook hubiera
         * restaurado stock otra vez,
         * terminaríamos con 11.
         */
        expect(
          persistedProduct.stock
        ).toBe(
          10
        );
      }
    );

    it(
      'checkout.session.completed should not mark order paid when Stripe reports unpaid payment status',
      async () => {
        const user =
          await createTestUser();

        const product =
          await createTestProduct();

        const sessionId =
          uniqueStripeId(
            'cs_test_unpaid'
          );

        const order =
          await createPendingOrder({
            userId:
              user.id,

            productId:
              product.id,

            stripeCheckoutSessionId:
              sessionId,
          });

        const payload =
          createStripeEventPayload({
            type:
              'checkout.session.completed',

            session: {
              id:
                sessionId,

              object:
                'checkout.session',

              payment_status:
                'unpaid',

              metadata: {
                orderId:
                  String(
                    order.id
                  ),
              },
            },
          });

        const response =
          await sendSignedWebhook(
            payload
          );

        expect(
          response.statusCode
        ).toBe(
          200
        );

        const persistedOrder =
          await prisma.order
            .findUnique({
              where: {
                id:
                  order.id,
              },
            });

        expect(
          persistedOrder.status
        ).toBe(
          'PENDING'
        );

        expect(
          persistedOrder
            .stripePaymentIntentId
        ).toBeNull();
      }
    );
  }
);