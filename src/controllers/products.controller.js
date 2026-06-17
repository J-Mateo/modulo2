import { productsService } from '../services/products.service.js';
import { AppError } from '../misc/AppError.js';
import { ErrorSelector } from '../misc/errors.js';

const getProducts = async (req, res, next) => {
  try {
    const products = await productsService.getProducts();

    return res.json({
      ok: true,
      data: products,
    });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      throw new AppError(ErrorSelector.BAD_REQUEST);
    }

    const product = await productsService.getProductById(id);

    if (!product) {
      throw new AppError(ErrorSelector.NOT_FOUND);
    }

    return res.json({
      ok: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const { name, price, stock } = req.body;

    if (
      !name ||
      typeof name !== 'string' ||
      name.trim() === '' ||
      price === undefined ||
      Number(price) < 0 ||
      stock === undefined ||
      Number(stock) < 0
    ) {
      throw new AppError(ErrorSelector.BAD_REQUEST);
    }

    const product = await productsService.createProduct(req.body);

    return res.status(201).json({
      ok: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      throw new AppError(ErrorSelector.BAD_REQUEST);
    }

    const updatedProduct = await productsService.updateProduct(
      id,
      req.body
    );

    if (!updatedProduct) {
      throw new AppError(ErrorSelector.NOT_FOUND);
    }

    return res.json({
      ok: true,
      data: updatedProduct,
    });
  } catch (err) {
    next(err);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      throw new AppError(ErrorSelector.BAD_REQUEST);
    }

    const deletedProduct = await productsService.deleteProduct(id);

    if (!deletedProduct) {
      throw new AppError(ErrorSelector.NOT_FOUND);
    }

    return res.json({
      ok: true,
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