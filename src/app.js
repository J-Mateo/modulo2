import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json' with { type: 'json' };
import cookieParser from 'cookie-parser';

import indexRoutes from './routes/index.routes.js';
import paymentRoutes from './routes/payment.routes.js';

import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';

import env from './config/env.js';

const app = express();

app.use(cookieParser());
app.use(helmet());

app.use(
  cors({
    origin:
      env.FRONTEND_URL,
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs:
    15 * 60 * 1000,

  max:
    env.NODE_ENV ===
    'production'
      ? 100
      : 5000,
});

app.use(limiter);

/*
 * Stripe must receive the exact raw request body
 * used to calculate the webhook signature.
 *
 * This route therefore has to be mounted BEFORE
 * express.json() and express.urlencoded().
 */
app.use(
  '/api/payments',
  paymentRoutes
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(
    swaggerDocument
  )
);

app.use(indexRoutes);

app.use(notFound);

app.use(errorHandler);

export default app;
