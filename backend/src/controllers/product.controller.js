import { prisma } from '../config/database.js';

export async function getProducts(req, res, next) {
  try {
    const { q, category, minPrice, maxPrice, minRating, sort, page = 1, limit = 20 } = req.query;
    const where = {};
    if (q)
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
      ];
    if (category) where.category = { contains: category, mode: 'insensitive' };
    if (minPrice || maxPrice)
      where.price = {
        ...(minPrice && { gte: Number(minPrice) }),
        ...(maxPrice && { lte: Number(maxPrice) }),
      };
    if (minRating) where.rating = { gte: Number(minRating) };

    const orderBy =
      sort === 'price_asc'
        ? { price: 'asc' }
        : sort === 'price_desc'
          ? { price: 'desc' }
          : sort === 'rating'
            ? { rating: 'desc' }
            : { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.product.count({ where }),
    ]);
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: true,
    });
    res.json({
      products,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      categories: categories.map((c) => ({ name: c.category, count: c._count })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    next(err);
  }
}

export async function getPriceHistory(req, res, next) {
  try {
    const { days = 90 } = req.query;
    const since = new Date(Date.now() - Number(days) * 86400000);
    const history = await prisma.priceHistory.findMany({
      where: { productId: req.params.id, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
      select: { price: true, recordedAt: true },
    });
    if (history.length === 0) {
      return res.json({ history: [], current: 0, min: 0, max: 0, avg: 0 });
    }
    const prices = history.map((h) => Number(h.price));
    res.json({
      history: history.map((h) => ({
        price: Number(h.price),
        date: h.recordedAt.toISOString().split('T')[0],
      })),
      current: prices[prices.length - 1] || 0,
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    });
  } catch (err) {
    next(err);
  }
}

export async function compareProducts(req, res, next) {
  try {
    const { ids } = req.body;
    if (!ids || ids.length < 2 || ids.length > 4)
      return res.status(400).json({ error: 'Provide 2-4 product IDs' });
    const products = await prisma.product.findMany({ where: { id: { in: ids } } });
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

export async function getCategories(req, res, next) {
  try {
    const cats = await prisma.product.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    res.json({ categories: cats.map((c) => ({ name: c.category, count: c._count.id })) });
  } catch (err) {
    next(err);
  }
}
