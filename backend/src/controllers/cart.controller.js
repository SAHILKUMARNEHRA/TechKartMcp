import { prisma } from '../config/database.js';

export async function getCart(req, res, next) {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.sub },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
    const total = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
    res.json({
      items,
      total: Math.round(total),
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
    });
  } catch (err) {
    next(err);
  }
}

export async function addToCart(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });
    await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user.sub, productId } },
      update: { quantity: { increment: quantity } },
      create: { userId: req.user.sub, productId, quantity },
    });
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.sub },
      include: { product: true },
    });
    const total = items.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);
    res.json({
      message: 'Added to cart',
      itemCount: items.reduce((s, i) => s + i.quantity, 0),
      total: Math.round(total),
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCartItem(req, res, next) {
  try {
    const { quantity } = req.body;
    if (quantity < 1) return deleteCartItem(req, res, next);
    await prisma.cartItem.update({
      where: { id: req.params.id },
      data: { quantity },
    });
    res.json({ message: 'Updated' });
  } catch (err) {
    next(err);
  }
}

export async function deleteCartItem(req, res, next) {
  try {
    await prisma.cartItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Removed' });
  } catch (err) {
    next(err);
  }
}

export async function clearCart(req, res, next) {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user.sub } });
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    next(err);
  }
}
