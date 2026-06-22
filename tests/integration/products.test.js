import request from 'supertest';
import app from '../../src/app.js';

describe('Products endpoints', () => {
  it('GET /api/products should return a products array', async () => {
    const response = await request(app).get('/api/products');

    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('GET /api/products/:id should return one product if product exists', async () => {
    const productsResponse = await request(app).get('/api/products');
    const productId = productsResponse.body.data[0].id;

    const response = await request(app).get(`/api/products/${productId}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data).toHaveProperty('id', productId);
    expect(response.body.data).toHaveProperty('name');
    expect(response.body.data).toHaveProperty('price');
    expect(response.body.data).toHaveProperty('stock');
  });

  it('GET /api/products/:id should return 404 if product does not exist', async () => {
    const response = await request(app).get('/api/products/999999');

    expect(response.statusCode).toBe(404);
    expect(response.body.ok).toBe(false);
    expect(response.body.error).toHaveProperty('message');
  });
});