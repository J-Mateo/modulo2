import prisma from '../config/prismaClient.js';

const getProducts = () => {
  return prisma.product.findMany();
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
      description: data.description,
      price: Number(data.price),
      stock: Number(data.stock),
      imageUrl: data.imageUrl,
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

