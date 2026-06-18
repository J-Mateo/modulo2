import express from 'express';
import { productsController } from '../controllers/products.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { adminLogger } from '../middlewares/adminLogger.js';

const router = express.Router();

router.get('/products', productsController.getProducts);
router.get('/products/:id', productsController.getProductById);

router.post(
  '/products',
  authenticate,
  requireRole('ADMIN'),
  adminLogger('CREATE_PRODUCT', 'product'),
  productsController.createProduct
);

router.put(
  '/products/:id',
  authenticate,
  requireRole('ADMIN'),
  adminLogger('UPDATE_PRODUCT', 'product'),
  productsController.updateProduct
);

router.delete(
  '/products/:id',
  authenticate,
  requireRole('ADMIN'),
  adminLogger('DELETE_PRODUCT', 'product'),
  productsController.deleteProduct
);

export default router;