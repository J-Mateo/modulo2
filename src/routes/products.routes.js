import express from 'express';
import { productsController } from '../controllers/products.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { adminLogger } from '../middlewares/adminLogger.js';
import upload from '../config/multer.js';

const router = express.Router();

router.get('/', productsController.getProducts);
router.get('/:id', productsController.getProductById);

router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  upload.single('image'),                   
  adminLogger('CREATE_PRODUCT', 'product'), 
  productsController.createProduct
);

router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  upload.single('image'),                   
  adminLogger('UPDATE_PRODUCT', 'product'),
  productsController.updateProduct     
);

router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  adminLogger('DELETE_PRODUCT', 'product'), 
  productsController.deleteProduct
);

export default router;