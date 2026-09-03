import { Prisma } from '@prisma/client';

import { productsService } from '../services/products.service.js';
import { cloudinaryService } from '../services/cloudinary.service.js';

import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';
import { sendSuccess } from '../utils/responses.js';

const MAX_PRICE = new Prisma.Decimal(
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

  const parsedValue = Number(value);

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

const parseProductId = (value) =>
  parsePositiveInteger(
    value,
    undefined
  );

const parseStock = (value) => {
  const stock = Number(value);

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

const parsePrice = (value) => {
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

  /*
   * Contrato monetario:
   *
   * 10
   * 10.5
   * 10.50
   *
   * son válidos.
   *
   * Rechazamos:
   * 10.999
   * -2
   * NaN
   * Infinity
   * notación científica
   */
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

  if (typeof value !== 'string') {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Invalid text value'
    );
  }

  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Text value is too long'
    );
  }

  return normalized;
};

const normalizeImages = (images) => {
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

  if (!Array.isArray(normalized)) {
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
    .map((image) => image.trim())
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

  if (normalizedName.length > 150) {
    throw new AppError(
      ErrorSelector.BAD_REQUEST,
      'Product name is too long'
    );
  }

  return {
    name: normalizedName,
    price: parsePrice(price),
    stock: parseStock(stock),

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

    if (
      category.length > 50 ||
      search.length > 100
    ) {
      throw new AppError(
        ErrorSelector.BAD_REQUEST,
        'Invalid search parameters'
      );
    }

    const result =
      await productsService.getProducts({
        page,
        limit,
        category,
        search,
      });

    return sendSuccess(res, {
      data: result.products,
      meta: result.meta,
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
    const id = parseProductId(
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

    if (req.file) {
      const uploadResult =
        await cloudinaryService.uploadImage(
          req.file
        );

      images.push(
        uploadResult.secure_url
      );
    }

    const product =
      await productsService.createProduct({
        ...payload,
        images,
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
    const id = parseProductId(
      req.params.id
    );

    const dataToUpdate = {};

    if (
      req.body.name !== undefined
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

      if (name.length > 150) {
        throw new AppError(
          ErrorSelector.BAD_REQUEST,
          'Product name is too long'
        );
      }

      dataToUpdate.name = name;
    }

    if (
      req.body.price !== undefined
    ) {
      dataToUpdate.price =
        parsePrice(
          req.body.price
        );
    }

    if (
      req.body.stock !== undefined
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
      req.body.images !== undefined
    ) {
      images =
        normalizeImages(
          req.body.images
        );
    }

    if (req.file) {
      const uploadResult =
        await cloudinaryService.uploadImage(
          req.file
        );

      images = [
        ...(images ?? []),
        uploadResult.secure_url,
      ];
    }

    const updatedProduct =
      await productsService.updateProduct(
        id,
        {
          ...dataToUpdate,

          ...(images !== undefined && {
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
      data: updatedProduct,
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
    const id = parseProductId(
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
      data: deletedProduct,
      message:
        'Product deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const productsController = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};