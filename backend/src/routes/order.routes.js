import { Router } from 'express';
import {
  getOrders,
  getOrder,
  placeOrder,
  cancelOrder,
} from '../controllers/order.controller.js';
import { generateReceipt } from '../controllers/receipt.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

export const orderRouter = Router();
orderRouter.use(requireAuth);
orderRouter.get('/', getOrders);
orderRouter.post('/', placeOrder);
orderRouter.get('/:id', getOrder);
orderRouter.get('/:id/receipt.pdf', generateReceipt);
orderRouter.patch('/:id/cancel', cancelOrder);
