import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../swagger.json' with { type: 'json' };

import indexRoutes from './routes/index.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import env from './config/env.js';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cookieParser());
app.use(helmet());

app.use(
  cors({
    origin: env.FRONTEND_URL,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  '/api/docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

app.use(indexRoutes);

app.use(notFound);

app.use(errorHandler);

export default app;