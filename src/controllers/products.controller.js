import { Prisma } from '@prisma/client';

import { productsService } from '../services/products.service.js';
import { cloudinaryService } from '../services/cloudinary.service.js';
import { restockAlertsService } from '../services/restockAlerts.service.js';

import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';
import { sendSuccess } from '../utils/responses.js';

const ALLOWED_SORT_FIELDS = [
  'createdAt',
  'price',
  'name',
  'availability',
];

const ALLOWED_SORT_ORDERS = [
  'asc',
  'desc',
];

const ALLOWED_AVAILABILITY_FILTERS = [
  'inStock',
  'outOfStock',
];

const ALLOWED_ADMIN_STATUSES = [
  'active',
  'inactive',
];

const ALLOWED_ADMIN_STOCK_FILTERS = [
  'inStock',
  'lowStock',
  'outOfStock',
];

const MAX_PRICE =
  new Prisma.Decimal(
    '99999999.99'
  );

const parsePositiveInteger = (
  value,
  defaultValue,
  {
    min = 1,
    max = Number.MAX_SAFE_INTEGER,
  } = {}
) => {
  if (value === undefined) {
    return defaultValue;
  }

  const parsedValue =
    Number(value);

  if (
    !Number.isInteger(parsedValue) ||
    parsedValue < min ||
    parsedValue > max
  ) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Invalid integer value'
    );
  }

  return parsedValue;
};

const parseProductId = (
  value
) =>
  parsePositiveInteger(
    value,
    undefined
  );

const parseStock = (
  value
) => {
  const stock =
    Number(value);

  if (
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Stock must be a non-negative integer'
    );
  }

  return stock;
};

const parsePrice = (
  value
) => {
  if (
    typeof value !== 'string' &&
    typeof value !== 'number'
  ) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Price is required'
    );
  }

  const normalizedValue =
    String(value).trim();

  if (
    !/^\d+(?:\.\d{1,2})?$/.test(
      normalizedValue
    )
  ) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Price must be a valid amount with at most two decimal places'
    );
  }

  const price =
    new Prisma.Decimal(
      normalizedValue
    );

  if (
    price.isNegative() ||
    price.gt(MAX_PRICE)
  ) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Price is outside the allowed range'
    );
  }

  return price;
};

const parseOptionalPrice = (
  value
) => {
  if (
    value === undefined ||
    value === null ||
    value === ''
  ) {
    return undefined;
  }

  return parsePrice(value);
};

const normalizeOptionalString = (
  value,
  maxLength
) => {
  if (
    value === undefined ||
    value === null
  ) {
    return undefined;
  }

  if (
    typeof value !== 'string'
  ) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Invalid text value'
    );
  }

  const normalized =
    value.trim();

  if (
    normalized.length >
    maxLength
  ) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Text value is too long'
    );
  }

  return normalized;
};

const normalizeImages = (
  images
) => {
  if (
    images === undefined ||
    images === null ||
    images === ''
  ) {
    return [];
  }

  const normalized =
    typeof images === 'string'
      ? [images]
      : images;

  if (
    !Array.isArray(normalized)
  ) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Images must be an array'
    );
  }

  return normalized
    .filter(
      (image) =>
        typeof image === 'string'
    )
    .map(
      (image) =>
        image.trim()
    )
    .filter(Boolean);
};

const validateCreatePayload = (
  body
) => {
  const {
    name,
    price,
    stock,
    category,
    description,
  } = body;

  if (
    typeof name !== 'string' ||
    !name.trim()
  ) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Product name is required'
    );
  }

  const normalizedName =
    name.trim();

  if (
    normalizedName.length >
    150
  ) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Product name is too long'
    );
  }

  return {
    name:
      normalizedName,

    price:
      parsePrice(price),

    stock:
      parseStock(stock),

    category:
      normalizeOptionalString(
        category,
        50
      ) ?? null,

    description:
      normalizeOptionalString(
        description,
        5000
      ) ?? null,
  };
};

const uploadProductImages = async (
  files = []
) => {
  if (!files.length) {
    return [];
  }

  const uploads =
    await Promise.all(
      files.map(
        (file) =>
          cloudinaryService.uploadImage(
            file
          )
      )
    );

  return uploads.map(
    (result) =>
      result.secure_url
  );
};

const getProducts = async (
  req,
  res,
  next
) => {
  try {
    const page =
      parsePositiveInteger(
        req.query.page,
        1
      );

    const limit =
      parsePositiveInteger(
        req.query.limit,
        12,
        {
          min: 1,
          max: 100,
        }
      );

    const category =
      typeof req.query.category ===
      'string'
        ? req.query.category.trim()
        : '';

    const search =
      typeof req.query.search ===
      'string'
        ? req.query.search.trim()
        : '';

    const availability =
      typeof req.query.availability ===
      'string'
        ? req.query.availability.trim()
        : '';

    const minPrice =
      parseOptionalPrice(
        req.query.minPrice
      );

    const maxPrice =
      parseOptionalPrice(
        req.query.maxPrice
      );

    const sortBy =
      typeof req.query.sortBy ===
      'string'
        ? req.query.sortBy.trim()
        : 'createdAt';

    const order =
      typeof req.query.order ===
      'string'
        ? req.query.order
            .trim()
            .toLowerCase()
        : 'desc';

    if (
      category.length > 50 ||
      search.length > 100
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Invalid search parameters'
      );
    }

    if (
      availability &&
      !ALLOWED_AVAILABILITY_FILTERS.includes(
        availability
      )
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Invalid availability filter'
      );
    }

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice.gt(maxPrice)
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Minimum price cannot be greater than maximum price'
      );
    }

    if (
      !ALLOWED_SORT_FIELDS.includes(
        sortBy
      ) ||
      !ALLOWED_SORT_ORDERS.includes(
        order
      )
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Invalid sorting parameters'
      );
    }

    const result =
      await productsService.getProducts({
        page,
        limit,
        category,
        search,
        minPrice,
        maxPrice,
        availability,
        sortBy,
        order,
      });

    return sendSuccess(res, {
      data:
        result.products,
      meta:
        result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getProductsForAdmin = async (
  req,
  res,
  next
) => {
  try {
    const page =
      parsePositiveInteger(
        req.query.page,
        1
      );

    const limit =
      parsePositiveInteger(
        req.query.limit,
        20,
        {
          min: 1,
          max: 100,
        }
      );

    const search =
      typeof req.query.search ===
      'string'
        ? req.query.search.trim()
        : '';

    const category =
      typeof req.query.category ===
      'string'
        ? req.query.category.trim()
        : '';

    const status =
      typeof req.query.status ===
      'string'
        ? req.query.status.trim()
        : '';

    const stock =
      typeof req.query.stock ===
      'string'
        ? req.query.stock.trim()
        : '';

    if (
      search.length > 100 ||
      category.length > 50
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Invalid search parameters'
      );
    }

    if (
      status &&
      !ALLOWED_ADMIN_STATUSES.includes(
        status
      )
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Invalid product status filter'
      );
    }

    if (
      stock &&
      !ALLOWED_ADMIN_STOCK_FILTERS.includes(
        stock
      )
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Invalid stock filter'
      );
    }

    const result =
      await productsService.getProductsForAdmin({
        page,
        limit,
        search,
        category,
        status,
        stock,
      });

    return sendSuccess(res, {
      data:
        result.products,
      meta:
        result.meta,
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (
  req,
  res,
  next
) => {
  try {
    const id =
      parseProductId(
        req.params.id
      );

    const product =
      await productsService.getProductById(
        id
      );

    if (!product) {
      throw new AppError(
        ErrorSelector.NOT_FOUND
      );
    }

    return sendSuccess(res, {
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const getProductByIdForAdmin = async (
  req,
  res,
  next
) => {
  try {
    const id =
      parseProductId(
        req.params.id
      );

    const product =
      await productsService.getProductByIdForAdmin(
        id
      );

    if (!product) {
      throw new AppError(
        ErrorSelector.NOT_FOUND
      );
    }

    return sendSuccess(res, {
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const getRestockAlert = async (
  req,
  res,
  next
) => {
  try {
    const productId =
      parseProductId(
        req.params.id
      );

    const alert =
      await restockAlertsService.getSubscription({
        userId:
          req.user.userId,
        productId,
      });

    return sendSuccess(res, {
      data: {
        subscribed:
          alert?.status ===
          'PENDING',

        alert:
          alert ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
};

const subscribeRestockAlert =
  async (
    req,
    res,
    next
  ) => {
    try {
      const productId =
        parseProductId(
          req.params.id
        );

      const alert =
        await restockAlertsService.subscribe({
          userId:
            req.user.userId,
          productId,
        });

      return sendSuccess(res, {
        statusCode: 201,

        data: {
          subscribed: true,
          alert,
        },

        message:
          'Restock alert activated',
      });
    } catch (error) {
      next(error);
    }
  };

const cancelRestockAlert =
  async (
    req,
    res,
    next
  ) => {
    try {
      const productId =
        parseProductId(
          req.params.id
        );

      const alert =
        await restockAlertsService.cancel({
          userId:
            req.user.userId,
          productId,
        });

      return sendSuccess(res, {
        data: {
          subscribed: false,
          alert,
        },

        message:
          'Restock alert cancelled',
      });
    } catch (error) {
      next(error);
    }
  };

const createProduct = async (
  req,
  res,
  next
) => {
  try {
    const payload =
      validateCreatePayload(
        req.body
      );

    const images =
      normalizeImages(
        req.body.images
      );

    const uploadedImages =
      await uploadProductImages(
        req.files
      );

    const product =
      await productsService.createProduct({
        ...payload,
        images: [
          ...images,
          ...uploadedImages,
        ],
      });

    return sendSuccess(res, {
      statusCode: 201,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

const updateProduct = async (
  req,
  res,
  next
) => {
  try {
    const id =
      parseProductId(
        req.params.id
      );

    const dataToUpdate =
      {};

    if (
      req.body.name !==
      undefined
    ) {
      if (
        typeof req.body.name !==
          'string' ||
        !req.body.name.trim()
      ) {
        throw new AppError(
          ErrorSelector.BAD_REQUEST,
          'Product name cannot be empty'
        );
      }

      const name =
        req.body.name.trim();

      if (
        name.length > 150
      ) {
        throw new AppError(
          ErrorSelector.BAD_REQUEST,
          'Product name is too long'
        );
      }

      dataToUpdate.name =
        name;
    }

    if (
      req.body.price !==
      undefined
    ) {
      dataToUpdate.price =
        parsePrice(
          req.body.price
        );
    }

    if (
      req.body.stock !==
      undefined
    ) {
      dataToUpdate.stock =
        parseStock(
          req.body.stock
        );
    }

    if (
      req.body.category !==
      undefined
    ) {
      dataToUpdate.category =
        normalizeOptionalString(
          req.body.category,
          50
        ) ?? null;
    }

    if (
      req.body.description !==
      undefined
    ) {
      dataToUpdate.description =
        normalizeOptionalString(
          req.body.description,
          5000
        ) ?? null;
    }

    let images;

    if (
      req.body.images !==
      undefined
    ) {
      images =
        normalizeImages(
          req.body.images
        );
    }

    const uploadedImages =
      await uploadProductImages(
        req.files
      );

    if (
      uploadedImages.length > 0
    ) {
      images = [
        ...(images ?? []),
        ...uploadedImages,
      ];
    }

    const updatedProduct =
      await productsService.updateProduct(
        id,
        {
          ...dataToUpdate,

          ...(images !==
            undefined && {
            images,
          }),
        }
      );

    if (!updatedProduct) {
      throw new AppError(
        ErrorSelector.NOT_FOUND
      );
    }

    return sendSuccess(res, {
      data:
        updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (
  req,
  res,
  next
) => {
  try {
    const id =
      parseProductId(
        req.params.id
      );

    const deletedProduct =
      await productsService.deleteProduct(
        id
      );

    if (!deletedProduct) {
      throw new AppError(
        ErrorSelector.NOT_FOUND
      );
    }

    return sendSuccess(res, {
      data:
        deletedProduct,

      message:
        'Product deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

const restoreProduct = async (
  req,
  res,
  next
) => {
  try {
    const id =
      parseProductId(
        req.params.id
      );

    const restoredProduct =
      await productsService.restoreProduct(
        id
      );

    if (!restoredProduct) {
      throw new AppError(
        ErrorSelector.NOT_FOUND
      );
    }

    return sendSuccess(res, {
      data:
        restoredProduct,

      message:
        'Product restored successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const productsController = {
  getProducts,
  getProductsForAdmin,
  getProductById,
  getProductByIdForAdmin,
  getRestockAlert,
  subscribeRestockAlert,
  cancelRestockAlert,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
};