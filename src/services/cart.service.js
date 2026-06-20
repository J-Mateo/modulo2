import prisma from '../config/prismaClient.js';
import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

const cartInclude = {
  items: {
    include: {
      product: true,
    },
  },
};

const getOrCreateActiveCart = async (userId) => {
  let cart = await prisma.cart.findFirst({
    where: { userId, status: 'ACTIVE' },
    include: cartInclude,
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
      include: cartInclude,
    });
  }

  return cart;
};

const addItemToCart = async ({ userId, productId, quantity }) => {
  const cleanProductId = Number(productId);
  const cleanQuantity = Number(quantity);

  if (
    Number.isNaN(cleanProductId) ||
    Number.isNaN(cleanQuantity) ||
    cleanQuantity <= 0
  ) {
    throw new AppError(ErrorSelector.BAD_REQUEST);
  }

  const product = await prisma.product.findUnique({
    where: { id: cleanProductId },
    select: { id: true, stock: true },
  });

  if (!product) {
    throw new AppError(ErrorSelector.NOT_FOUND);
  }

  const cart = await getOrCreateActiveCart(userId);

  const existingItem = cart.items.find(
    (item) => item.productId === cleanProductId
  );

  const currentQuantity = existingItem ? existingItem.quantity : 0;
  const newQuantity = currentQuantity + cleanQuantity;

  if (
    product.stock !== null &&
    product.stock !== undefined &&
    newQuantity > product.stock
  ) {
    throw new AppError(ErrorSelector.BAD_REQUEST, 'Insufficient stock');
  }

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: cleanProductId,
        quantity: cleanQuantity,
      },
    });
  }

  return getOrCreateActiveCart(userId);
};

const removeItemFromCart = async ({ userId, itemId }) => {
  const cleanItemId = Number(itemId);

  if (Number.isNaN(cleanItemId)) {
    throw new AppError(ErrorSelector.BAD_REQUEST);
  }

  const cart = await getOrCreateActiveCart(userId);

  const item = await prisma.cartItem.findUnique({
    where: { id: cleanItemId },
    select: { cartId: true },
  });

  if (!item || item.cartId !== cart.id) {
    throw new AppError(ErrorSelector.NOT_FOUND);
  }

  await prisma.cartItem.delete({
    where: { id: cleanItemId },
  });

  return getOrCreateActiveCart(userId);
};

const checkout = async (userId) => {
  const cart = await getOrCreateActiveCart(userId);

  if (cart.items.length === 0) {
    throw new AppError(ErrorSelector.BAD_REQUEST);
  }

  for (const item of cart.items) {
    if (
      item.product.stock !== null &&
      item.product.stock !== undefined &&
      item.quantity > item.product.stock
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        `Product ${item.product.name || item.productId} has insufficient stock`
      );
    }
  }

  const total = cart.items.reduce((sum, item) => {
    return sum + item.product.price * item.quantity;
  }, 0);

  const stockUpdates = cart.items.map((item) => {
    return prisma.product.update({
      where: { id: item.productId },
      data: {
        stock: {
          decrement: item.quantity,
        },
      },
    });
  });

  const [order] = await prisma.$transaction([
    prisma.order.create({
      data: {
        userId,
        total,
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: item.product.price,
          })),
        },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    }),

    prisma.cart.update({
      where: { id: cart.id },
      data: { status: 'CHECKED_OUT' },
    }),

    ...stockUpdates,
  ]);

  return order;
};

export const cartService = {
  getOrCreateActiveCart,
  addItemToCart,
  removeItemFromCart,
  checkout,
};