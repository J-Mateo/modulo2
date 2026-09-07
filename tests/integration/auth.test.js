import {
  jest,
} from '@jest/globals';

import bcrypt from 'bcrypt';
import request from 'supertest';

const sendWelcomeEmailMock =
  jest.fn();

const sendPasswordResetEmailMock =
  jest.fn();

const sendRestockEmailMock =
  jest.fn();

const sendEmailMock =
  jest.fn();

jest.unstable_mockModule(
  '../../src/services/email.service.js',
  () => ({
    emailService: {
      sendEmail:
        sendEmailMock,

      sendWelcomeEmail:
        sendWelcomeEmailMock,

      sendPasswordResetEmail:
        sendPasswordResetEmailMock,

      sendRestockEmail:
        sendRestockEmailMock,
    },
  })
);

const {
  default: app,
} =
  await import(
    '../../src/app.js'
  );

const {
  default: prisma,
} =
  await import(
    '../../src/config/prismaClient.js'
  );

const createUniqueEmail =
  (
    prefix =
      'auth'
  ) =>
    `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}@mail.com`;

const getAccessTokenCookie =
  (response) => {
    const cookies =
      response.headers[
        'set-cookie'
      ] ?? [];

    return cookies.find(
      (cookie) =>
        cookie.startsWith(
          'access_token='
        )
    );
  };

const registerUser =
  async ({
    email =
      createUniqueEmail(),
    password =
      'Password123!',
    name =
      'Test User',
  } = {}) => {
    return request(app)
      .post(
        '/api/auth/register'
      )
      .send({
        name,
        email,
        password,
      });
  };

describe(
  'Auth endpoints',
  () => {
    beforeEach(() => {
      jest.clearAllMocks();

      sendWelcomeEmailMock
        .mockResolvedValue({
          id:
            'welcome-email',
        });

      sendPasswordResetEmailMock
        .mockResolvedValue({
          id:
            'reset-email',
        });

      sendRestockEmailMock
        .mockResolvedValue({
          id:
            'restock-email',
        });

      sendEmailMock
        .mockResolvedValue({
          id:
            'generic-email',
        });
    });

    it(
      'POST /api/auth/login should set httpOnly cookie and return user data with valid credentials',
      async () => {
        const response =
          await request(app)
            .post(
              '/api/auth/login'
            )
            .send({
              email:
                'user@test.com',

              password:
                'password123',
            });

        expect(
          response.statusCode
        ).toBe(200);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data
        ).not.toHaveProperty(
          'token'
        );

        expect(
          response.body.data
        ).toHaveProperty(
          'user'
        );

        const cookies =
          response.headers[
            'set-cookie'
          ];

        expect(
          cookies
        ).toBeDefined();

        expect(
          cookies.some(
            (cookie) =>
              cookie.startsWith(
                'access_token='
              )
          )
        ).toBe(true);

        expect(
          cookies.some(
            (cookie) =>
              cookie.includes(
                'HttpOnly'
              )
          )
        ).toBe(true);

        expect(
          response.body.data.user
        ).toHaveProperty(
          'id'
        );

        expect(
          response.body.data.user
        ).toHaveProperty(
          'name'
        );

        expect(
          response.body.data.user
        ).toHaveProperty(
          'email'
        );

        expect(
          response.body.data.user
        ).toHaveProperty(
          'role'
        );

        expect(
          response.body.data.user
        ).toHaveProperty(
          'createdAt'
        );

        expect(
          response.body.data.user
        ).not.toHaveProperty(
          'passwordHash'
        );
      }
    );

    it(
      'POST /api/auth/login should fail with invalid credentials',
      async () => {
        const response =
          await request(app)
            .post(
              '/api/auth/login'
            )
            .send({
              email:
                'user@test.com',

              password:
                'wrong-password',
            });

        expect(
          response.statusCode
        ).toBe(401);

        expect(
          response.body.success
        ).toBe(false);

        expect(
          response.body.error
        ).toHaveProperty(
          'code'
        );

        expect(
          response.body.error
        ).toHaveProperty(
          'message'
        );
      }
    );

    it(
      'POST /api/auth/register should create a new user, send welcome email and set httpOnly cookie',
      async () => {
        const email =
          createUniqueEmail(
            'register'
          );

        const response =
          await registerUser({
            email,
          });

        expect(
          response.statusCode
        ).toBe(201);

        expect(
          response.body.success
        ).toBe(true);

        expect(
          response.body.data
        ).toHaveProperty(
          'user'
        );

        const user =
          response.body.data.user;

        expect(
          user
        ).toHaveProperty(
          'id'
        );

        expect(
          user
        ).toHaveProperty(
          'name',
          'Test User'
        );

        expect(
          user
        ).toHaveProperty(
          'email',
          email
        );

        expect(
          user
        ).toHaveProperty(
          'role'
        );

        expect(
          user
        ).toHaveProperty(
          'createdAt'
        );

        expect(
          user
        ).not.toHaveProperty(
          'passwordHash'
        );

        expect(
          response.body.data
        ).not.toHaveProperty(
          'token'
        );

        const cookies =
          response.headers[
            'set-cookie'
          ];

        expect(
          cookies
        ).toBeDefined();

        expect(
          cookies.some(
            (cookie) =>
              cookie.startsWith(
                'access_token='
              )
          )
        ).toBe(true);

        expect(
          cookies.some(
            (cookie) =>
              cookie.includes(
                'HttpOnly'
              )
          )
        ).toBe(true);

        expect(
          sendWelcomeEmailMock
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          sendWelcomeEmailMock
        ).toHaveBeenCalledWith({
          to:
            email,

          userName:
            'Test User',
        });
      }
    );

    it(
      'POST /api/auth/register should fail if email already exists',
      async () => {
        const email =
          createUniqueEmail(
            'duplicate'
          );

        await registerUser({
          email,
        });

        const response =
          await registerUser({
            email,
          });

        expect(
          response.statusCode
        ).toBe(409);

        expect(
          response.body.success
        ).toBe(false);

        expect(
          response.body.error
        ).toHaveProperty(
          'code'
        );

        expect(
          response.body.error
        ).toHaveProperty(
          'message'
        );
      }
    );

    it(
      'POST /api/auth/register should reject weak passwords',
      async () => {
        const response =
          await registerUser({
            email:
              createUniqueEmail(
                'weak-password'
              ),

            password:
              'password',
          });

        expect(
          response.statusCode
        ).toBe(400);

        expect(
          response.body.success
        ).toBe(false);

        expect(
          response.body.error.message
        ).toContain(
          'Password must contain'
        );

        expect(
          sendWelcomeEmailMock
        ).not.toHaveBeenCalled();
      }
    );

    it(
      'POST /api/auth/forgot-password should return the same public response whether the email exists or not',
      async () => {
        const email =
          createUniqueEmail(
            'forgot'
          );

        await registerUser({
          email,
        });

        jest.clearAllMocks();

        sendPasswordResetEmailMock
          .mockResolvedValue({
            id:
              'reset-email',
          });

        const existingResponse =
          await request(app)
            .post(
              '/api/auth/forgot-password'
            )
            .send({
              email,
            });

        const missingResponse =
          await request(app)
            .post(
              '/api/auth/forgot-password'
            )
            .send({
              email:
                createUniqueEmail(
                  'missing'
                ),
            });

        expect(
          existingResponse.statusCode
        ).toBe(200);

        expect(
          missingResponse.statusCode
        ).toBe(200);

        expect(
          existingResponse.body.message
        ).toBe(
          missingResponse.body.message
        );

        expect(
          existingResponse.body.success
        ).toBe(true);

        expect(
          missingResponse.body.success
        ).toBe(true);

        expect(
          sendPasswordResetEmailMock
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          sendPasswordResetEmailMock
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            to:
              email,

            token:
              expect.any(
                String
              ),
          })
        );
      }
    );

    it(
      'POST /api/auth/reset-password should reset password using a valid one-time token',
      async () => {
        const email =
          createUniqueEmail(
            'reset-valid'
          );

        const oldPassword =
          'Password123!';

        const newPassword =
          'NewPassword456!';

        await registerUser({
          email,
          password:
            oldPassword,
        });

        jest.clearAllMocks();

        sendPasswordResetEmailMock
          .mockResolvedValue({
            id:
              'reset-email',
          });

        const forgotResponse =
          await request(app)
            .post(
              '/api/auth/forgot-password'
            )
            .send({
              email,
            });

        expect(
          forgotResponse.statusCode
        ).toBe(200);

        expect(
          sendPasswordResetEmailMock
        ).toHaveBeenCalledTimes(
          1
        );

        const {
          token,
        } =
          sendPasswordResetEmailMock
            .mock
            .calls[0][0];

        expect(
          token
        ).toEqual(
          expect.any(
            String
          )
        );

        const resetResponse =
          await request(app)
            .post(
              '/api/auth/reset-password'
            )
            .send({
              token,
              password:
                newPassword,
            });

        expect(
          resetResponse.statusCode
        ).toBe(200);

        expect(
          resetResponse.body.success
        ).toBe(true);

        const oldLoginResponse =
          await request(app)
            .post(
              '/api/auth/login'
            )
            .send({
              email,

              password:
                oldPassword,
            });

        expect(
          oldLoginResponse.statusCode
        ).toBe(401);

        const newLoginResponse =
          await request(app)
            .post(
              '/api/auth/login'
            )
            .send({
              email,

              password:
                newPassword,
            });

        expect(
          newLoginResponse.statusCode
        ).toBe(200);
      }
    );

    it(
      'POST /api/auth/reset-password should reject reuse of a consumed token',
      async () => {
        const email =
          createUniqueEmail(
            'single-use'
          );

        await registerUser({
          email,
        });

        jest.clearAllMocks();

        sendPasswordResetEmailMock
          .mockResolvedValue({
            id:
              'reset-email',
          });

        await request(app)
          .post(
            '/api/auth/forgot-password'
          )
          .send({
            email,
          });

        const {
          token,
        } =
          sendPasswordResetEmailMock
            .mock
            .calls[0][0];

        const firstResponse =
          await request(app)
            .post(
              '/api/auth/reset-password'
            )
            .send({
              token,

              password:
                'NewPassword456!',
            });

        expect(
          firstResponse.statusCode
        ).toBe(200);

        const secondResponse =
          await request(app)
            .post(
              '/api/auth/reset-password'
            )
            .send({
              token,

              password:
                'AnotherPassword789!',
            });

        expect(
          secondResponse.statusCode
        ).toBe(400);

        expect(
          secondResponse.body.success
        ).toBe(false);
      }
    );

    it(
      'POST /api/auth/reset-password should reject expired tokens',
      async () => {
        const email =
          createUniqueEmail(
            'expired'
          );

        await registerUser({
          email,
        });

        jest.clearAllMocks();

        sendPasswordResetEmailMock
          .mockResolvedValue({
            id:
              'reset-email',
          });

        await request(app)
          .post(
            '/api/auth/forgot-password'
          )
          .send({
            email,
          });

        const {
          token,
        } =
          sendPasswordResetEmailMock
            .mock
            .calls[0][0];

        await prisma.user.update({
          where: {
            email,
          },

          data: {
            passwordResetExpiresAt:
              new Date(
                Date.now() -
                  60_000
              ),
          },
        });

        const response =
          await request(app)
            .post(
              '/api/auth/reset-password'
            )
            .send({
              token,

              password:
                'NewPassword456!',
            });

        expect(
          response.statusCode
        ).toBe(400);

        expect(
          response.body.success
        ).toBe(false);

        expect(
          response.body.error.message
        ).toContain(
          'Invalid or expired'
        );
      }
    );

    it(
      'password reset should invalidate previously issued authentication cookies',
      async () => {
        const email =
          createUniqueEmail(
            'invalidate-session'
          );

        const registerResponse =
          await registerUser({
            email,
          });

        const oldCookie =
          getAccessTokenCookie(
            registerResponse
          );

        expect(
          oldCookie
        ).toBeDefined();

        const beforeResetResponse =
          await request(app)
            .get(
              '/api/users/profile'
            )
            .set(
              'Cookie',
              oldCookie
            );

        expect(
          beforeResetResponse.statusCode
        ).toBe(200);

        jest.clearAllMocks();

        sendPasswordResetEmailMock
          .mockResolvedValue({
            id:
              'reset-email',
          });

        await request(app)
          .post(
            '/api/auth/forgot-password'
          )
          .send({
            email,
          });

        const {
          token,
        } =
          sendPasswordResetEmailMock
            .mock
            .calls[0][0];

        const resetResponse =
          await request(app)
            .post(
              '/api/auth/reset-password'
            )
            .send({
              token,

              password:
                'NewPassword456!',
            });

        expect(
          resetResponse.statusCode
        ).toBe(200);

        const afterResetResponse =
          await request(app)
            .get(
              '/api/users/profile'
            )
            .set(
              'Cookie',
              oldCookie
            );

        expect(
          afterResetResponse.statusCode
        ).toBe(401);
      }
    );

    it(
      'reset-password should reject a weak replacement password',
      async () => {
        const email =
          createUniqueEmail(
            'weak-reset'
          );

        await registerUser({
          email,
        });

        jest.clearAllMocks();

        sendPasswordResetEmailMock
          .mockResolvedValue({
            id:
              'reset-email',
          });

        await request(app)
          .post(
            '/api/auth/forgot-password'
          )
          .send({
            email,
          });

        const {
          token,
        } =
          sendPasswordResetEmailMock
            .mock
            .calls[0][0];

        const response =
          await request(app)
            .post(
              '/api/auth/reset-password'
            )
            .send({
              token,

              password:
                'weakpassword',
            });

        expect(
          response.statusCode
        ).toBe(400);

        expect(
          response.body.error.message
        ).toContain(
          'Password must contain'
        );
      }
    );

    it(
      'password is stored as a bcrypt hash after reset',
      async () => {
        const email =
          createUniqueEmail(
            'reset-hash'
          );

        const newPassword =
          'SecureReset456!';

        await registerUser({
          email,
        });

        jest.clearAllMocks();

        sendPasswordResetEmailMock
          .mockResolvedValue({
            id:
              'reset-email',
          });

        await request(app)
          .post(
            '/api/auth/forgot-password'
          )
          .send({
            email,
          });

        const {
          token,
        } =
          sendPasswordResetEmailMock
            .mock
            .calls[0][0];

        await request(app)
          .post(
            '/api/auth/reset-password'
          )
          .send({
            token,
            password:
              newPassword,
          });

        const user =
          await prisma.user.findUnique({
            where: {
              email,
            },

            select: {
              passwordHash:
                true,

              passwordResetTokenHash:
                true,

              passwordResetExpiresAt:
                true,
            },
          });

        expect(
          user.passwordHash
        ).not.toBe(
          newPassword
        );

        expect(
          await bcrypt.compare(
            newPassword,
            user.passwordHash
          )
        ).toBe(true);

        expect(
          user.passwordResetTokenHash
        ).toBeNull();

        expect(
          user.passwordResetExpiresAt
        ).toBeNull();
      }
    );
  }
);