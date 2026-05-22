import { Router } from 'express';
import {
  getProducts,
  getProduct,
  getPriceHistory,
  compareProducts,
  getCategories,
} from '../controllers/product.controller.js';

export const productRouter = Router();
productRouter.get('/', getProducts);
productRouter.get('/categories', getCategories);
productRouter.post('/compare', compareProducts);
productRouter.get('/:id', getProduct);
productRouter.get('/:id/price-history', getPriceHistory);
