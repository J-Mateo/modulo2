import request from 'supertest';
import app from '../../src/app.js';

describe('Users endpoints', () => {
  it('GET /api/users/profile should fail without token', async () => {
    const response = await request(app).get('/api/users/profile');

    expect(response.statusCode).toBe(401);
    expect(response.body.ok).toBe(false);
    expect(response.body.error).toHaveProperty('message');
  });
});