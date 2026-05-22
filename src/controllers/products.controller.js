import { productsService } from "../services/products.service.js"; 

const getProducts = (req, res) => {
    const products = productsService.getProducts();
    res.json({
        ok: true,
        data: products
    });
}

const getProductById = (req, res) => {
  const id = Number(req.params.id);
  const product = productsService.getProductById(id);

  if (!product) {
    return res.status(404).json({
      ok: false,
      error: {
        message: 'Product not found',
      },
    });
  }

  return res.json({
    ok: true,
    data: product,
  });
};

const createProduct = (req, res) => {
  const { name, price } = req.body;

 if (
  !name ||
  typeof name !== 'string' ||
  name.trim() === '' ||
  price === undefined ||
  typeof price !== 'number' ||
  price < 0
) {
    return res.status(400).json({
      ok: false,
      error: {
        message: 'Invalid product data',
      },
    });
  }

  const product = productsService.createProduct(req.body);

  return res.status(201).json({
    ok: true,
    data: product,
  });
};

const updateProduct = (req, res) => {
  const id = Number(req.params.id);
  const { name, price } = req.body;

  if (
    (name !== undefined && (typeof name !== 'string' || name.trim() === '')) ||
    (price !== undefined && (typeof price !== 'number' || price < 0))
  ) {
    return res.status(400).json({
      ok: false,
      error: {
        message: 'Invalid product data',
      },
    });
  }

  const updatedProduct = productsService.updateProduct(id, req.body);

  if (!updatedProduct) {
    return res.status(404).json({
      ok: false,
      error: {
        message: 'Product not found',
      },
    });
  }

  return res.json({
    ok: true,
    data: updatedProduct,
  });
};

const deleteProduct = (req, res) => {
  const id = Number(req.params.id);
  const deletedProduct = productsService.deleteProduct(id);

  if (!deletedProduct) {
    return res.status(404).json({
      ok: false,
      error: {
        message: 'Product not found',
      },
    });
  }

  return res.json({
    ok: true,
    data: deletedProduct,
  });
};

export const productsController = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};