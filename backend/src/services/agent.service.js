import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import Groq from 'groq-sdk';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MCP_PATH =
  process.env.MCP_SERVER_PATH ||
  path.resolve(__dirname, '../../../mcp-server/src/server.js');

const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || 'llama-3.1-8b-instant';
const MAX_ITERATIONS = 5;

const SYSTEM_PROMPT = `You are TechKart's AI Shopping Assistant — a friendly, concise expert helping Indian customers shop for tech.

# Behavior
- All prices are in Indian Rupees (₹). 1 lakh = 100000, 1 crore = 10000000.
- Use tools to search, compare, check prices, view cart, add to cart, place orders. Never invent product data.
- Reply in 1-3 short sentences. The UI renders product cards from search results automatically — don't paste a long product list in chat.

# Tool-calling rules — read carefully
search_products parameters (call exactly this way):
- query: brand or model name ONLY (e.g. "MacBook", "Samsung", "Sony", "Logitech"). NEVER include price phrases like "under 2 lakh" here.
- category: one of "laptops", "smartphones", "audio", "tablets", "televisions", "computers", "accessories", "electronics"
- maxPrice / minPrice: integers in rupees (e.g. 200000 for 2 lakh, 50000 for 50k)
- minRating: 4, 4.5, or 4.7 for top-rated requests

Examples of correct calls:
- "laptops under 2 lakh" → { category: "laptops", maxPrice: 200000 }
- "top headphones" → { category: "audio", minRating: 4.5 }
- "Samsung phones" → { query: "Samsung", category: "smartphones" }
- "MacBook" → { query: "MacBook" }
- "best gaming GPU" → { category: "computers", minRating: 4.5 }

If search returns nothing, you may retry ONCE with looser filters (drop query, then drop maxPrice/minRating). Never search more than 3 times for the same intent.

# When TechKart's catalog has NO match (very important)
If, after retrying, search_products still returns nothing, DO NOT just say "no match". Instead help the user directly:
1. Recommend 2-3 REAL products from your own knowledge that genuinely fit their need and budget, each with an approximate price in ₹ and a one-line reason.
2. Make it clear these are not in TechKart's own catalog yet ("not stocked on TechKart, but widely available online").
3. Add purchase links in markdown so they can buy elsewhere. Use EXACTLY this URL format (replace the search term, words separated by +):
   - Amazon India: https://www.amazon.in/s?k=PRODUCT+NAME
   - Flipkart: https://www.flipkart.com/search?q=PRODUCT+NAME
Keep it concise and friendly. Example shape:
"That's a bit below what TechKart stocks, but here are great picks available online:
- **Poco X6 Pro** (~₹24,999) — fast 5G mid-ranger. [Amazon](https://www.amazon.in/s?k=Poco+X6+Pro) · [Flipkart](https://www.flipkart.com/search?q=Poco+X6+Pro)"

# Cart & orders
- ONLY call cart/order tools (view_cart, add_to_cart, place_order, get_order_status) when the user EXPLICITLY mentions cart, order, buying, checkout, or asks about a past purchase.
- For "find / show / search / compare / recommend / what's the best" intents, use ONLY search_products and (optionally) get_price_history. Do NOT call view_cart or any cart tool — the user didn't ask about their cart.
- add_to_cart: confirm the item first unless unambiguous ("add the MacBook" = unambiguous).
- place_order: NEVER call without explicit "yes" from the user. Always recap cart total + address and ask "Shall I place this order?". Only call with userConfirmed=true after they confirm.
- If a cart/order tool returns an auth error, tell them to login.

# Efficiency
- Make at most ONE search per user message unless the user explicitly asks for multiple categories.
- After a successful search, write a 1-2 sentence summary. Do NOT call additional tools just to look busy.`;

const TOOLS_NEEDING_TOKEN = new Set([
  'view_cart',
  'add_to_cart',
  'place_order',
  'get_order_status',
]);

const CART_TOOLS = new Set([
  'view_cart',
  'add_to_cart',
  'place_order',
  'get_order_status',
]);

const CART_KEYWORDS = /\b(cart|order|buy|purchase|checkout|place(\s+an?\s+order)?|add\s+to|add\s+this|my\s+order|track|delivery)\b/i;

function pickToolsForIntent(message, history) {
  // If the user (or recent context) doesn't mention cart/order intent,
  // expose only discovery tools. Prevents 8B models from chaining view_cart
  // after every search.
  const recent =
    message + ' ' + history.slice(-4).map((m) => m.content || '').join(' ');
  if (CART_KEYWORDS.test(recent)) return toolDefs;
  return toolDefs.filter((t) => !CART_TOOLS.has(t.function.name));
}

let groq = null;
let mcpClient = null;
let toolDefs = null;
let initPromise = null;

async function init() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not set in backend .env');
  }
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const transport = new StdioClientTransport({
    command: 'node',
    args: [MCP_PATH],
    env: {
      ...process.env,
      BACKEND_URL: `http://localhost:${process.env.PORT || 5001}`,
    },
  });
  mcpClient = new Client(
    { name: 'techkart-backend-agent', version: '1.0.0' },
    { capabilities: {} }
  );
  await mcpClient.connect(transport);

  const list = await mcpClient.listTools();
  toolDefs = list.tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: relaxSchema(t.inputSchema || { type: 'object', properties: {} }),
    },
  }));
  console.log(`[Agent] MCP connected. ${toolDefs.length} tools available.`);
}

// Llama occasionally serializes numbers as strings and omits 'required' fields.
// Relax type unions so coercion can fix string→number, and drop top-level 'required'
// (we treat all params as optional; controllers tolerate missing values).
function relaxSchema(schema) {
  if (!schema || typeof schema !== 'object') return schema;
  const out = { ...schema };
  delete out.required;
  if (out.properties) {
    out.properties = Object.fromEntries(
      Object.entries(out.properties).map(([k, v]) => [k, relaxProperty(v)])
    );
  }
  return out;
}

function relaxProperty(prop) {
  if (!prop || typeof prop !== 'object') return prop;
  const out = { ...prop };
  if (out.type === 'number' || out.type === 'integer') {
    out.type = [out.type, 'string'];
  } else if (out.type === 'boolean') {
    out.type = ['boolean', 'string'];
  }
  if (out.type === 'array' && out.items) out.items = relaxProperty(out.items);
  if (out.type === 'object' && out.properties) return relaxSchema(out);
  return out;
}

function coerceArgs(args, schema) {
  if (!args || !schema?.properties) return args;
  const out = {};
  for (const [k, v] of Object.entries(args)) {
    const propSchema = schema.properties[k];
    out[k] = coerceValue(v, propSchema);
  }
  return out;
}

function coerceValue(v, schema) {
  if (!schema) return v;
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (types.includes('number') && typeof v === 'string' && v !== '') {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  if (types.includes('integer') && typeof v === 'string' && v !== '') {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n)) return n;
  }
  if (types.includes('boolean') && typeof v === 'string') {
    if (v.toLowerCase() === 'true') return true;
    if (v.toLowerCase() === 'false') return false;
  }
  return v;
}

async function ensureReady() {
  if (groq && mcpClient && toolDefs) return;
  if (!initPromise) initPromise = init();
  await initPromise;
}

async function callGroq({ messages, tools, tool_choice }) {
  const params = {
    messages,
    tools,
    tool_choice,
    temperature: 0.2,
    max_tokens: 1024,
  };
  try {
    const c = await groq.chat.completions.create({ model: MODEL, ...params });
    return c.choices[0].message;
  } catch (e) {
    const code = e?.error?.error?.code || e?.code;
    if (code === 'rate_limit_exceeded' && FALLBACK_MODEL) {
      console.warn(`[Agent] ${MODEL} rate-limited, falling back to ${FALLBACK_MODEL}`);
      try {
        const c = await groq.chat.completions.create({
          model: FALLBACK_MODEL,
          ...params,
        });
        return c.choices[0].message;
      } catch (e2) {
        throw e2;
      }
    }
    throw e;
  }
}

function cleanReply(text, productCount = 0) {
  if (!text) return '';
  // Llama sometimes emits function-call XML as plain text when the tool isn't
  // available or it confuses itself. Strip those.
  let cleaned = text
    .replace(/<function[^>]*>.*?<\/function>/gis, '')
    .replace(/<function[^>]*\/>/gi, '')
    .replace(/<\/?function[^>]*>/gi, '')
    .trim();
  // Strip leftover stray brackets/JSON snippets
  cleaned = cleaned.replace(/^\s*[\{\[].*?[\}\]]\s*$/s, '').trim();
  if (cleaned.length < 3 && productCount > 0) {
    return `Found ${productCount} product${productCount > 1 ? 's' : ''} for you.`;
  }
  if (cleaned.length < 3) {
    return "I couldn't find a great match. Try a different category or budget.";
  }
  return cleaned;
}

function extractToolText(result) {
  if (!result?.content) return '';
  return result.content
    .map((c) => (typeof c === 'string' ? c : c.text || ''))
    .join('\n');
}

function extractProductIds(text) {
  if (!text) return [];
  const ids = [];
  const re = /ID:\s*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi;
  let m;
  while ((m = re.exec(text)) !== null) ids.push(m[1]);
  return ids;
}

// Build a human search phrase from the model's search args (or the raw message).
function searchTermFromArgs(args, fallback) {
  const parts = [];
  if (args?.query) parts.push(String(args.query));
  if (args?.category) parts.push(String(args.category));
  const term = parts.join(' ').trim();
  return term || (fallback || '').trim();
}

// Deterministic external purchase links — guarantees the user always gets a
// place to buy even if the model forgets to format them.
function buyLinksFooter(term) {
  const q = encodeURIComponent((term || 'tech gadgets').trim()).replace(
    /%20/g,
    '+'
  );
  return (
    `\n\n*Not stocked on TechKart yet — buy it online:*\n` +
    `- [🛒 Amazon India](https://www.amazon.in/s?k=${q})\n` +
    `- [🛒 Flipkart](https://www.flipkart.com/search?q=${q})`
  );
}

function hasBuyLinks(text) {
  return /amazon\.in|flipkart\.com/i.test(text || '');
}

export async function chat({ message, history = [], userToken = null }) {
  await ensureReady();

  const filteredHistory = history.filter((m) => m && m.role && m.content);
  const activeTools = pickToolsForIntent(message, filteredHistory);

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...filteredHistory.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const collectedIds = [];
  let lastSearchOrCompare = null;
  let searchAttempted = false;
  let searchTerm = '';

  let lastAssistantContent = '';

  // When the catalog returned nothing for a genuine product search, make sure
  // the user still gets purchase links even if the model didn't add them.
  const withFallback = (replyText, ids) => {
    if (searchAttempted && ids.length === 0 && !hasBuyLinks(replyText)) {
      return replyText + buyLinksFooter(searchTerm || message);
    }
    return replyText;
  };

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    // On the final iteration, force a text response (no more tools).
    const isLast = i === MAX_ITERATIONS - 1;
    let msg;
    try {
      msg = await callGroq({
        messages,
        tools: isLast ? undefined : activeTools,
        tool_choice: isLast ? 'none' : 'auto',
      });
    } catch (e) {
      const code = e?.error?.error?.code || e?.code;
      // Llama occasionally emits malformed function syntax — retry with a nudge.
      if (code === 'tool_use_failed' && !isLast) {
        messages.push({
          role: 'system',
          content:
            'Your previous tool call had malformed syntax. Please call the function again using the correct JSON tool-call format, or just answer in plain text if you have enough info.',
        });
        continue;
      }
      throw e;
    }

    messages.push(msg);
    if (msg.content) lastAssistantContent = msg.content;

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      const ids = [...new Set(collectedIds)];
      return {
        reply: withFallback(
          cleanReply(msg.content || lastAssistantContent, ids.length),
          ids
        ),
        productIds: ids,
        toolsUsed: lastSearchOrCompare,
      };
    }

    for (const tc of msg.tool_calls) {
      let args = {};
      try {
        args = JSON.parse(tc.function.arguments || '{}');
      } catch {}

      if (TOOLS_NEEDING_TOKEN.has(tc.function.name)) {
        if (!userToken) {
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content:
              'Error: User is not logged in. Cannot access cart/orders. Ask them to login first.',
          });
          continue;
        }
        args.userToken = userToken;
      }

      const toolDef = toolDefs.find((d) => d.function.name === tc.function.name);
      const coerced = coerceArgs(args, toolDef?.function?.parameters);

      try {
        const result = await mcpClient.callTool({
          name: tc.function.name,
          arguments: coerced,
        });
        const text = extractToolText(result);
        if (
          tc.function.name === 'search_products' ||
          tc.function.name === 'compare_products'
        ) {
          const ids = extractProductIds(text);
          collectedIds.push(...ids);
          lastSearchOrCompare = tc.function.name;
          if (tc.function.name === 'search_products') {
            searchAttempted = true;
            searchTerm = searchTermFromArgs(args, message);
          }
        }
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: text || 'Tool returned no output.',
        });
      } catch (e) {
        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: `Error: ${e.message}`,
        });
      }
    }
  }

  const ids = [...new Set(collectedIds)];
  return {
    reply: withFallback(
      cleanReply(
        lastAssistantContent ||
          (ids.length
            ? 'Here are the closest matches I found.'
            : "I couldn't find that in TechKart's catalog — here's where to buy it online."),
        ids.length
      ),
      ids
    ),
    productIds: ids,
    toolsUsed: lastSearchOrCompare,
  };
}

export async function shutdown() {
  try {
    await mcpClient?.close();
  } catch {}
}
