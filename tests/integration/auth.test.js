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

    const cookies = response.headers['set-cookie'];

    expect(cookies).toBeDefined();
    expect(
      cookies.some((cookie) =>
        cookie.startsWith('access_token=')
      )
    ).toBe(true);

    expect(
      cookies.some((cookie) =>
        cookie.includes('HttpOnly')
      )
    ).toBe(true);

    expect(response.body.data.user).toHaveProperty('id');
    expect(response.body.data.user).toHaveProperty('name');
    expect(response.body.data.user).toHaveProperty('email');
    expect(response.body.data.user).toHaveProperty('role');
    expect(response.body.data.user).toHaveProperty('createdAt');

    expect(response.body.data.user).not.toHaveProperty(
      'passwordHash'
    );
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

    expect(response.body.error).toHaveProperty('code');
    expect(response.body.error).toHaveProperty('message');
  });

  it('POST /api/auth/register should create a new user and set httpOnly cookie', async () => {
    const uniqueEmail = `test${Date.now()}@mail.com`;

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: uniqueEmail,
        password: 'Password123!',
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);

    expect(response.body.data).toHaveProperty('user');

    const user = response.body.data.user;

    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name', 'Test User');
    expect(user).toHaveProperty('email', uniqueEmail);
    expect(user).toHaveProperty('role');
    expect(user).toHaveProperty('createdAt');

    expect(user).not.toHaveProperty('passwordHash');
    expect(response.body.data).not.toHaveProperty('token');

    const cookies = response.headers['set-cookie'];

    expect(cookies).toBeDefined();
    expect(
      cookies.some((cookie) =>
        cookie.startsWith('access_token=')
      )
    ).toBe(true);

    expect(
      cookies.some((cookie) =>
        cookie.includes('HttpOnly')
      )
    ).toBe(true);
  });

  it('POST /api/auth/register should fail if email already exists', async () => {
    const email = `duplicate${Date.now()}@mail.com`;

    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate User',
        email,
        password: 'Password123!',
      });

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Duplicate User',
        email,
        password: 'Password123!',
      });

    expect(response.statusCode).toBe(409);
    expect(response.body.success).toBe(false);

    expect(response.body.error).toHaveProperty('code');
    expect(response.body.error).toHaveProperty('message');
  });
});