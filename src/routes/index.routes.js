import express from 'express';
import productsRoutes from './products.routes.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    ok: true,
    data: {
      status: 'up',
    },
  });
});

router.use('/api', productsRoutes);

export default router;