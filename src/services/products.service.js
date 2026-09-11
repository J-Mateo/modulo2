import prisma from '../config/prismaClient.js';

import { restockAlertsService } from './restockAlerts.service.js';

const findAccentInsensitiveProductIds =
  async ({
    search,
    onlyActive = false,
  }) => {
    const normalizedSearch =
      search.trim();

    if (!normalizedSearch) {
      return null;
    }

    const pattern =
      `%${normalizedSearch}%`;

    const matches = onlyActive
      ? await prisma.$queryRaw`
          SELECT "id"
          FROM "Product"
          WHERE "isActive" = true
            AND (
              unaccent(COALESCE("name", ''))
                ILIKE unaccent(${pattern})
              OR
              unaccent(COALESCE("description", ''))
                ILIKE unaccent(${pattern})
            )
        `
      : await prisma.$queryRaw`
          SELECT "id"
          FROM "Product"
          WHERE
            unaccent(COALESCE("name", ''))
              ILIKE unaccent(${pattern})
            OR
            unaccent(COALESCE("description", ''))
              ILIKE unaccent(${pattern})
        `;

    return matches.map(
      (product) => product.id
    );
  };

const buildPublicWhere = ({
  category = '',
  productIds = null,
  minPrice,
  maxPrice,
  availability = '',
} = {}) => {
  const where = {
    isActive: true,
  };

  if (category) {
    where.category = category;
  }

  if (productIds !== null) {
    where.id = {
      in: productIds,
    };
  }

  if (
    minPrice !== undefined ||
    maxPrice !== undefined
  ) {
    where.price = {};

    if (minPrice !== undefined) {
      where.price.gte =
        minPrice;
    }

    if (maxPrice !== undefined) {
      where.price.lte =
        maxPrice;
    }
  }

  if (
    availability ===
    'inStock'
  ) {
    where.stock = {
      gt: 0,
    };
  }

  if (
    availability ===
    'outOfStock'
  ) {
    where.stock = 0;
  }

  return where;
};

const buildPublicOrderBy = ({
  sortBy = 'createdAt',
  order = 'desc',
} = {}) => {
  if (
    sortBy ===
    'availability'
  ) {
    return [
      {
        stock:
          'desc',
      },
      {
        id:
          'asc',
      },
    ];
  }

  return [
    {
      [sortBy]:
        order,
    },
    {
      id:
        'asc',
    },
  ];
};

const getProducts = async ({
  page = 1,
  limit = 12,
  category = '',
  search = '',
  minPrice,
  maxPrice,
  availability = '',
  sortBy = 'createdAt',
  order = 'desc',
} = {}) => {
  const productIds =
    search
      ? await findAccentInsensitiveProductIds({
          search,
          onlyActive: true,
        })
      : null;

  const where =
    buildPublicWhere({
      category,
      productIds,
      minPrice,
      maxPrice,
      availability,
    });

  const orderBy =
    buildPublicOrderBy({
      sortBy,
      order,
    });

  const skip =
    (page - 1) *
    limit;

  const [
    products,
    total,
  ] =
    await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take:
          limit,
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
          : Math.ceil(
              total /
                limit
            ),
    },
  };
};

const getProductById =
  async (id) => {
    return prisma.product.findFirst({
      where: {
        id:
          Number(id),
        isActive:
          true,
      },
    });
  };

const getProductByIdForAdmin =
  async (id) => {
    return prisma.product.findUnique({
      where: {
        id:
          Number(id),
      },
    });
  };

const buildAdminWhere = ({
  productIds = null,
  category = '',
  status = '',
  stock = '',
} = {}) => {
  const where = {};

  if (productIds !== null) {
    where.id = {
      in: productIds,
    };
  }

  if (category) {
    where.category =
      category;
  }

  if (
    status ===
    'active'
  ) {
    where.isActive =
      true;
  }

  if (
    status ===
    'inactive'
  ) {
    where.isActive =
      false;
  }

  if (
    stock ===
    'inStock'
  ) {
    where.stock = {
      gt: 0,
    };
  }

  if (
    stock ===
    'lowStock'
  ) {
    where.stock = {
      gt: 0,
      lte: 5,
    };
  }

  if (
    stock ===
    'outOfStock'
  ) {
    where.stock =
      0;
  }

  return where;
};

const getProductsForAdmin =
  async ({
    page = 1,
    limit = 20,
    search = '',
    category = '',
    status = '',
    stock = '',
  } = {}) => {
    const productIds =
      search
        ? await findAccentInsensitiveProductIds({
            search,
          })
        : null;

    const where =
      buildAdminWhere({
        productIds,
        category,
        status,
        stock,
      });

    const skip =
      (page - 1) *
      limit;

    const [
      products,
      total,
    ] =
      await prisma.$transaction([
        prisma.product.findMany({
          where,

          orderBy: {
            createdAt:
              'desc',
          },

          skip,
          take:
            limit,
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
            : Math.ceil(
                total /
                  limit
              ),
      },
    };
  };

const createProduct =
  async (data) => {
    return prisma.product.create({
      data: {
        name:
          data.name,

        category:
          data.category ||
          null,

        description:
          data.description ||
          null,

        price:
          data.price,

        stock:
          Number(
            data.stock
          ),

        images:
          Array.isArray(
            data.images
          )
            ? data.images
            : [],

        isActive:
          true,
      },
    });
  };

const updateProduct =
  async (
    id,
    data
  ) => {
    const productId =
      Number(id);

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id:
            productId,
        },

        select: {
          id:
            true,
          stock:
            true,
          isActive:
            true,
        },
      });

    if (!existingProduct) {
      return null;
    }

    const updateData =
      {};

    if (
      data.name !==
      undefined
    ) {
      updateData.name =
        data.name;
    }

    if (
      data.category !==
      undefined
    ) {
      updateData.category =
        data.category ||
        null;
    }

    if (
      data.description !==
      undefined
    ) {
      updateData.description =
        data.description ||
        null;
    }

    if (
      data.price !==
      undefined
    ) {
      updateData.price =
        data.price;
    }

    if (
      data.stock !==
      undefined
    ) {
      updateData.stock =
        Number(
          data.stock
        );
    }

    if (
      data.images !==
      undefined
    ) {
      updateData.images =
        Array.isArray(
          data.images
        )
          ? data.images
          : [];
    }

    if (
      data.isActive !==
      undefined
    ) {
      updateData.isActive =
        Boolean(
          data.isActive
        );
    }

    const updatedProduct =
      await prisma.product.update({
        where: {
          id:
            productId,
        },

        data:
          updateData,
      });

    const wasOutOfStock =
      existingProduct.stock <=
      0;

    const isNowAvailable =
      updatedProduct.stock >
      0;

    const stockWasUpdated =
      data.stock !==
      undefined;

    const shouldNotify =
      stockWasUpdated &&
      wasOutOfStock &&
      isNowAvailable &&
      updatedProduct.isActive;

    if (shouldNotify) {
      try {
        const result =
          await restockAlertsService
            .notifyPendingAlerts(
              updatedProduct
            );

        if (
          result.notified >
            0 ||
          result.failed >
            0
        ) {
          console.log(
            `Restock notifications for product ${updatedProduct.id}: ${result.notified} sent, ${result.failed} failed`
          );
        }
      } catch (error) {
        console.error(
          'Restock notification error:',
          error?.message ||
            error
        );
      }
    }

    return updatedProduct;
  };

const deleteProduct =
  async (id) => {
    const productId =
      Number(id);

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id:
            productId,
        },

        select: {
          id:
            true,
          isActive:
            true,
        },
      });

    if (!existingProduct) {
      return null;
    }

    if (
      !existingProduct.isActive
    ) {
      return prisma.product.findUnique({
        where: {
          id:
            productId,
        },
      });
    }

    return prisma.product.update({
      where: {
        id:
          productId,
      },

      data: {
        isActive:
          false,
      },
    });
  };

const restoreProduct =
  async (id) => {
    const productId =
      Number(id);

    const existingProduct =
      await prisma.product.findUnique({
        where: {
          id:
            productId,
        },

        select: {
          id:
            true,
        },
      });

    if (!existingProduct) {
      return null;
    }

    return prisma.product.update({
      where: {
        id:
          productId,
      },

      data: {
        isActive:
          true,
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