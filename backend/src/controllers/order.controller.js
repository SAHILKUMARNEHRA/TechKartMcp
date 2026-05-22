import { prisma } from '../config/database.js';

export async function getOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.sub },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req, res, next) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.sub },
      include: { items: { include: { product: true } } },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function placeOrder(req, res, next) {
  try {
    const { shippingAddr, paymentMethod = 'COD', notes, placedByAgent = false } = req.body;
    if (!shippingAddr) return res.status(400).json({ error: 'shippingAddr required' });

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.sub },
      include: { product: true },
    });
    if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    for (const item of cartItems) {
      if (item.product.stock < item.quantity)
        return res.status(400).json({ error: `${item.product.title} is out of stock` });
    }

    const totalAmount = cartItems.reduce(
      (s, i) => s + Number(i.product.price) * i.quantity,
      0
    );

    const order = await prisma.order.create({
      data: {
        userId: req.user.sub,
        totalAmount,
        shippingAddr,
        paymentMethod,
        notes,
        placedByAgent,
        items: {
          create: cartItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.product.price,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    await Promise.all([
      ...cartItems.map((i) =>
        prisma.product.update({
          where: { id: i.productId },
          data: { stock: { decrement: i.quantity } },
        })
      ),
      prisma.cartItem.deleteMany({ where: { userId: req.user.sub } }),
    ]);

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(req, res, next) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.sub },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!['PENDING', 'CONFIRMED'].includes(order.status))
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}
