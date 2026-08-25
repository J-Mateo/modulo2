import prisma from '../config/prismaClient.js';

const getProducts = async ({
  page = 1,
  limit = 12,
  category = '',
  search = '',
} = {}) => {
  const where = {};

  if (category) {
    where.category = category;
  }

  if (search) {
    where.OR = [
      {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }

  const skip = (page - 1) * limit;

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.product.count({
      where,
    }),
  ]);

  return {
    products,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getProductById = async (id) => {
  return prisma.product.findUnique({
    where: {
      id: Number(id),
    },
  });
};

const createProduct = async (data) => {
  return prisma.product.create({
    data: {
      name: data.name,
      category: data.category || null,
      description: data.description || null,
      price: Number(data.price),
      stock: Number(data.stock),
      images: Array.isArray(data.images) ? data.images : [],
    },
  });
};

const updateProduct = async (id, data) => {
  const updateData = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.category !== undefined) {
    updateData.category = data.category || null;
  }

  if (data.description !== undefined) {
    updateData.description = data.description || null;
  }

  if (data.price !== undefined) {
    updateData.price = Number(data.price);
  }

  if (data.stock !== undefined) {
    updateData.stock = Number(data.stock);
  }

  if (data.images !== undefined) {
    updateData.images = Array.isArray(data.images)
      ? data.images
      : [];
  }

  return prisma.product.update({
    where: {
      id: Number(id),
    },
    data: updateData,
  });
};

const deleteProduct = async (id) => {
  return prisma.product.delete({
    where: {
      id: Number(id),
    },
  });
};

export const productsService = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};