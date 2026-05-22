import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import 'dotenv/config';

const BASE = process.env.BACKEND_URL || 'http://localhost:5000';

const api = async (path, method = 'GET', body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API ${res.status}`);
  return data;
};

const server = new McpServer({ name: 'techkart-agent', version: '1.0.0' });

server.tool(
  'search_products',
  'Search TechKart for tech products by keyword, category, price, rating.',
  {
    query: z.string(),
    category: z.string().optional(),
    maxPrice: z.number().optional(),
    minPrice: z.number().optional(),
    minRating: z.number().optional(),
    limit: z.number().default(8),
  },
  async ({ query, category, maxPrice, minPrice, minRating, limit }) => {
    try {
      const p = new URLSearchParams({ q: query, limit: String(limit) });
      if (category) p.set('category', category);
      if (maxPrice) p.set('maxPrice', String(maxPrice));
      if (minPrice) p.set('minPrice', String(minPrice));
      if (minRating) p.set('minRating', String(minRating));
      const data = await api(`/api/products?${p}`);
      if (!data.products.length)
        return { content: [{ type: 'text', text: 'No products found.' }] };
      const list = data.products
        .map(
          (p) =>
            `• ${p.title} — ₹${p.price} | Rating: ${p.rating}/5 | Stock: ${p.stock} | ID: ${p.id}`
        )
        .join('\n');
      return {
        content: [
          { type: 'text', text: `Found ${data.products.length} products:\n\n${list}` },
        ],
      };
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  'get_price_history',
  'Get price trend for a product to advise if now is a good time to buy.',
  {
    productId: z.string(),
    days: z.number().default(30),
  },
  async ({ productId, days }) => {
    try {
      const data = await api(`/api/products/${productId}/price-history?days=${days}`);
      const trend =
        data.current <= data.min * 1.05
          ? 'NEAR ALL-TIME LOW — great time to buy!'
          : data.current >= data.max * 0.95
            ? 'NEAR ALL-TIME HIGH — consider waiting'
            : 'MID RANGE';
      return {
        content: [
          {
            type: 'text',
            text: `Price History (${days}d):\nCurrent: ₹${data.current}\nLowest: ₹${data.min}\nHighest: ₹${data.max}\nAverage: ₹${data.avg}\nAdvice: ${trend}`,
          },
        ],
      };
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  'compare_products',
  'Compare 2–4 products and recommend best value.',
  { productIds: z.array(z.string()).min(2).max(4) },
  async ({ productIds }) => {
    try {
      const { products } = await api('/api/products/compare', 'POST', { ids: productIds });
      const best = products.reduce((b, p) =>
        p.rating / p.price > b.rating / b.price ? p : b
      );
      const table = products
        .map((p) => `${p.title}: ₹${p.price}, ${p.rating}/5`)
        .join('\n');
      return {
        content: [
          {
            type: 'text',
            text: `Comparison:\n${table}\n\n✅ Best value: ${best.title} at ₹${best.price}`,
          },
        ],
      };
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  'view_cart',
  "See user's current cart and total.",
  { userToken: z.string() },
  async ({ userToken }) => {
    try {
      const data = await api('/api/cart', 'GET', null, userToken);
      if (!data.items.length)
        return { content: [{ type: 'text', text: 'Cart is empty.' }] };
      const list = data.items
        .map(
          (i) =>
            `• ${i.product.title} × ${i.quantity} = ₹${Number(i.product.price) * i.quantity}`
        )
        .join('\n');
      return {
        content: [{ type: 'text', text: `Cart:\n${list}\n\nTotal: ₹${data.total}` }],
      };
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  'add_to_cart',
  'Add a product to the cart.',
  {
    productId: z.string(),
    quantity: z.number().default(1),
    userToken: z.string(),
  },
  async ({ productId, quantity, userToken }) => {
    try {
      const data = await api('/api/cart', 'POST', { productId, quantity }, userToken);
      return {
        content: [
          {
            type: 'text',
            text: `Added to cart ✓ | Cart: ${data.itemCount} items | Total: ₹${data.total}`,
          },
        ],
      };
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  'place_order',
  '⚠️ ONLY call after user has EXPLICITLY confirmed. Always show cart summary and ask "Shall I place this order?" first.',
  {
    userToken: z.string(),
    shippingAddr: z.object({
      fullName: z.string(),
      street: z.string(),
      city: z.string(),
      state: z.string(),
      pincode: z.string().regex(/^\d{6}$/),
      phone: z.string().regex(/^\d{10}$/),
    }),
    paymentMethod: z.enum(['COD', 'UPI', 'CARD']).default('COD'),
    userConfirmed: z.boolean().describe('Must be true — user said yes'),
  },
  async ({ userToken, shippingAddr, paymentMethod, userConfirmed }) => {
    if (!userConfirmed)
      return {
        content: [
          {
            type: 'text',
            text: '⛔ Not placed. Please confirm cart + address with user first.',
          },
        ],
        isError: true,
      };
    try {
      const order = await api(
        '/api/orders',
        'POST',
        { shippingAddr, paymentMethod, placedByAgent: true },
        userToken
      );
      return {
        content: [
          {
            type: 'text',
            text: `✅ Order placed!\nID: ${order.id.slice(0, 8)}\nTotal: ₹${order.totalAmount}\nPayment: ${order.paymentMethod}\nStatus: ${order.status}\nEstimated delivery: 3–5 business days`,
          },
        ],
      };
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  'get_order_status',
  'Check order status.',
  {
    userToken: z.string(),
    orderId: z.string().optional(),
  },
  async ({ userToken, orderId }) => {
    try {
      if (orderId) {
        const o = await api(`/api/orders/${orderId}`, 'GET', null, userToken);
        return {
          content: [
            {
              type: 'text',
              text: `Order #${o.id.slice(0, 8)}: ${o.status} | ₹${o.totalAmount} | ${new Date(o.createdAt).toLocaleDateString('en-IN')}`,
            },
          ],
        };
      }
      const { orders } = await api('/api/orders', 'GET', null, userToken);
      if (!orders.length) return { content: [{ type: 'text', text: 'No orders yet.' }] };
      return {
        content: [
          {
            type: 'text',
            text: orders
              .slice(0, 5)
              .map(
                (o) =>
                  `• #${o.id.slice(0, 8)} | ₹${o.totalAmount} | ${o.status} | ${new Date(o.createdAt).toLocaleDateString('en-IN')}`
              )
              .join('\n'),
          },
        ],
      };
    } catch (e) {
      return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('TechKart MCP Agent running...');
