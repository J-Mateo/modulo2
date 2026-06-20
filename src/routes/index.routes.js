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

const apiRouter = express.Router();

apiRouter.use('/products', productsRoutes);              
apiRouter.use('/products/:productId/reviews', reviewsRoutes); 
apiRouter.use('/auth', authRoutes);                       
apiRouter.use('/users', usersRoutes);                    
apiRouter.use('/wishlist', wishlistRoutes);              
apiRouter.use('/cart', cartRoutes);                       


router.use('/api', apiRouter);

export default router;