import { chat } from '../services/agent.service.js';
import { prisma } from '../config/database.js';

export async function postChat(req, res, next) {
  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string')
      return res.status(400).json({ error: 'message (string) required' });

    const userToken = req.headers.authorization?.split(' ')[1] || null;

    const { reply, productIds } = await chat({
      message,
      history: Array.isArray(history) ? history.slice(-16) : [],
      userToken,
    });

    let products = [];
    if (productIds.length > 0) {
      products = await prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      const order = new Map(productIds.map((id, i) => [id, i]));
      products.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    }

    res.json({ reply, products });
  } catch (err) {
    if (err.message?.includes('GROQ_API_KEY')) {
      return res.status(503).json({
        error:
          'Assistant service not configured. Set GROQ_API_KEY in backend .env, then restart.',
      });
    }
    const code = err?.error?.error?.code || err?.code;
    if (code === 'rate_limit_exceeded') {
      const upstream = err?.error?.error?.message || '';
      const retry = upstream.match(/try again in ([0-9hms.]+)/i)?.[1];
      return res.status(429).json({
        error: `The assistant is taking a quick break — daily limit reached${
          retry ? ` (resets in ~${retry})` : ''
        }. Browse products manually for now and try again soon.`,
      });
    }
    console.error('[Agent] chat error:', err);
    next(err);
  }
}
