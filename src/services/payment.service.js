import prisma from '../config/prismaClient.js';

import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

const getOrderIdFromSession = (
  session
) => {
  const rawOrderId =
    session?.metadata?.orderId ??
    session?.client_reference_id;

  const orderId =
    Number(rawOrderId);

  if (
    !Number.isInteger(orderId) ||
    orderId <= 0
  ) {
    return null;
  }

  return orderId;
};

const getPaymentIntentId = (
  session
) => {
  if (
    typeof session?.payment_intent ===
    'string'
  ) {
    return session.payment_intent;
  }

  if (
    typeof session?.payment_intent?.id ===
    'string'
  ) {
    return session.payment_intent.id;
  }

  return null;
};

const handleCheckoutCompleted =
  async (
    session
  ) => {
    if (
      session?.payment_status !==
      'paid'
    ) {
      return {
        processed: false,
        reason:
          'payment_not_paid',
      };
    }

    const orderId =
      getOrderIdFromSession(
        session
      );

    if (!orderId) {
      console.error(
        '[STRIPE_WEBHOOK_INVALID_ORDER]',
        {
          event:
            'checkout.session.completed',

          stripeCheckoutSessionId:
            session?.id ?? null,
        }
      );

      return {
        processed: false,
        reason:
          'invalid_order_id',
      };
    }

    const stripeSessionId =
      typeof session?.id ===
      'string'
        ? session.id
        : null;

    const paymentIntentId =
      getPaymentIntentId(
        session
      );

    return prisma.$transaction(
      async (tx) => {
        const order =
          await tx.order.findUnique({
            where: {
              id:
                orderId,
            },

            select: {
              id: true,
              status: true,
              stripeCheckoutSessionId:
                true,
            },
          });

        if (!order) {
          console.error(
            '[STRIPE_WEBHOOK_ORDER_NOT_FOUND]',
            {
              event:
                'checkout.session.completed',
              orderId,
              stripeCheckoutSessionId:
                stripeSessionId,
            }
          );

          return {
            processed: false,
            reason:
              'order_not_found',
          };
        }

        if (
          order
            .stripeCheckoutSessionId &&
          stripeSessionId &&
          order
            .stripeCheckoutSessionId !==
            stripeSessionId
        ) {
          console.error(
            '[STRIPE_WEBHOOK_SESSION_MISMATCH]',
            {
              event:
                'checkout.session.completed',
              orderId,
              expectedSessionId:
                order
                  .stripeCheckoutSessionId,
              receivedSessionId:
                stripeSessionId,
            }
          );

          return {
            processed: false,
            reason:
              'session_mismatch',
          };
        }

        if (
          order.status ===
          'PAID'
        ) {
          return {
            processed: false,
            reason:
              'already_paid',
          };
        }

        if (
          order.status !==
          'PENDING'
        ) {
          return {
            processed: false,
            reason:
              'invalid_order_state',
          };
        }

        const updateData = {
          status:
            'PAID',
        };

        if (stripeSessionId) {
          updateData
            .stripeCheckoutSessionId =
            stripeSessionId;
        }

        if (paymentIntentId) {
          updateData
            .stripePaymentIntentId =
            paymentIntentId;
        }

        const updated =
          await tx.order.updateMany({
            where: {
              id:
                orderId,

              status:
                'PENDING',
            },

            data:
              updateData,
          });

        if (
          updated.count !==
          1
        ) {
          return {
            processed: false,
            reason:
              'state_changed',
          };
        }

        return {
          processed: true,
          orderId,
          status:
            'PAID',
        };
      }
    );
  };

const handleCheckoutExpired =
  async (
    session
  ) => {
    const orderId =
      getOrderIdFromSession(
        session
      );

    if (!orderId) {
      console.error(
        '[STRIPE_WEBHOOK_INVALID_ORDER]',
        {
          event:
            'checkout.session.expired',

          stripeCheckoutSessionId:
            session?.id ?? null,
        }
      );

      return {
        processed: false,
        reason:
          'invalid_order_id',
      };
    }

    const stripeSessionId =
      typeof session?.id ===
      'string'
        ? session.id
        : null;

    return prisma.$transaction(
      async (tx) => {
        const order =
          await tx.order.findUnique({
            where: {
              id:
                orderId,
            },

            include: {
              items: true,
            },
          });

        if (!order) {
          return {
            processed: false,
            reason:
              'order_not_found',
          };
        }

        if (
          order
            .stripeCheckoutSessionId &&
          stripeSessionId &&
          order
            .stripeCheckoutSessionId !==
            stripeSessionId
        ) {
          return {
            processed: false,
            reason:
              'session_mismatch',
          };
        }

        if (
          order.status ===
          'CANCELLED'
        ) {
          return {
            processed: false,
            reason:
              'already_cancelled',
          };
        }

        if (
          order.status !==
          'PENDING'
        ) {
          return {
            processed: false,
            reason:
              'invalid_order_state',
          };
        }

        const cancelled =
          await tx.order.updateMany({
            where: {
              id:
                orderId,

              status:
                'PENDING',
            },

            data: {
              status:
                'CANCELLED',

              ...(stripeSessionId
                ? {
                    stripeCheckoutSessionId:
                      stripeSessionId,
                  }
                : {}),
            },
          });

        if (
          cancelled.count !==
          1
        ) {
          return {
            processed: false,
            reason:
              'state_changed',
          };
        }

        for (
          const item of
          order.items
        ) {
          if (
            item.productId ===
            null
          ) {
            continue;
          }

          await tx.product.update({
            where: {
              id:
                item.productId,
            },

            data: {
              stock: {
                increment:
                  item.quantity,
              },
            },
          });
        }

        return {
          processed: true,
          orderId,
          status:
            'CANCELLED',
        };
      }
    );
  };

const processStripeEvent =
  async (
    event
  ) => {
    switch (event.type) {
      case 'checkout.session.completed':
        return handleCheckoutCompleted(
          event.data.object
        );

      case 'checkout.session.expired':
        return handleCheckoutExpired(
          event.data.object
        );

      default:
        return {
          processed: false,
          reason:
            'event_not_handled',
        };
    }
  };

const getCheckoutOrder =
  async ({
    sessionId,
    userId,
  }) => {
    if (
      typeof sessionId !==
        'string' ||
      !sessionId.trim()
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Invalid checkout session'
      );
    }

    const cleanUserId =
      Number(userId);

    if (
      !Number.isInteger(
        cleanUserId
      ) ||
      cleanUserId <= 0
    ) {
      throw new AppError(
        ErrorSelector.UNAUTHORIZED,
        'Unauthorized'
      );
    }

    /*
     * Buscamos por sessionId + userId en la
     * misma consulta.
     *
     * Así nunca devolvemos un pedido de otro
     * usuario aunque alguien conozca un cs_...
     */
    const order =
      await prisma.order.findFirst({
        where: {
          stripeCheckoutSessionId:
            sessionId.trim(),

          userId:
            cleanUserId,
        },

        select: {
          id: true,
          status: true,
          total: true,
          createdAt: true,
          stripeCheckoutSessionId:
            true,
          stripePaymentIntentId:
            true,

          items: {
            select: {
              id: true,
              productId: true,
              quantity: true,
              productName: true,
              productImage: true,
              priceAtPurchase:
                true,
            },

            orderBy: {
              id: 'asc',
            },
          },
        },
      });

    if (!order) {
      throw new AppError(
        ErrorSelector.NOT_FOUND,
        'Checkout order not found'
      );
    }

    return order;
  };

export const paymentService = {
  processStripeEvent,
  getCheckoutOrder,
};