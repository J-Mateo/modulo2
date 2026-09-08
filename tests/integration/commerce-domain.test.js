import {
  jest,
} from '@jest/globals';

import {
  Prisma,
} from '@prisma/client';

import prisma from '../../src/config/prismaClient.js';

const createCheckoutSessionMock =
  jest.fn();

const expireCheckoutSessionMock =
  jest.fn();

let stripeSessionSequence = 0;

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
  cartService,
} = await import(
  '../../src/services/cart.service.js'
);

describe(
  'Commerce domain guarantees',
  () => {
    const userIds = [];
    const productIds = [];

    const createTestUser =
      async () => {
        const user =
          await prisma.user.create({
            data: {
              name:
                'Commerce Test User',

              email:
                `commerce-${Date.now()}-${Math.random()}@test.local`,

              passwordHash:
                'not-used-by-commerce-domain-tests',

              role:
                'USER',
            },
          });

        userIds.push(
          user.id
        );

        return user;
      };

    const createTestProduct =
      async ({
        name =
          `Commerce product ${Date.now()}`,

        price =
          '20.03',

        stock =
          10,

        isActive =
          true,
      } = {}) => {
        const product =
          await prisma.product.create({
            data: {
              name,

              description:
                'Temporary commerce-domain test product',

              price:
                new Prisma.Decimal(
                  price
                ),

              stock,

              images: [
                'https://example.com/product.jpg',
              ],

              category:
                'Test',

              isActive,
            },
          });

        productIds.push(
          product.id
        );

        return product;
      };

    const createCartWithItem =
      async ({
        userId,
        productId,
        quantity = 1,
      }) => {
        return prisma.cart.create({
          data: {
            userId,
            status:
              'ACTIVE',

            items: {
              create: {
                productId,
                quantity,
              },
            },
          },

          include: {
            items: true,
          },
        });
      };

    beforeEach(() => {
      jest.clearAllMocks();

      createCheckoutSessionMock
        .mockImplementation(
          async () => {
            stripeSessionSequence +=
              1;

            const suffix =
              `${Date.now()}_${stripeSessionSequence}`;

            return {
              id:
                `cs_test_commerce_${suffix}`,

              url:
                `https://checkout.stripe.com/c/pay/commerce-${suffix}`,
            };
          }
        );

      expireCheckoutSessionMock
        .mockResolvedValue({
          status:
            'expired',
        });
    });

    afterEach(async () => {
      if (
        userIds.length > 0
      ) {
        await prisma.orderItem.deleteMany({
          where: {
            order: {
              userId: {
                in:
                  userIds,
              },
            },
          },
        });

        await prisma.order.deleteMany({
          where: {
            userId: {
              in:
                userIds,
            },
          },
        });

        await prisma.cartItem.deleteMany({
          where: {
            cart: {
              userId: {
                in:
                  userIds,
              },
            },
          },
        });

        await prisma.cart.deleteMany({
          where: {
            userId: {
              in:
                userIds,
            },
          },
        });

        await prisma.user.deleteMany({
          where: {
            id: {
              in:
                userIds.splice(
                  0
                ),
            },
          },
        });
      }

      if (
        productIds.length > 0
      ) {
        await prisma.product.deleteMany({
          where: {
            id: {
              in:
                productIds.splice(
                  0
                ),
            },
          },
        });
      }
    });

    it(
      'should create an immutable commercial snapshot during checkout',
      async () => {
        const user =
          await createTestUser();

        const product =
          await createTestProduct({
            name:
              'Snapshot Original Name',

            price:
              '20.03',

            stock:
              5,
          });

        await createCartWithItem({
          userId:
            user.id,

          productId:
            product.id,

          quantity:
            2,
        });

        const checkoutResult =
          await cartService.checkout(
            user.id
          );

        expect(
          checkoutResult.orderId
        ).toEqual(
          expect.any(
            Number
          )
        );

        expect(
          checkoutResult.checkoutUrl
        ).toEqual(
          expect.any(
            String
          )
        );

        const order =
          await prisma.order.findUnique({
            where: {
              id:
                checkoutResult.orderId,
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
          order.total.toFixed(
            2
          )
        ).toBe(
          '40.06'
        );

        expect(
          order.items
        ).toHaveLength(
          1
        );

        expect(
          order.items[0]
            .productName
        ).toBe(
          'Snapshot Original Name'
        );

        expect(
          order.items[0]
            .priceAtPurchase
            .toFixed(
              2
            )
        ).toBe(
          '20.03'
        );

        expect(
          order.items[0]
            .productImage
        ).toBe(
          'https://example.com/product.jpg'
        );

        /*
         * Cambiamos el producto después
         * del checkout.
         *
         * El histórico del pedido debe
         * conservar los datos originales.
         */
        await prisma.product.update({
          where: {
            id:
              product.id,
          },

          data: {
            name:
              'Completely Different Name',

            price:
              new Prisma.Decimal(
                '999.99'
              ),
          },
        });

        const persistedOrder =
          await prisma.order.findUnique({
            where: {
              id:
                order.id,
            },

            include: {
              items: true,
            },
          });

        expect(
          persistedOrder
            .items[0]
            .productName
        ).toBe(
          'Snapshot Original Name'
        );

        expect(
          persistedOrder
            .items[0]
            .priceAtPurchase
            .toFixed(
              2
            )
        ).toBe(
          '20.03'
        );
      }
    );

    it(
      'should decrement product stock when checkout succeeds',
      async () => {
        const user =
          await createTestUser();

        const product =
          await createTestProduct({
            price:
              '49.99',

            stock:
              5,
          });

        await createCartWithItem({
          userId:
            user.id,

          productId:
            product.id,

          quantity:
            2,
        });

        const checkoutResult =
          await cartService.checkout(
            user.id
          );

        expect(
          checkoutResult.orderId
        ).toEqual(
          expect.any(
            Number
          )
        );

        const updatedProduct =
          await prisma.product
            .findUnique({
              where: {
                id:
                  product.id,
              },
            });

        expect(
          updatedProduct.stock
        ).toBe(
          3
        );

        const order =
          await prisma.order.findUnique({
            where: {
              id:
                checkoutResult.orderId,
            },
          });

        expect(
          order.status
        ).toBe(
          'PENDING'
        );
      }
    );

    it(
      'should reject checkout when stock is insufficient without partially modifying data',
      async () => {
        const user =
          await createTestUser();

        const product =
          await createTestProduct({
            stock:
              1,
          });

        await createCartWithItem({
          userId:
            user.id,

          productId:
            product.id,

          quantity:
            2,
        });

        await expect(
          cartService.checkout(
            user.id
          )
        ).rejects.toThrow();

        expect(
          createCheckoutSessionMock
        ).not.toHaveBeenCalled();

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
          1
        );

        const ordersCount =
          await prisma.order.count({
            where: {
              userId:
                user.id,
            },
          });

        expect(
          ordersCount
        ).toBe(
          0
        );

        const activeCart =
          await prisma.cart
            .findFirst({
              where: {
                userId:
                  user.id,

                status:
                  'ACTIVE',
              },
            });

        expect(
          activeCart
        ).not.toBeNull();
      }
    );

    it(
      'should prevent inactive products from being added to a cart',
      async () => {
        const user =
          await createTestUser();

        const product =
          await createTestProduct({
            stock:
              10,

            isActive:
              false,
          });

        await expect(
          cartService.addItemToCart({
            userId:
              user.id,

            productId:
              product.id,

            quantity:
              1,
          })
        ).rejects.toThrow();

        const cartItems =
          await prisma.cartItem.count({
            where: {
              productId:
                product.id,
            },
          });

        expect(
          cartItems
        ).toBe(
          0
        );
      }
    );

    it(
      'should prevent overselling when two checkouts compete for the last unit',
      async () => {
        const firstUser =
          await createTestUser();

        const secondUser =
          await createTestUser();

        const product =
          await createTestProduct({
            name:
              'Last unit concurrency test',

            price:
              '100.00',

            stock:
              1,
          });

        await createCartWithItem({
          userId:
            firstUser.id,

          productId:
            product.id,

          quantity:
            1,
        });

        await createCartWithItem({
          userId:
            secondUser.id,

          productId:
            product.id,

          quantity:
            1,
        });

        const results =
          await Promise.allSettled([
            cartService.checkout(
              firstUser.id
            ),

            cartService.checkout(
              secondUser.id
            ),
          ]);

        const fulfilled =
          results.filter(
            (result) =>
              result.status ===
              'fulfilled'
          );

        const rejected =
          results.filter(
            (result) =>
              result.status ===
              'rejected'
          );

        expect(
          fulfilled
        ).toHaveLength(
          1
        );

        expect(
          rejected
        ).toHaveLength(
          1
        );

        expect(
          createCheckoutSessionMock
        ).toHaveBeenCalledTimes(
          1
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
          0
        );

        const orders =
          await prisma.order.findMany({
            where: {
              userId: {
                in: [
                  firstUser.id,
                  secondUser.id,
                ],
              },
            },
          });

        expect(
          orders
        ).toHaveLength(
          1
        );

        expect(
          orders[0].status
        ).toBe(
          'PENDING'
        );
      }
    );
  }
);