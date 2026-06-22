import request from 'supertest';
import app from '../../src/app.js';

describe('Wishlist endpoints', () => {
  it('GET /api/wishlist should fail without token', async () => {
    const response = await request(app).get('/api/wishlist');

    expect(response.statusCode).toBe(401);
    expect(response.body.ok).toBe(false);
    expect(response.body.error).toHaveProperty('message');
  });

  it('GET /api/wishlist should return wishlist with valid token', async () => {
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'user@test.com',
      password: 'password123',
    });

  const token = loginResponse.body.data.token;

  const response = await request(app)
    .get('/api/wishlist')
    .set('Authorization', `Bearer ${token}`);

  expect(response.statusCode).toBe(200);
  expect(response.body.ok).toBe(true);
  expect(response.body.data).toHaveProperty('userId');
  expect(response.body.data).toHaveProperty('productIds');
  expect(Array.isArray(response.body.data.productIds)).toBe(true);
}, 15000);
it('POST /api/wishlist/:productId should toggle product in wishlist with valid token', async () => {
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
    .post(`/api/wishlist/${productId}`)
    .set('Authorization', `Bearer ${token}`);

  expect(response.statusCode).toBe(200);
  expect(response.body.ok).toBe(true);
  expect(response.body.data).toHaveProperty('userId');
  expect(response.body.data).toHaveProperty('productIds');
  expect(Array.isArray(response.body.data.productIds)).toBe(true);
  expect(response.body.data.productIds).toContain(String(productId));
});
});