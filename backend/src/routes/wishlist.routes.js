import { Router } from 'express';
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from '../controllers/wishlist.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const wishlistRouter = Router();
wishlistRouter.use(requireAuth);
wishlistRouter.get('/', getWishlist);
wishlistRouter.post('/', addToWishlist);
wishlistRouter.delete('/:productId', removeFromWishlist);
