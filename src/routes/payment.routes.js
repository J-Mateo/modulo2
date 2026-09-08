import express from 'express';

import {
  paymentController,
} from '../controllers/payment.controller.js';

import {
  authenticate,
} from '../middlewares/authenticate.js';

const router =
  express.Router();

router.post(
  '/webhook',

  express.raw({
    type:
      'application/json',
  }),

  paymentController
    .stripeWebhook
);

router.get(
  '/checkout-session/:sessionId',

  authenticate,

  paymentController
    .getCheckoutOrder
);

export default router;