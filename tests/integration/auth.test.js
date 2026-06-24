import request from 'supertest';
import app from '../../src/app.js';

describe('Auth endpoints', () => {
  it('POST /api/auth/login should set httpOnly cookie and return user data with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'password123',
      });

expect(response.statusCode).toBe(200);
expect(response.body.success).toBe(true);
expect(response.body.data).not.toHaveProperty('token');
expect(response.body.data).toHaveProperty('user');
expect(response.headers['set-cookie']).toBeDefined();

const cookies = response.headers['set-cookie'];
expect(cookies.some((cookie) => cookie.startsWith('access_token='))).toBe(true);
expect(cookies.some((cookie) => cookie.includes('HttpOnly'))).toBe(true);

expect(response.body.data.user).toHaveProperty('id');
expect(response.body.data.user).toHaveProperty('email');
expect(response.body.data.user).toHaveProperty('role');
expect(response.body.data.user).toHaveProperty('createdAt');
});
  it('POST /api/auth/login should fail with invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@test.com',
        password: 'wrong-password',
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toHaveProperty('message');
  });

  it('POST /api/auth/register should create a new user', async () => {
    const uniqueEmail = `test${Date.now()}@mail.com`;

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: uniqueEmail,
        password: 'Password123!',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.email).toBe(uniqueEmail);
    expect(response.body.data).toHaveProperty('role');
    expect(response.body.data).toHaveProperty('createdAt');
  });
  it('POST /api/auth/register should fail if email already exists', async () => {
  const email = `duplicate${Date.now()}@mail.com`;

  await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'Password123!',
    });

  const response = await request(app)
    .post('/api/auth/register')
    .send({
      email,
      password: 'Password123!',
    });

  expect(response.body.success).toBe(false);

  expect([400, 409]).toContain(response.statusCode);

  expect(response.body.error).toHaveProperty('message');
});
});