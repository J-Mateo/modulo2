import 'dotenv/config';

const env = {
  NODE_ENV:
    process.env.NODE_ENV ||
    'development',

  PORT:
    process.env.PORT ||
    3000,

  DATABASE_URL:
    process.env.DATABASE_URL,

  DIRECT_URL:
    process.env.DIRECT_URL,

  MONGO_URI:
    process.env.MONGO_URI,

  JWT_SECRET:
    process.env.JWT_SECRET,

  JWT_EXPIRES_IN:
    process.env.JWT_EXPIRES_IN ||
    '7d',

  FRONTEND_URL:
    process.env.FRONTEND_URL ||
    'http://localhost:5173',

  CLOUDINARY_CLOUD_NAME:
    process.env
      .CLOUDINARY_CLOUD_NAME,

  CLOUDINARY_API_KEY:
    process.env
      .CLOUDINARY_API_KEY,

  CLOUDINARY_API_SECRET:
    process.env
      .CLOUDINARY_API_SECRET,

  RESEND_API_KEY:
    process.env.RESEND_API_KEY,

  EMAIL_FROM:
    process.env.EMAIL_FROM,

  STRIPE_SECRET_KEY:
    process.env
      .STRIPE_SECRET_KEY,

  STRIPE_WEBHOOK_SECRET:
    process.env
      .STRIPE_WEBHOOK_SECRET,
};

if (!env.MONGO_URI) {
  throw new Error(
    'MONGO_URI is required'
  );
}

if (!env.JWT_SECRET) {
  throw new Error(
    'JWT_SECRET is required'
  );
}

if (
  !env.CLOUDINARY_CLOUD_NAME
) {
  throw new Error(
    'CLOUDINARY_CLOUD_NAME is required'
  );
}

if (
  !env.CLOUDINARY_API_KEY
) {
  throw new Error(
    'CLOUDINARY_API_KEY is required'
  );
}

if (
  !env.CLOUDINARY_API_SECRET
) {
  throw new Error(
    'CLOUDINARY_API_SECRET is required'
  );
}

export default env;