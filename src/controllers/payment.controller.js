import env from '../config/env.js';

import {
  getStripeClient,
} from '../config/stripeClient.js';

import {
  paymentService,
} from '../services/payment.service.js';

const stripeWebhook =
  async (
    req,
    res,
    next
  ) => {
    try {
      if (
        !env.STRIPE_WEBHOOK_SECRET
      ) {
        console.error(
          '[STRIPE_WEBHOOK_NOT_CONFIGURED]'
        );

        return res
          .status(503)
          .json({
            success: false,

            error: {
              message:
                'Payment webhook is not configured',
            },
          });
      }

      const signature =
        req.headers[
          'stripe-signature'
        ];

      if (
        typeof signature !==
          'string' ||
        !signature
      ) {
        return res
          .status(400)
          .json({
            success: false,

            error: {
              message:
                'Missing Stripe signature',
            },
          });
      }

      const stripe =
        getStripeClient();

      let event;

      try {
        event =
          stripe.webhooks
            .constructEvent(
              req.body,
              signature,
              env
                .STRIPE_WEBHOOK_SECRET
            );
      } catch (error) {
        console.error(
          '[STRIPE_WEBHOOK_SIGNATURE_INVALID]',
          {
            message:
              error.message,
          }
        );

        return res
          .status(400)
          .json({
            success: false,

            error: {
              message:
                'Invalid Stripe signature',
            },
          });
      }

      await paymentService
        .processStripeEvent(
          event
        );

      return res
        .status(200)
        .json({
          received: true,
        });
    } catch (error) {
      return next(error);
    }
  };

const getCheckoutOrder =
  async (
    req,
    res,
    next
  ) => {
    try {
      const order =
        await paymentService
          .getCheckoutOrder({
            sessionId:
              req.params.sessionId,

            userId:
              req.user.userId,
          });

      return res.json({
        success: true,
        data:
          order,
      });
    } catch (error) {
      return next(error);
    }
  };

export const paymentController = {
  stripeWebhook,
  getCheckoutOrder,
};