import { Prisma } from '@prisma/client';
import request from 'supertest';

import app from '../../src/app.js';
import prisma from '../../src/config/prismaClient.js';

describe('Products endpoints', () => {
  const createdProductIds = [];

  const createTestProduct = async ({
    name,
    price,
    category,
    description,
    isActive = true,
  }) => {
    const product =
      await prisma.product.create({
        data: {
          name,
          description:
            description ?? null,
          price: new Prisma.Decimal(price),
          stock: 10,
          images: [],
          category,
          isActive,
        },
      });

    createdProductIds.push(product.id);

    return product;
  };

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
    const response = await request(app).get(
      '/api/products'
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(
      Array.isArray(response.body.data)
    ).toBe(true);
  });

  it('GET /api/products/:id should return one product if product exists', async () => {
    const productsResponse =
      await request(app).get(
        '/api/products'
      );

    const productId =
      productsResponse.body.data[0].id;

    const response = await request(app).get(
      `/api/products/${productId}`
    );

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    expect(
      response.body.data
    ).toHaveProperty('id', productId);

    expect(
      response.body.data
    ).toHaveProperty('name');

    expect(
      response.body.data
    ).toHaveProperty('price');

    expect(
      response.body.data
    ).toHaveProperty('stock');
  });

  it('GET /api/products/:id should return 404 if product does not exist', async () => {
    const response = await request(app).get(
      '/api/products/999999'
    );

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);

    expect(
      response.body.error
    ).toHaveProperty('message');
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

    expect(
      typeof response.body.data.price
    ).toBe('string');
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
        (item) =>
          item.id === product.id
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

  it('should return products ordered by newest first by default', async () => {
    const category =
      `Sort default ${Date.now()}`;

    const olderProduct =
      await createTestProduct({
        name: `Older product ${Date.now()}`,
        price: '20.00',
        category,
      });

    await new Promise((resolve) =>
      setTimeout(resolve, 10)
    );

    const newerProduct =
      await createTestProduct({
        name: `Newer product ${Date.now()}`,
        price: '30.00',
        category,
      });

    const response =
      await request(app)
        .get('/api/products')
        .query({
          category,
        });

    expect(response.statusCode).toBe(200);

    expect(
      response.body.data.map(
        (product) => product.id
      )
    ).toEqual([
      newerProduct.id,
      olderProduct.id,
    ]);
  });

  it('should order products by price ascending', async () => {
    const category =
      `Sort price asc ${Date.now()}`;

    const expensiveProduct =
      await createTestProduct({
        name: `Expensive ${Date.now()}`,
        price: '99.99',
        category,
      });

    const cheapestProduct =
      await createTestProduct({
        name: `Cheapest ${Date.now()}`,
        price: '10.00',
        category,
      });

    const middleProduct =
      await createTestProduct({
        name: `Middle ${Date.now()}`,
        price: '49.50',
        category,
      });

    const response =
      await request(app)
        .get('/api/products')
        .query({
          category,
          sortBy: 'price',
          order: 'asc',
        });

    expect(response.statusCode).toBe(200);

    expect(
      response.body.data.map(
        (product) => product.id
      )
    ).toEqual([
      cheapestProduct.id,
      middleProduct.id,
      expensiveProduct.id,
    ]);
  });

  it('should order products by price descending', async () => {
    const category =
      `Sort price desc ${Date.now()}`;

    const cheapestProduct =
      await createTestProduct({
        name: `Cheapest ${Date.now()}`,
        price: '10.00',
        category,
      });

    const expensiveProduct =
      await createTestProduct({
        name: `Expensive ${Date.now()}`,
        price: '99.99',
        category,
      });

    const middleProduct =
      await createTestProduct({
        name: `Middle ${Date.now()}`,
        price: '49.50',
        category,
      });

    const response =
      await request(app)
        .get('/api/products')
        .query({
          category,
          sortBy: 'price',
          order: 'desc',
        });

    expect(response.statusCode).toBe(200);

    expect(
      response.body.data.map(
        (product) => product.id
      )
    ).toEqual([
      expensiveProduct.id,
      middleProduct.id,
      cheapestProduct.id,
    ]);
  });

  it('should reject unsupported sort fields', async () => {
    const response =
      await request(app)
        .get('/api/products')
        .query({
          sortBy: 'stock',
          order: 'asc',
        });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);

    expect(
      response.body.error
    ).toHaveProperty('message');
  });

  it('should reject unsupported sort orders', async () => {
    const response =
      await request(app)
        .get('/api/products')
        .query({
          sortBy: 'price',
          order: 'invalid',
        });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);

    expect(
      response.body.error
    ).toHaveProperty('message');
  });

  it('should combine category filtering with price sorting', async () => {
    const category =
      `Category sort ${Date.now()}`;

    const cheaperProduct =
      await createTestProduct({
        name: `Category cheaper ${Date.now()}`,
        price: '15.00',
        category,
      });

    const expensiveProduct =
      await createTestProduct({
        name: `Category expensive ${Date.now()}`,
        price: '80.00',
        category,
      });

    await createTestProduct({
      name: `Other category ${Date.now()}`,
      price: '5.00',
      category: `${category} other`,
    });

    const response =
      await request(app)
        .get('/api/products')
        .query({
          category,
          sortBy: 'price',
          order: 'asc',
        });

    expect(response.statusCode).toBe(200);

    expect(
      response.body.data.map(
        (product) => product.id
      )
    ).toEqual([
      cheaperProduct.id,
      expensiveProduct.id,
    ]);
  });

  it('should combine search filtering with price sorting', async () => {
    const uniqueTerm =
      `SearchSort${Date.now()}`;

    const expensiveProduct =
      await createTestProduct({
        name: `${uniqueTerm} expensive`,
        price: '90.00',
        category: 'Test',
      });

    const cheaperProduct =
      await createTestProduct({
        name: `${uniqueTerm} cheaper`,
        price: '25.00',
        category: 'Test',
      });

    await createTestProduct({
      name: `Unrelated ${Date.now()}`,
      price: '1.00',
      category: 'Test',
    });

    const response =
      await request(app)
        .get('/api/products')
        .query({
          search: uniqueTerm,
          sortBy: 'price',
          order: 'asc',
        });

    expect(response.statusCode).toBe(200);

    expect(
      response.body.data.map(
        (product) => product.id
      )
    ).toEqual([
      cheaperProduct.id,
      expensiveProduct.id,
    ]);
  });
});