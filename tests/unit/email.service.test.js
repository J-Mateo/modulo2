import {
  jest,
} from '@jest/globals';

const fetchMock =
  jest.fn();

const originalFetch =
  global.fetch;

const envMock = {
  RESEND_API_KEY:
    'test_resend_key',

  EMAIL_FROM:
    'Rilmar Tech <noreply@example.com>',

  FRONTEND_URL:
    'http://localhost:5173',
};

jest.unstable_mockModule(
  '../../src/config/env.js',
  () => ({
    default:
      envMock,
  })
);

beforeAll(() => {
  global.fetch =
    fetchMock;
});

afterAll(() => {
  global.fetch =
    originalFetch;
});

const {
  emailService,
} =
  await import(
    '../../src/services/email.service.js'
  );

describe(
  'emailService',
  () => {
    beforeEach(() => {
      jest.clearAllMocks();

      envMock.RESEND_API_KEY =
        'test_resend_key';

      envMock.EMAIL_FROM =
        'Rilmar Tech <noreply@example.com>';

      envMock.FRONTEND_URL =
        'http://localhost:5173';
    });

    test(
      'throws when RESEND_API_KEY is not configured',
      async () => {
        envMock.RESEND_API_KEY =
          undefined;

        await expect(
          emailService.sendEmail({
            to:
              'user@example.com',

            subject:
              'Test subject',

            html:
              '<p>Test email</p>',
          })
        ).rejects.toThrow(
          'RESEND_API_KEY is not configured'
        );

        expect(
          fetchMock
        ).not.toHaveBeenCalled();
      }
    );

    test(
      'throws when EMAIL_FROM is not configured',
      async () => {
        envMock.EMAIL_FROM =
          undefined;

        await expect(
          emailService.sendEmail({
            to:
              'user@example.com',

            subject:
              'Test subject',

            html:
              '<p>Test email</p>',
          })
        ).rejects.toThrow(
          'EMAIL_FROM is not configured'
        );

        expect(
          fetchMock
        ).not.toHaveBeenCalled();
      }
    );

    test(
      'sends email using Resend API',
      async () => {
        fetchMock
          .mockResolvedValue({
            ok: true,

            json:
              jest
                .fn()
                .mockResolvedValue({
                  id:
                    'email_123',
                }),
          });

        const result =
          await emailService
            .sendEmail({
              to:
                'user@example.com',

              subject:
                'Test subject',

              html:
                '<p>Test email</p>',
            });

        expect(
          fetchMock
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          fetchMock
        ).toHaveBeenCalledWith(
          'https://api.resend.com/emails',
          {
            method:
              'POST',

            headers: {
              Authorization:
                'Bearer test_resend_key',

              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                from:
                  'Rilmar Tech <noreply@example.com>',

                to: [
                  'user@example.com',
                ],

                subject:
                  'Test subject',

                html:
                  '<p>Test email</p>',
              }),
          }
        );

        expect(
          result
        ).toEqual({
          id:
            'email_123',
        });
      }
    );

    test(
      'throws provider error message when Resend request fails',
      async () => {
        fetchMock
          .mockResolvedValue({
            ok:
              false,

            json:
              jest
                .fn()
                .mockResolvedValue({
                  message:
                    'Invalid API key',
                }),
          });

        await expect(
          emailService.sendEmail({
            to:
              'user@example.com',

            subject:
              'Test subject',

            html:
              '<p>Test email</p>',
          })
        ).rejects.toThrow(
          'Invalid API key'
        );
      }
    );

    test(
      'throws fallback error when provider response has no usable message',
      async () => {
        fetchMock
          .mockResolvedValue({
            ok:
              false,

            json:
              jest
                .fn()
                .mockResolvedValue(
                  null
                ),
          });

        await expect(
          emailService.sendEmail({
            to:
              'user@example.com',

            subject:
              'Test subject',

            html:
              '<p>Test email</p>',
          })
        ).rejects.toThrow(
          'Email provider request failed'
        );
      }
    );

    test(
      'builds welcome email with catalog link',
      async () => {
        fetchMock
          .mockResolvedValue({
            ok:
              true,

            json:
              jest
                .fn()
                .mockResolvedValue({
                  id:
                    'welcome_123',
                }),
          });

        await emailService
          .sendWelcomeEmail({
            to:
              'user@example.com',

            userName:
              'Jessica',
          });

        const [
          ,
          requestOptions,
        ] =
          fetchMock.mock
            .calls[0];

        const body =
          JSON.parse(
            requestOptions.body
          );

        expect(
          body.to
        ).toEqual([
          'user@example.com',
        ]);

        expect(
          body.subject
        ).toBe(
          'Bienvenido a Rilmar Tech'
        );

        expect(
          body.html
        ).toContain(
          'Jessica'
        );

        expect(
          body.html
        ).toContain(
          'http://localhost:5173/products'
        );
      }
    );

    test(
      'builds password reset email with token link and expiry information',
      async () => {
        fetchMock
          .mockResolvedValue({
            ok:
              true,

            json:
              jest
                .fn()
                .mockResolvedValue({
                  id:
                    'reset_123',
                }),
          });

        await emailService
          .sendPasswordResetEmail({
            to:
              'user@example.com',

            userName:
              'Jessica',

            token:
              'abc123+/=',
          });

        const [
          ,
          requestOptions,
        ] =
          fetchMock.mock
            .calls[0];

        const body =
          JSON.parse(
            requestOptions.body
          );

        expect(
          body.subject
        ).toBe(
          'Restablece tu contraseña de Rilmar Tech'
        );

        expect(
          body.html
        ).toContain(
          'Jessica'
        );

        expect(
          body.html
        ).toContain(
          '15 minutos'
        );

        expect(
          body.html
        ).toContain(
          'http://localhost:5173/reset-password?token=abc123%2B%2F%3D'
        );
      }
    );

    test(
      'escapes dynamic HTML in welcome email',
      async () => {
        fetchMock
          .mockResolvedValue({
            ok:
              true,

            json:
              jest
                .fn()
                .mockResolvedValue({
                  id:
                    'welcome_escape',
                }),
          });

        await emailService
          .sendWelcomeEmail({
            to:
              'user@example.com',

            userName:
              '<script>alert("x")</script>',
          });

        const [
          ,
          requestOptions,
        ] =
          fetchMock.mock
            .calls[0];

        const body =
          JSON.parse(
            requestOptions.body
          );

        expect(
          body.html
        ).not.toContain(
          '<script>'
        );

        expect(
          body.html
        ).toContain(
          '&lt;script&gt;'
        );
      }
    );

    test(
      'builds restock email with product link',
      async () => {
        fetchMock
          .mockResolvedValue({
            ok:
              true,

            json:
              jest
                .fn()
                .mockResolvedValue({
                  id:
                    'email_456',
                }),
          });

        await emailService
          .sendRestockEmail({
            to:
              'user@example.com',

            userName:
              'Jessica',

            product: {
              id:
                25,

              name:
                'Gaming Laptop',

              stock:
                3,
            },
          });

        const [
          ,
          requestOptions,
        ] =
          fetchMock.mock
            .calls[0];

        const body =
          JSON.parse(
            requestOptions.body
          );

        expect(
          body.to
        ).toEqual([
          'user@example.com',
        ]);

        expect(
          body.subject
        ).toBe(
          'Gaming Laptop vuelve a estar disponible'
        );

        expect(
          body.html
        ).toContain(
          'http://localhost:5173/products/25'
        );

        expect(
          body.html
        ).toContain(
          'Jessica'
        );

        expect(
          body.html
        ).toContain(
          'Gaming Laptop'
        );
      }
    );

    test(
      'escapes dynamic HTML content in restock email',
      async () => {
        fetchMock
          .mockResolvedValue({
            ok:
              true,

            json:
              jest
                .fn()
                .mockResolvedValue({
                  id:
                    'email_789',
                }),
          });

        await emailService
          .sendRestockEmail({
            to:
              'user@example.com',

            userName:
              '<script>alert("x")</script>',

            product: {
              id:
                30,

              name:
                '<img src=x onerror=alert(1)>',

              stock:
                2,
            },
          });

        const [
          ,
          requestOptions,
        ] =
          fetchMock.mock
            .calls[0];

        const body =
          JSON.parse(
            requestOptions.body
          );

        expect(
          body.html
        ).not.toContain(
          '<script>'
        );

        expect(
          body.html
        ).not.toContain(
          '<img src=x'
        );

        expect(
          body.html
        ).toContain(
          '&lt;script&gt;'
        );

        expect(
          body.html
        ).toContain(
          '&lt;img src=x onerror=alert(1)&gt;'
        );
      }
    );
  }
);