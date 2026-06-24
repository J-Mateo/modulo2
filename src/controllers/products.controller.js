import { productsService } from '../services/products.service.js';
import { cloudinaryService } from '../services/cloudinary.service.js';
import { AppError } from '../utils/AppError.js';
import { ErrorSelector } from '../utils/errors.js';

// Convertimos y validamos los tipos que vienen como string desde Multer
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

  // Devolvemos los datos ya tipados correctamente
  return {
    ...body,
    price: parsedPrice,
    stock: parsedStock,
  };
};

const getProducts = async (req, res, next) => {
  try {
    const products = await productsService.getProducts();
    return res.json({ success: true, data: products });
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
    // Sanitizamos el body para asegurar números reales
    const sanitizedBody = validateAndSanitizePayload(req.body);

    let imageUrl = sanitizedBody.imageUrl || null;

    if (req.file) {
      const result = await cloudinaryService.uploadImage(req.file);
      imageUrl = result.secure_url;
    }

    const product = await productsService.createProduct({
      ...sanitizedBody,
      imageUrl,
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

    // En PUT/PATCH los campos pueden ser opcionales, adaptamos el parseo
    const dataToUpdate = { ...req.body };
    if (dataToUpdate.price !== undefined) dataToUpdate.price = Number(dataToUpdate.price);
    if (dataToUpdate.stock !== undefined) dataToUpdate.stock = Number(dataToUpdate.stock);

    // Validación básica si se envían para actualización
    if (
      (dataToUpdate.price !== undefined && (Number.isNaN(dataToUpdate.price) || dataToUpdate.price < 0)) ||
      (dataToUpdate.stock !== undefined && (Number.isNaN(dataToUpdate.stock) || dataToUpdate.stock < 0))
    ) {
      throw new AppError(ErrorSelector.BAD_REQUEST);
    }

    let imageUrl = dataToUpdate.imageUrl;

    if (req.file) {
      const result = await cloudinaryService.uploadImage(req.file);
      imageUrl = result.secure_url;
    }

    const updatedProduct = await productsService.updateProduct(id, {
      ...dataToUpdate,
      imageUrl,
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