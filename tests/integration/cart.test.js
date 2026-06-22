import request from 'supertest';
import app from '../../src/app.js';

describe('Cart endpoints', () => {
  it('GET /api/cart should fail without token', async () => {
    const response = await request(app).get('/api/cart');

    expect(response.statusCode).toBe(401);
    expect(response.body.ok).toBe(false);
    expect(response.body.error).toHaveProperty('message');
  });

  it('GET /api/cart should return cart with valid token', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'password123',
      });

    const token = loginResponse.body.data.token;

    const response = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('userId');
    expect(response.body.data).toHaveProperty('status');
    expect(response.body.data).toHaveProperty('items');
    expect(Array.isArray(response.body.data.items)).toBe(true);
  });
  it('POST /api/cart/items should add product to cart with valid token', async () => {
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'user@test.com',
      password: 'password123',
    });

  const token = loginResponse.body.data.token;

  const productsResponse = await request(app).get('/api/products');
  const productId = productsResponse.body.data[0].id;

  const response = await request(app)
    .post('/api/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({
      productId,
      quantity: 1,
    });

  expect(response.statusCode).toBe(200);
  expect(response.body.ok).toBe(true);
  expect(response.body.data).toHaveProperty('items');
  expect(Array.isArray(response.body.data.items)).toBe(true);

  const addedItem = response.body.data.items.find(
    (item) => item.productId === productId
  );

  expect(addedItem).toBeDefined();
  expect(addedItem.quantity).toBeGreaterThanOrEqual(1);
});
it('DELETE /api/cart/items/:itemId should remove product from cart with valid token', async () => {
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'user@test.com',
      password: 'password123',
    });

  const token = loginResponse.body.data.token;

  const productsResponse = await request(app).get('/api/products');
  const productId = productsResponse.body.data[0].id;

  const addResponse = await request(app)
    .post('/api/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({
      productId,
      quantity: 1,
    });

  expect(addResponse.statusCode).toBe(200);

  const addedItem = addResponse.body.data.items.find(
    (item) => item.productId === productId
  );

  expect(addedItem).toBeDefined();

  const response = await request(app)
    .delete(`/api/cart/items/${addedItem.id}`)
    .set('Authorization', `Bearer ${token}`);

  expect(response.statusCode).toBe(200);
  expect(response.body.ok).toBe(true);
  expect(response.body.data).toHaveProperty('items');

  const removedItem = response.body.data.items.find(
    (item) => item.id === addedItem.id
  );

  expect(removedItem).toBeUndefined();
});
it('POST /api/cart/checkout should create an order with valid token', async () => {
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'user@test.com',
      password: 'password123',
    });

  const token = loginResponse.body.data.token;

  const productsResponse = await request(app).get('/api/products');

  const product = productsResponse.body.data.find(
    (item) => item.stock > 0
  );

  expect(product).toBeDefined();

  await request(app)
    .post('/api/cart/items')
    .set('Authorization', `Bearer ${token}`)
    .send({
      productId: product.id,
      quantity: 1,
    });

  const response = await request(app)
    .post('/api/cart/checkout')
    .set('Authorization', `Bearer ${token}`);

  expect(response.statusCode).toBe(201);
  expect(response.body.ok).toBe(true);
  expect(response.body.data).toHaveProperty('id');
  expect(response.body.data).toHaveProperty('userId');
  expect(response.body.data).toHaveProperty('total');
  expect(response.body.data).toHaveProperty('items');
  expect(Array.isArray(response.body.data.items)).toBe(true);
  expect(response.body.data.items.length).toBeGreaterThan(0);
});
});