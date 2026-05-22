import { prisma } from '../config/database.js';

export async function getWishlist(req, res, next) {
  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: req.user.sub },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function addToWishlist(req, res, next) {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    try {
      const item = await prisma.wishlist.create({
        data: { userId: req.user.sub, productId },
        include: { product: true },
      });
      res.status(201).json(item);
    } catch (e) {
      if (e.code === 'P2002') {
        return res.status(200).json({ message: 'Already in wishlist' });
      }
      throw e;
    }
  } catch (err) {
    next(err);
  }
}

export async function removeFromWishlist(req, res, next) {
  try {
    await prisma.wishlist.deleteMany({
      where: { userId: req.user.sub, productId: req.params.productId },
    });
    res.json({ message: 'Removed' });
  } catch (err) {
    next(err);
  }
}
