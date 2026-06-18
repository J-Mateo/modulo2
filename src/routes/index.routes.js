import express from 'express';
import productsRoutes from './products.routes.js';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';

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
router.use('/api/auth', authRoutes);
router.use('/api/users', usersRoutes);

export default router;