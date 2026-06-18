import express from 'express';
import { productsController } from '../controllers/products.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';

const router = express.Router();

router.get('/products', productsController.getProducts);
router.get('/products/:id', productsController.getProductById);

router.post('/products', authenticate, requireRole('ADMIN'), productsController.createProduct);
router.put('/products/:id', authenticate, requireRole('ADMIN'), productsController.updateProduct);
router.delete('/products/:id', authenticate, requireRole('ADMIN'), productsController.deleteProduct);

export default router;