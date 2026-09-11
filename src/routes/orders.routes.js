import express from 'express';

import {
  ordersController,
} from '../controllers/orders.controller.js';

import {
  authenticate,
} from '../middlewares/authenticate.js';

import {
  requireRole,
} from '../middlewares/requireRole.js';

const router =
  express.Router();

router.get(
  '/admin',
  authenticate,
  requireRole('ADMIN'),
  ordersController.getAdminOrders
);

router.get(
  '/',
  authenticate,
  ordersController.getOrders
);

router.get(
  '/:id',
  authenticate,
  ordersController.getOrderById
);

export default router;