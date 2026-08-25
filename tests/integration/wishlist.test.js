import request from 'supertest';
import app from '../../src/app.js';

describe('Wishlist endpoints', () => {
  const loginAndGetCookies = async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'password123',
      });

    expect(loginResponse.statusCode).toBe(200);

    return loginResponse.headers['set-cookie'];
  };

  it('GET /api/wishlist should fail without authentication', async () => {
    const response = await request(app)
      .get('/api/wishlist');

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);

    expect(response.body.error).toHaveProperty('code');
    expect(response.body.error).toHaveProperty('message');
  });

  it('GET /api/wishlist should return wishlist with valid cookie', async () => {
    const cookies = await loginAndGetCookies();

    const response = await request(app)
      .get('/api/wishlist')
      .set('Cookie', cookies);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    expect(response.body.data).toHaveProperty('productIds');
    expect(
      Array.isArray(response.body.data.productIds)
    ).toBe(true);

    expect(response.body.data).not.toHaveProperty('userId');
    expect(response.body.data).not.toHaveProperty('_id');
    expect(response.body.data).not.toHaveProperty('createdAt');
    expect(response.body.data).not.toHaveProperty('updatedAt');
  }, 15000);

  it('POST /api/wishlist/:productId should toggle product in wishlist with valid cookie', async () => {
    const cookies = await loginAndGetCookies();

    const productsResponse = await request(app)
      .get('/api/products');

    expect(productsResponse.statusCode).toBe(200);
    expect(
      Array.isArray(productsResponse.body.data)
    ).toBe(true);
    expect(productsResponse.body.data.length).toBeGreaterThan(0);

    const productId = productsResponse.body.data[0].id;

    const beforeResponse = await request(app)
      .get('/api/wishlist')
      .set('Cookie', cookies);

    const wasInWishlist =
      beforeResponse.body.data.productIds.includes(
        String(productId)
      );

    const toggleResponse = await request(app)
      .post(`/api/wishlist/${productId}`)
      .set('Cookie', cookies);

    expect(toggleResponse.statusCode).toBe(200);
    expect(toggleResponse.body.success).toBe(true);

    expect(toggleResponse.body.data).toHaveProperty(
      'productIds'
    );

    expect(
      Array.isArray(toggleResponse.body.data.productIds)
    ).toBe(true);

    expect(toggleResponse.body.data).not.toHaveProperty(
      'userId'
    );

    if (wasInWishlist) {
      expect(
        toggleResponse.body.data.productIds
      ).not.toContain(String(productId));
    } else {
      expect(
        toggleResponse.body.data.productIds
      ).toContain(String(productId));
    }

    const restoreResponse = await request(app)
      .post(`/api/wishlist/${productId}`)
      .set('Cookie', cookies);

    expect(restoreResponse.statusCode).toBe(200);

    const restoredProductIds =
      restoreResponse.body.data.productIds;

    if (wasInWishlist) {
      expect(restoredProductIds).toContain(
        String(productId)
      );
    } else {
      expect(restoredProductIds).not.toContain(
        String(productId)
      );
    }
  }, 15000);
});