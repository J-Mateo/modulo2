import { productsService } from '../services/products.service.js';
import { cloudinaryService } from '../services/cloudinary.service.js';
import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

const parsePositiveInteger = (
  value,
  defaultValue,
  { min = 1, max = Number.MAX_SAFE_INTEGER } = {}
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
    throw new AppError(ErrorSelector.BAD_REQUEST);
  }

  return parsedValue;
};

const validateAndSanitizePayload = (body) => {
  const { name, price, stock } = body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new AppError(ErrorSelector.BAD_REQUEST);
  }

  const parsedPrice = Number(price);
  const parsedStock = Number(stock);

  if (
    price === undefined ||
    Number.isNaN(parsedPrice) ||
    parsedPrice < 0
  ) {
    throw new AppError(ErrorSelector.BAD_REQUEST);
  }

  if (
    stock === undefined ||
    Number.isNaN(parsedStock) ||
    parsedStock < 0
  ) {
    throw new AppError(ErrorSelector.BAD_REQUEST);
  }

  return {
    ...body,
    name: name.trim(),
    price: parsedPrice,
    stock: parsedStock,
  };
};

const getProducts = async (req, res, next) => {
  try {
    const page = parsePositiveInteger(req.query.page, 1);

    const limit = parsePositiveInteger(req.query.limit, 12, {
      min: 1,
      max: 100,
    });

    const category =
      typeof req.query.category === 'string'
        ? req.query.category.trim()
        : '';

    const search =
      typeof req.query.search === 'string'
        ? req.query.search.trim()
        : '';

    if (category.length > 50 || search.length > 100) {
      throw new AppError(ErrorSelector.BAD_REQUEST);
    }

    const result = await productsService.getProducts({
      page,
      limit,
      category,
      search,
    });

    return res.status(200).json({
      success: true,
      data: result.products,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError(ErrorSelector.BAD_REQUEST);
    }

    const product = await productsService.getProductById(id);

    if (!product) {
      throw new AppError(ErrorSelector.NOT_FOUND);
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const sanitizedBody = validateAndSanitizePayload(req.body);

    let images = sanitizedBody.images || [];

    if (typeof images === 'string') {
      images = [images];
    }

    if (!Array.isArray(images)) {
      throw new AppError(ErrorSelector.BAD_REQUEST);
    }

    if (req.file) {
      const result = await cloudinaryService.uploadImage(req.file);
      images.push(result.secure_url);
    }

    const product = await productsService.createProduct({
      ...sanitizedBody,
      images,
    });

    return res.status(201).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError(ErrorSelector.BAD_REQUEST);
    }

    const dataToUpdate = { ...req.body };

    if (dataToUpdate.name !== undefined) {
      if (
        typeof dataToUpdate.name !== 'string' ||
        dataToUpdate.name.trim() === ''
      ) {
        throw new AppError(ErrorSelector.BAD_REQUEST);
      }

      dataToUpdate.name = dataToUpdate.name.trim();
    }

    if (dataToUpdate.price !== undefined) {
      dataToUpdate.price = Number(dataToUpdate.price);
    }

    if (dataToUpdate.stock !== undefined) {
      dataToUpdate.stock = Number(dataToUpdate.stock);
    }

    if (
      (dataToUpdate.price !== undefined &&
        (Number.isNaN(dataToUpdate.price) || dataToUpdate.price < 0)) ||
      (dataToUpdate.stock !== undefined &&
        (Number.isNaN(dataToUpdate.stock) || dataToUpdate.stock < 0))
    ) {
      throw new AppError(ErrorSelector.BAD_REQUEST);
    }

    let images = dataToUpdate.images;

    if (typeof images === 'string') {
      images = [images];
    }

    if (images !== undefined && !Array.isArray(images)) {
      throw new AppError(ErrorSelector.BAD_REQUEST);
    }

    if (req.file) {
      const result = await cloudinaryService.uploadImage(req.file);

      images = images
        ? [...images, result.secure_url]
        : [result.secure_url];
    }

    const updatedProduct = await productsService.updateProduct(id, {
      ...dataToUpdate,
      ...(images !== undefined && { images }),
    });

    if (!updatedProduct) {
      throw new AppError(ErrorSelector.NOT_FOUND);
    }

    return res.status(200).json({
      success: true,
      data: updatedProduct,
    });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      throw new AppError(ErrorSelector.BAD_REQUEST);
    }

    const deletedProduct = await productsService.deleteProduct(id);

    if (!deletedProduct) {
      throw new AppError(ErrorSelector.NOT_FOUND);
    }

    return res.status(200).json({
      success: true,
      data: deletedProduct,
    });
  } catch (err) {
    next(err);
  }
};

export const productsController = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};