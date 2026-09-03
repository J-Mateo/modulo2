import { Prisma } from '@prisma/client';

import prisma from '../../src/config/prismaClient.js';

import { cartService } from '../../src/services/cart.service.js';

describe('Commerce domain guarantees', () => {
  const userIds = [];
  const productIds = [];

  const createTestUser = async () => {
    const user = await prisma.user.create({
      data: {
        name: 'Commerce Test User',
        email: `commerce-${Date.now()}-${Math.random()}@test.local`,
        passwordHash:
          'not-used-by-commerce-domain-tests',
        role: 'USER',
      },
    });

    userIds.push(user.id);

    return user;
  };

  const createTestProduct = async ({
    name = `Commerce product ${Date.now()}`,
    price = '20.03',
    stock = 10,
    isActive = true,
  } = {}) => {
    const product =
      await prisma.product.create({
        data: {
          name,
          description:
            'Temporary commerce-domain test product',
          price: new Prisma.Decimal(price),
          stock,
          images: [
            'https://example.com/product.jpg',
          ],
          category: 'Test',
          isActive,
        },
      });

    productIds.push(product.id);

    return product;
  };

  const createCartWithItem = async ({
    userId,
    productId,
    quantity = 1,
  }) => {
    return prisma.cart.create({
      data: {
        userId,
        status: 'ACTIVE',

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

  afterEach(async () => {
    if (userIds.length > 0) {
      await prisma.orderItem.deleteMany({
        where: {
          order: {
            userId: {
              in: userIds,
            },
          },
        },
      });

      await prisma.order.deleteMany({
        where: {
          userId: {
            in: userIds,
          },
        },
      });

      await prisma.cartItem.deleteMany({
        where: {
          cart: {
            userId: {
              in: userIds,
            },
          },
        },
      });

      await prisma.cart.deleteMany({
        where: {
          userId: {
            in: userIds,
          },
        },
      });

      await prisma.user.deleteMany({
        where: {
          id: {
            in: userIds.splice(0),
          },
        },
      });
    }

    if (productIds.length > 0) {
      await prisma.product.deleteMany({
        where: {
          id: {
            in: productIds.splice(0),
          },
        },
      });
    }
  });

  it('should create an immutable commercial snapshot during checkout', async () => {
    const user = await createTestUser();

    const product =
      await createTestProduct({
        name: 'Snapshot Original Name',
        price: '20.03',
        stock: 5,
      });

    await createCartWithItem({
      userId: user.id,
      productId: product.id,
      quantity: 2,
    });

    const order =
      await cartService.checkout(
        user.id
      );

    expect(order.status).toBe('PAID');

    expect(order.total.toFixed(2)).toBe(
      '40.06'
    );

    expect(order.items).toHaveLength(1);

    expect(
      order.items[0].productName
    ).toBe('Snapshot Original Name');

    expect(
      order.items[0].priceAtPurchase.toFixed(
        2
      )
    ).toBe('20.03');

    expect(
      order.items[0].productImage
    ).toBe(
      'https://example.com/product.jpg'
    );

    /*
     * Cambiamos el producto después de la compra.
     * El histórico del pedido no debe cambiar.
     */
    await prisma.product.update({
      where: {
        id: product.id,
      },

      data: {
        name: 'Completely Different Name',
        price: new Prisma.Decimal(
          '999.99'
        ),
      },
    });

    const persistedOrder =
      await prisma.order.findUnique({
        where: {
          id: order.id,
        },

        include: {
          items: true,
        },
      });

    expect(
      persistedOrder.items[0].productName
    ).toBe('Snapshot Original Name');

    expect(
      persistedOrder.items[0].priceAtPurchase.toFixed(
        2
      )
    ).toBe('20.03');
  });

  it('should decrement product stock when checkout succeeds', async () => {
    const user = await createTestUser();

    const product =
      await createTestProduct({
        price: '49.99',
        stock: 5,
      });

    await createCartWithItem({
      userId: user.id,
      productId: product.id,
      quantity: 2,
    });

    await cartService.checkout(
      user.id
    );

    const updatedProduct =
      await prisma.product.findUnique({
        where: {
          id: product.id,
        },
      });

    expect(updatedProduct.stock).toBe(3);
  });

  it('should reject checkout when stock is insufficient without partially modifying data', async () => {
    const user = await createTestUser();

    const product =
      await createTestProduct({
        stock: 1,
      });

    await createCartWithItem({
      userId: user.id,
      productId: product.id,
      quantity: 2,
    });

    await expect(
      cartService.checkout(user.id)
    ).rejects.toThrow();

    const persistedProduct =
      await prisma.product.findUnique({
        where: {
          id: product.id,
        },
      });

    expect(persistedProduct.stock).toBe(
      1
    );

    const ordersCount =
      await prisma.order.count({
        where: {
          userId: user.id,
        },
      });

    expect(ordersCount).toBe(0);

    const activeCart =
      await prisma.cart.findFirst({
        where: {
          userId: user.id,
          status: 'ACTIVE',
        },
      });

    expect(activeCart).not.toBeNull();
  });

  it('should prevent inactive products from being added to a cart', async () => {
    const user = await createTestUser();

    const product =
      await createTestProduct({
        stock: 10,
        isActive: false,
      });

    await expect(
      cartService.addItemToCart({
        userId: user.id,
        productId: product.id,
        quantity: 1,
      })
    ).rejects.toThrow();

    const cartItems =
      await prisma.cartItem.count({
        where: {
          productId: product.id,
        },
      });

    expect(cartItems).toBe(0);
  });

  it('should prevent overselling when two checkouts compete for the last unit', async () => {
    const firstUser =
      await createTestUser();

    const secondUser =
      await createTestUser();

    const product =
      await createTestProduct({
        name: 'Last unit concurrency test',
        price: '100.00',
        stock: 1,
      });

    await createCartWithItem({
      userId: firstUser.id,
      productId: product.id,
      quantity: 1,
    });

    await createCartWithItem({
      userId: secondUser.id,
      productId: product.id,
      quantity: 1,
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
          result.status === 'fulfilled'
      );

    const rejected =
      results.filter(
        (result) =>
          result.status === 'rejected'
      );

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const persistedProduct =
      await prisma.product.findUnique({
        where: {
          id: product.id,
        },
      });

    expect(persistedProduct.stock).toBe(
      0
    );

    const ordersCount =
      await prisma.order.count({
        where: {
          userId: {
            in: [
              firstUser.id,
              secondUser.id,
            ],
          },
        },
      });

    expect(ordersCount).toBe(1);
  });
});