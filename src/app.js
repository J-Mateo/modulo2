import express from 'express';
import indexRoutes from './routes/index.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(indexRoutes);

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: {
      message: 'Route not found',
    },
  });
});
app.use(errorHandler);

export default app;