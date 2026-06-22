import request from 'supertest';
import app from '../../src/app.js';

describe('Health endpoint', () => {
  it('GET /health should return API status', async () => {
    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      data: {
        status: 'up',
      },
    });
  });
});