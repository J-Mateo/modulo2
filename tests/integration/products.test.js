import { Prisma } from '@prisma/client';
import request from 'supertest';

import app from '../../src/app.js';
import prisma from '../../src/config/prismaClient.js';

describe('Products endpoints', () => {
  const createdProductIds = [];

  afterEach(async () => {
    if (createdProductIds.length === 0) {
      return;
    }

    await prisma.product.deleteMany({
      where: {
        id: {
          in: createdProductIds.splice(0),
        },
      },
    });
  });

  it('GET /api/products should return a products array', async () => {
    const response = await request(app).get('/api/products');

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('GET /api/products/:id should return one product if product exists', async () => {
    const productsResponse = await request(app).get(
      '/api/products'
    );

    const productId =
      productsResponse.body.data[0].id;

    const response = await request(app).get(
      `/api/products/${productId}`
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data).toHaveProperty(
      'id',
      productId
    );

    expect(response.body.data).toHaveProperty(
      'name'
    );

    expect(response.body.data).toHaveProperty(
      'price'
    );

    expect(response.body.data).toHaveProperty(
      'stock'
    );
  });

  it('GET /api/products/:id should return 404 if product does not exist', async () => {
    const response = await request(app).get(
      '/api/products/999999'
    );

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);

    expect(response.body.error).toHaveProperty(
      'message'
    );
  });

  it('should serialize monetary prices with exact two-decimal precision', async () => {
    const product =
      await prisma.product.create({
        data: {
          name: `Decimal test ${Date.now()}`,
          description:
            'Temporary product for Decimal contract testing',
          price: new Prisma.Decimal('20.03'),
          stock: 5,
          images: [],
          category: 'Test',
          isActive: true,
        },
      });

    createdProductIds.push(product.id);

    const response = await request(app).get(
      `/api/products/${product.id}`
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data.price).toBe(
      '20.03'
    );

    expect(typeof response.body.data.price).toBe(
      'string'
    );
  });

  it('should preserve trailing zeros in monetary responses', async () => {
    const product =
      await prisma.product.create({
        data: {
          name: `Decimal zero test ${Date.now()}`,
          price: new Prisma.Decimal('26.00'),
          stock: 5,
          images: [],
          category: 'Test',
          isActive: true,
        },
      });

    createdProductIds.push(product.id);

    const response = await request(app).get(
      `/api/products/${product.id}`
    );

    expect(response.statusCode).toBe(200);

    expect(response.body.data.price).toBe(
      '26.00'
    );
  });

  it('should not expose inactive products in the public catalogue', async () => {
    const uniqueName =
      `Inactive product ${Date.now()}`;

    const product =
      await prisma.product.create({
        data: {
          name: uniqueName,
          price: new Prisma.Decimal('50.00'),
          stock: 10,
          images: [],
          category: 'Test',
          isActive: false,
        },
      });

    createdProductIds.push(product.id);

    const catalogueResponse =
      await request(app)
        .get('/api/products')
        .query({
          search: uniqueName,
        });

    expect(
      catalogueResponse.statusCode
    ).toBe(200);

    expect(
      catalogueResponse.body.data.some(
        (item) => item.id === product.id
      )
    ).toBe(false);

    const detailResponse =
      await request(app).get(
        `/api/products/${product.id}`
      );

    expect(
      detailResponse.statusCode
    ).toBe(404);
  });
});