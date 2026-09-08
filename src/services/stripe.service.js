import env from '../config/env.js';
import { getStripeClient } from '../config/stripeClient.js';

const toStripeAmount = (decimalValue) => {
  const amount = Math.round(Number(decimalValue) * 100);

  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new Error('Invalid Stripe amount');
  }

  return amount;
};

const getStripeImages = (productImage) => {
  if (typeof productImage !== 'string') {
    return [];
  }

  try {
    const url = new URL(productImage);

    if (url.protocol !== 'https:') {
      return [];
    }

    return [url.toString()];
  } catch {
    return [];
  }
};

const createCheckoutSession = async ({ order, userEmail }) => {
  const stripe = getStripeClient();

  const sessionConfig = {
    mode: 'payment',
    customer_email: userEmail,
    line_items: order.items.map((item) => {
      const images = getStripeImages(item.productImage);

      return {
        quantity: item.quantity,
        price_data: {
          currency: 'eur',
          unit_amount: toStripeAmount(item.priceAtPurchase),
          product_data: {
            name: item.productName,
            ...(images.length > 0 ? { images } : {}),
          },
        },
      };
    }),
    metadata: {
      orderId: String(order.id),
      userId: String(order.userId),
    },
    client_reference_id: String(order.id),
    success_url: `${env.FRONTEND_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_URL}/cart`,
  };

  return stripe.checkout.sessions.create(sessionConfig, {
    idempotencyKey: `checkout_order_${order.id}`,
  });
};

const expireCheckoutSession = async (sessionId) => {
  if (typeof sessionId !== 'string' || !sessionId.trim()) {
    throw new Error('Stripe Checkout Session ID is required');
  }

  const stripe = getStripeClient();

  return stripe.checkout.sessions.expire(sessionId);
};

export const stripeService = {
  createCheckoutSession,
  expireCheckoutSession,
};