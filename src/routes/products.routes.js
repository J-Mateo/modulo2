import express from 'express';

import { productsController } from '../controllers/products.controller.js';

import { authenticate } from '../middlewares/authenticate.js';
import { requireRole } from '../middlewares/requireRole.js';
import { adminLogger } from '../middlewares/adminLogger.js';
import { noCache } from '../middlewares/noCache.js';

import upload from '../config/multer.js';

const router = express.Router();

router.get(
  '/',
  noCache,
  productsController.getProducts
);

router.get(
  '/admin',
  authenticate,
  requireRole('ADMIN'),
  productsController.getProductsForAdmin
);

router.get(
  '/admin/:id',
  authenticate,
  requireRole('ADMIN'),
  productsController.getProductByIdForAdmin
);

router.get(
  '/:id/restock-alert',
  authenticate,
  productsController.getRestockAlert
);

router.post(
  '/:id/restock-alert',
  authenticate,
  productsController.subscribeRestockAlert
);

router.delete(
  '/:id/restock-alert',
  authenticate,
  productsController.cancelRestockAlert
);

router.patch(
  '/:id/restore',
  authenticate,
  requireRole('ADMIN'),
  adminLogger(
    'RESTORE_PRODUCT',
    'product'
  ),
  productsController.restoreProduct
);

router.get(
  '/:id',
  noCache,
  productsController.getProductById
);

router.post(
  '/',
  authenticate,
  requireRole('ADMIN'),
  upload.array('images', 6),
  adminLogger(
    'CREATE_PRODUCT',
    'product'
  ),
  productsController.createProduct
);

router.put(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  upload.array('images', 6),
  adminLogger(
    'UPDATE_PRODUCT',
    'product'
  ),
  productsController.updateProduct
);

router.delete(
  '/:id',
  authenticate,
  requireRole('ADMIN'),
  adminLogger(
    'DELETE_PRODUCT',
    'product'
  ),
  productsController.deleteProduct
);

export default router;