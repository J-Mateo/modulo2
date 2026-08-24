import prisma from '../config/prismaClient.js';

const getProducts = (filters = {}) => {
  const where = {};

  // Solo filtramos si 'category' existe y NO es un texto vacío ""
  if (filters.category && filters.category.trim() !== '') {
    where.category = filters.category;
  }

  return prisma.product.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const getProductById = (id) => {
  return prisma.product.findUnique({
    where: { id: Number(id) },
  });
};

const createProduct = (data) => {
  return prisma.product.create({
    data: {
      name: data.name,
      category: data.category,
      description: data.description,
      price: Number(data.price),
      stock: Number(data.stock),
      images: data.images || [], // <--- Cambiado de imageUrl a images
    },
  });
};

const updateProduct = (id, data) => {
  return prisma.product.update({
    where: { id: Number(id) },
    data: {
      ...data,
      price: data.price !== undefined ? Number(data.price) : undefined,
      stock: data.stock !== undefined ? Number(data.stock) : undefined,
      images: data.images !== undefined ? data.images : undefined, // <--- Cambiado a images
    },
  });
};

const deleteProduct = (id) => {
  return prisma.product.delete({
    where: { id: Number(id) },
  });
};

export const productsService = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};