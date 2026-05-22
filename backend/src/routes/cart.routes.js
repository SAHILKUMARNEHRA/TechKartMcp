import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart,
} from '../controllers/cart.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const cartRouter = Router();
cartRouter.use(requireAuth);
cartRouter.get('/', getCart);
cartRouter.post('/', addToCart);
cartRouter.patch('/:id', updateCartItem);
cartRouter.delete('/clear', clearCart);
cartRouter.delete('/:id', deleteCartItem);
