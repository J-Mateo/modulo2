import express from 'express';
import productsRoutes from './products.routes.js';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import reviewsRoutes from './reviews.routes.js';
import wishlistRoutes from './wishlist.routes.js';
import cartRoutes from './cart.routes.js';

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
router.use('/api', reviewsRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/users', usersRoutes);
router.use('/api', wishlistRoutes);
router.use('/api/cart', cartRoutes);



export default router;