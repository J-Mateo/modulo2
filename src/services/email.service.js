import env from '../config/env.js';

const RESEND_API_URL =
  'https://api.resend.com/emails';

const getEmailConfig = () => {
  const apiKey =
    env.RESEND_API_KEY;

  const from =
    env.EMAIL_FROM;

  if (!apiKey) {
    throw new Error(
      'RESEND_API_KEY is not configured'
    );
  }

  if (!from) {
    throw new Error(
      'EMAIL_FROM is not configured'
    );
  }

  return {
    apiKey,
    from,
  };
};

const escapeHtml = (
  value = ''
) => {
  return String(value)
    .replaceAll(
      '&',
      '&amp;'
    )
    .replaceAll(
      '<',
      '&lt;'
    )
    .replaceAll(
      '>',
      '&gt;'
    )
    .replaceAll(
      '"',
      '&quot;'
    )
    .replaceAll(
      "'",
      '&#039;'
    );
};

const getFrontendUrl =
  () =>
    env.FRONTEND_URL.replace(
      /\/$/,
      ''
    );

const sendEmail = async ({
  to,
  subject,
  html,
}) => {
  const {
    apiKey,
    from,
  } =
    getEmailConfig();

  const response =
    await fetch(
      RESEND_API_URL,
      {
        method:
          'POST',

        headers: {
          Authorization:
            `Bearer ${apiKey}`,

          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({
            from,
            to: [
              to,
            ],
            subject,
            html,
          }),
      }
    );

  const data =
    await response
      .json()
      .catch(
        () => null
      );

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        'Email provider request failed'
    );
  }

  return data;
};

const sendWelcomeEmail =
  async ({
    to,
    userName,
  }) => {
    const frontendUrl =
      getFrontendUrl();

    const safeName =
      escapeHtml(
        userName || ''
      );

    const safeCatalogUrl =
      escapeHtml(
        `${frontendUrl}/products`
      );

    return sendEmail({
      to,

      subject:
        'Bienvenido a Rilmar Tech',

      html: `
        <!doctype html>

        <html lang="es">
          <head>
            <meta charset="utf-8" />

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
          </head>

          <body
            style="
              margin: 0;
              padding: 32px 16px;
              background: #f8fafc;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
            "
          >
            <div
              style="
                max-width: 600px;
                margin: 0 auto;
                padding: 32px;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                background: #ffffff;
              "
            >
              <p
                style="
                  margin: 0 0 12px;
                  color: #64748b;
                  font-size: 13px;
                  font-weight: 700;
                  letter-spacing: 0.08em;
                "
              >
                RILMAR TECH
              </p>

              <h1
                style="
                  margin: 0 0 20px;
                  color: #0f172a;
                  font-size: 26px;
                  line-height: 1.25;
                "
              >
                ¡Bienvenido a Rilmar Tech!
              </h1>

              <p
                style="
                  margin: 0 0 16px;
                  color: #334155;
                  font-size: 16px;
                  line-height: 1.6;
                "
              >
                ${
                  safeName
                    ? `${safeName}, `
                    : ''
                }tu cuenta se ha creado correctamente.
              </p>

              <p
                style="
                  margin: 0 0 28px;
                  color: #64748b;
                  font-size: 15px;
                  line-height: 1.6;
                "
              >
                Ya puedes explorar el catálogo,
                guardar productos y realizar tus compras.
              </p>

              <a
                href="${safeCatalogUrl}"
                style="
                  display: inline-block;
                  padding: 13px 20px;
                  border-radius: 8px;
                  background: #0f172a;
                  color: #ffffff;
                  font-size: 15px;
                  font-weight: 700;
                  text-decoration: none;
                "
              >
                Ver catálogo
              </a>
            </div>
          </body>
        </html>
      `,
    });
  };

const sendPasswordResetEmail =
  async ({
    to,
    userName,
    token,
  }) => {
    const frontendUrl =
      getFrontendUrl();

    const resetUrl =
      `${frontendUrl}/reset-password?token=${encodeURIComponent(
        token
      )}`;

    const safeName =
      escapeHtml(
        userName || ''
      );

    const safeResetUrl =
      escapeHtml(
        resetUrl
      );

    return sendEmail({
      to,

      subject:
        'Restablece tu contraseña de Rilmar Tech',

      html: `
        <!doctype html>

        <html lang="es">
          <head>
            <meta charset="utf-8" />

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
          </head>

          <body
            style="
              margin: 0;
              padding: 32px 16px;
              background: #f8fafc;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
            "
          >
            <div
              style="
                max-width: 600px;
                margin: 0 auto;
                padding: 32px;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                background: #ffffff;
              "
            >
              <p
                style="
                  margin: 0 0 12px;
                  color: #64748b;
                  font-size: 13px;
                  font-weight: 700;
                  letter-spacing: 0.08em;
                "
              >
                RILMAR TECH
              </p>

              <h1
                style="
                  margin: 0 0 20px;
                  color: #0f172a;
                  font-size: 26px;
                  line-height: 1.25;
                "
              >
                Restablece tu contraseña
              </h1>

              <p
                style="
                  margin: 0 0 16px;
                  color: #334155;
                  font-size: 16px;
                  line-height: 1.6;
                "
              >
                ${
                  safeName
                    ? `${safeName}, `
                    : ''
                }hemos recibido una solicitud para cambiar la contraseña de tu cuenta.
              </p>

              <p
                style="
                  margin: 0 0 28px;
                  color: #64748b;
                  font-size: 15px;
                  line-height: 1.6;
                "
              >
                El enlace es válido durante 15 minutos
                y solo puede utilizarse una vez.
              </p>

              <a
                href="${safeResetUrl}"
                style="
                  display: inline-block;
                  padding: 13px 20px;
                  border-radius: 8px;
                  background: #0f172a;
                  color: #ffffff;
                  font-size: 15px;
                  font-weight: 700;
                  text-decoration: none;
                "
              >
                Cambiar contraseña
              </a>

              <p
                style="
                  margin: 28px 0 0;
                  color: #94a3b8;
                  font-size: 12px;
                  line-height: 1.5;
                "
              >
                Si no has solicitado este cambio,
                puedes ignorar este correo.
                Tu contraseña seguirá siendo la misma.
              </p>
            </div>
          </body>
        </html>
      `,
    });
  };

const sendRestockEmail =
  async ({
    to,
    userName,
    product,
  }) => {
    const frontendUrl =
      getFrontendUrl();

    const productUrl =
      `${frontendUrl}/products/${product.id}`;

    const safeName =
      escapeHtml(
        userName || ''
      );

    const safeProductName =
      escapeHtml(
        product.name
      );

    const safeProductUrl =
      escapeHtml(
        productUrl
      );

    return sendEmail({
      to,

      subject:
        `${product.name} vuelve a estar disponible`,

      html: `
        <!doctype html>

        <html lang="es">
          <head>
            <meta charset="utf-8" />

            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
          </head>

          <body
            style="
              margin: 0;
              padding: 32px 16px;
              background: #f8fafc;
              color: #0f172a;
              font-family: Arial, Helvetica, sans-serif;
            "
          >
            <div
              style="
                max-width: 600px;
                margin: 0 auto;
                padding: 32px;
                border: 1px solid #e2e8f0;
                border-radius: 16px;
                background: #ffffff;
              "
            >
              <p
                style="
                  margin: 0 0 12px;
                  color: #64748b;
                  font-size: 13px;
                  font-weight: 700;
                  letter-spacing: 0.08em;
                "
              >
                RILMAR TECH
              </p>

              <h1
                style="
                  margin: 0 0 20px;
                  color: #0f172a;
                  font-size: 26px;
                  line-height: 1.25;
                "
              >
                ¡Ha vuelto a estar disponible!
              </h1>

              <p
                style="
                  margin: 0 0 16px;
                  color: #334155;
                  font-size: 16px;
                  line-height: 1.6;
                "
              >
                ${
                  safeName
                    ? `${safeName}, `
                    : ''
                }el producto

                <strong>
                  ${safeProductName}
                </strong>

                vuelve a tener stock.
              </p>

              <p
                style="
                  margin: 0 0 28px;
                  color: #64748b;
                  font-size: 15px;
                  line-height: 1.6;
                "
              >
                Te enviamos este mensaje porque
                solicitaste que te avisáramos cuando
                estuviera disponible de nuevo.
              </p>

              <a
                href="${safeProductUrl}"
                style="
                  display: inline-block;
                  padding: 13px 20px;
                  border-radius: 8px;
                  background: #0f172a;
                  color: #ffffff;
                  font-size: 15px;
                  font-weight: 700;
                  text-decoration: none;
                "
              >
                Ver producto
              </a>

              <p
                style="
                  margin: 28px 0 0;
                  color: #94a3b8;
                  font-size: 12px;
                  line-height: 1.5;
                "
              >
                La disponibilidad puede cambiar
                rápidamente y este aviso no reserva
                ninguna unidad.
              </p>
            </div>
          </body>
        </html>
      `,
    });
  };

export const emailService = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendRestockEmail,
};