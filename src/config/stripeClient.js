import Stripe from 'stripe';

import env from './env.js';

let stripeClient = null;

export const getStripeClient =
  () => {
    if (
      !env.STRIPE_SECRET_KEY
    ) {
      throw new Error(
        'STRIPE_SECRET_KEY is not configured'
      );
    }

    if (!stripeClient) {
      stripeClient =
        new Stripe(
          env.STRIPE_SECRET_KEY
        );
    }

    return stripeClient;
  };

export default getStripeClient;