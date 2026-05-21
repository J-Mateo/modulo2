import { products } from '../db/products.js';

const getProducts = () => products;


const getProductById = (id) => {
  return products.find((product) => product.id === id) || null;
};

const createProduct = (data) => {
  const newProduct = {
    id: Date.now(),
    ...data,
    createdAt: new Date().toISOString(),
  };

  products.push(newProduct);
  return newProduct;
};

const updateProduct = (id, data) => {
  const product = getProductById(id);

  if (!product) {
    return null;
  }

  const updatedProduct = {
    ...product,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  Object.assign(product, updatedProduct);

  return product;
};

const deleteProduct = (id) => {
  const productIndex = products.findIndex((product) => product.id === id);

  if (productIndex === -1) {
    return null;
  }

  const deletedProduct = products.splice(productIndex, 1)[0];
  return deletedProduct;
};


export const productsService = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};