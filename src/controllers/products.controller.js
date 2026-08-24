import { productsService } from '../services/products.service.js';
import { cloudinaryService } from '../services/cloudinary.service.js';
import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

const validateAndSanitizePayload = (body) => {
  const { name, price, stock } = body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new AppError(ErrorSelector.BAD_REQUEST);
  }

  const parsedPrice = Number(price);
  const parsedStock = Number(stock);

  if (price === undefined || Number.isNaN(parsedPrice) || parsedPrice < 0) {
    throw new AppError(ErrorSelector.BAD_REQUEST);
  }

  if (stock === undefined || Number.isNaN(parsedStock) || parsedStock < 0) {
    throw new AppError(ErrorSelector.BAD_REQUEST);
  }

  return {
    ...body,
    price: parsedPrice,
    stock: parsedStock,
  };
};

const getProducts = async (req, res, next) => {
  try {
    const { category } = req.query;

    const products = await productsService.getProducts({
      category,
    });

    return res.json({
      success: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError(ErrorSelector.BAD_REQUEST);

    const product = await productsService.getProductById(id);
    if (!product) throw new AppError(ErrorSelector.NOT_FOUND);

    return res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const sanitizedBody = validateAndSanitizePayload(req.body);

    // Si viene un array de imágenes en el body o una única URL, lo normalizamos
    let images = sanitizedBody.images || [];
    if (typeof images === 'string') images = [images];

    if (req.file) {
      const result = await cloudinaryService.uploadImage(req.file);
      images.push(result.secure_url);
    }

    const product = await productsService.createProduct({
      ...sanitizedBody,
      images,
    });

    return res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError(ErrorSelector.BAD_REQUEST);

    const dataToUpdate = { ...req.body };
    if (dataToUpdate.price !== undefined) dataToUpdate.price = Number(dataToUpdate.price);
    if (dataToUpdate.stock !== undefined) dataToUpdate.stock = Number(dataToUpdate.stock);

    if (
      (dataToUpdate.price !== undefined && (Number.isNaN(dataToUpdate.price) || dataToUpdate.price < 0)) ||
      (dataToUpdate.stock !== undefined && (Number.isNaN(dataToUpdate.stock) || dataToUpdate.stock < 0))
    ) {
      throw new AppError(ErrorSelector.BAD_REQUEST);
    }

    let images = dataToUpdate.images;
    if (typeof images === 'string') images = [images];

    if (req.file) {
      const result = await cloudinaryService.uploadImage(req.file);
      images = images ? [...images, result.secure_url] : [result.secure_url];
    }

    const updatedProduct = await productsService.updateProduct(id, {
      ...dataToUpdate,
      ...(images && { images }),
    });

    if (!updatedProduct) throw new AppError(ErrorSelector.NOT_FOUND);

    return res.json({ success: true, data: updatedProduct });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError(ErrorSelector.BAD_REQUEST);

    const deletedProduct = await productsService.deleteProduct(id);
    if (!deletedProduct) throw new AppError(ErrorSelector.NOT_FOUND);

    return res.json({ success: true, data: deletedProduct });
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