import prisma from '../config/prismaClient.js';

const buildPublicWhere = ({
  category = '',
  search = '',
} = {}) => {
  const where = {
    isActive: true,
  };

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

  return where;
};

const getProducts = async ({
  page = 1,
  limit = 12,
  category = '',
  search = '',
} = {}) => {
  const where = buildPublicWhere({
    category,
    search,
  });

  const skip = (page - 1) * limit;

  const [products, total] =
    await prisma.$transaction([
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
      totalPages:
        total === 0
          ? 0
          : Math.ceil(total / limit),
    },
  };
};

const getProductById = async (id) => {
  return prisma.product.findFirst({
    where: {
      id: Number(id),
      isActive: true,
    },
  });
};

const getProductByIdForAdmin = async (id) => {
  return prisma.product.findUnique({
    where: {
      id: Number(id),
    },
  });
};

const getProductsForAdmin = async ({
  page = 1,
  limit = 20,
  search = '',
} = {}) => {
  const where = {};

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

  const [products, total] =
    await prisma.$transaction([
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
      totalPages:
        total === 0
          ? 0
          : Math.ceil(total / limit),
    },
  };
};

const createProduct = async (data) => {
  return prisma.product.create({
    data: {
      name: data.name,
      category: data.category || null,
      description: data.description || null,
      price: data.price,
      stock: Number(data.stock),
      images: Array.isArray(data.images)
        ? data.images
        : [],
      isActive: true,
    },
  });
};

const updateProduct = async (id, data) => {
  const productId = Number(id);

  const existingProduct =
    await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
      },
    });

  if (!existingProduct) {
    return null;
  }

  const updateData = {};

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.category !== undefined) {
    updateData.category =
      data.category || null;
  }

  if (data.description !== undefined) {
    updateData.description =
      data.description || null;
  }

  if (data.price !== undefined) {
    updateData.price = data.price;
  }

  if (data.stock !== undefined) {
    updateData.stock = Number(data.stock);
  }

  if (data.images !== undefined) {
    updateData.images = Array.isArray(
      data.images
    )
      ? data.images
      : [];
  }

  if (data.isActive !== undefined) {
    updateData.isActive =
      Boolean(data.isActive);
  }

  return prisma.product.update({
    where: {
      id: productId,
    },
    data: updateData,
  });
};

const deleteProduct = async (id) => {
  const productId = Number(id);

  const existingProduct =
    await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

  if (!existingProduct) {
    return null;
  }

  if (!existingProduct.isActive) {
    return prisma.product.findUnique({
      where: {
        id: productId,
      },
    });
  }

  return prisma.product.update({
    where: {
      id: productId,
    },
    data: {
      isActive: false,
    },
  });
};

const restoreProduct = async (id) => {
  const productId = Number(id);

  const existingProduct =
    await prisma.product.findUnique({
      where: {
        id: productId,
      },
      select: {
        id: true,
      },
    });

  if (!existingProduct) {
    return null;
  }

  return prisma.product.update({
    where: {
      id: productId,
    },
    data: {
      isActive: true,
    },
  });
};

export const productsService = {
  getProducts,
  getProductById,
  getProductsForAdmin,
  getProductByIdForAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
};