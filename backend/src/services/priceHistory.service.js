import { prisma } from '../config/database.js';

export async function recordPrice(productId, price, source = 'system') {
  return prisma.priceHistory.create({
    data: { productId, price, source },
  });
}

export async function getHistorySummary(productId, days = 90) {
  const since = new Date(Date.now() - days * 86400000);
  const history = await prisma.priceHistory.findMany({
    where: { productId, recordedAt: { gte: since } },
    orderBy: { recordedAt: 'asc' },
    select: { price: true, recordedAt: true },
  });
  if (history.length === 0) {
    return { history: [], current: 0, min: 0, max: 0, avg: 0 };
  }
  const prices = history.map((h) => Number(h.price));
  return {
    history: history.map((h) => ({
      price: Number(h.price),
      date: h.recordedAt.toISOString().split('T')[0],
    })),
    current: prices[prices.length - 1],
    min: Math.min(...prices),
    max: Math.max(...prices),
    avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
  };
}
