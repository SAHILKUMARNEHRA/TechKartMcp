import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, X, Send, Sparkles, ShoppingCart, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useStore } from '../../store/useStore.js';
import { useCart } from '../../context/CartContext.jsx';
import api from '../../services/api.js';
import { formatINR } from '../ui/ProductCard.jsx';

const QUICK_PROMPTS = [
  'Find me a laptop under ₹1,50,000',
  'Show top-rated headphones',
  'Best Samsung phones',
  'Compare MacBook vs Dell XPS',
];

const GREETING = {
  role: 'assistant',
  content:
    "Hi! I'm your TechKart AI assistant ⚡ Tell me what you're shopping for and I'll find the best products, check price trends, and help you order.",
};

export default function AgentPanel() {
  const open = useStore((s) => s.agentOpen);
  const setOpen = useStore((s) => s.setAgentOpen);
  const { addItem, refresh: refreshCart } = useCart();
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, open, busy]);

  const sendMessage = async (text) => {
    if (!text.trim() || busy) return;
    const userMsg = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setBusy(true);

    try {
      const history = next
        .filter((m) => m !== GREETING && (m.role === 'user' || m.role === 'assistant'))
        .slice(-16)
        .map((m) => ({ role: m.role, content: m.content }));

      const { data } = await api.post('/agent/chat', {
        message: text,
        history: history.slice(0, -1),
      });

      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: data.reply || '…',
          products: data.products || [],
        },
      ]);

      if (data.reply && /added to cart|placed/i.test(data.reply)) {
        refreshCart();
      }
    } catch (err) {
      const errMsg =
        err.response?.status === 503
          ? err.response.data.error
          : err.response?.data?.error || 'Something went wrong talking to the AI.';
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: `⚠️ ${errMsg}`, error: true },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleAdd = async (productId) => {
    const ok = await addItem(productId, 1);
    if (ok) toast.success('Added to cart');
  };

  const resetChat = () => setMessages([GREETING]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
            className="w-full sm:w-[460px] h-full glass-card !rounded-none !rounded-l-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line-soft">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
                  <Bot size={18} className="text-white" />
                </span>
                <div>
                  <div className="font-medium flex items-center gap-1.5">
                    AI Shopping Assistant
                    <Sparkles size={12} className="text-accent" />
                  </div>
                  <div className="text-xs text-faint">
                    Groq · Llama 3.3 70B · MCP
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetChat}
                  className="text-xs text-muted hover:text-ink px-2 py-1"
                  title="Reset chat"
                >
                  Reset
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-lg bg-surface-2 border border-line-soft flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-5 flex flex-col gap-4"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-2 ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-accent text-white rounded-br-md'
                        : m.error
                          ? 'bg-danger/10 border border-danger/30 text-danger rounded-bl-md'
                          : 'bg-surface-2 border border-line-soft rounded-bl-md'
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.products && m.products.length > 0 && (
                    <div className="flex flex-col gap-2 w-full">
                      {m.products.slice(0, 5).map((p) => (
                        <div
                          key={p.id}
                          className="glass-card p-3 flex items-center gap-3"
                        >
                          <img
                            src={p.imageUrl}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-lg object-contain bg-surface-2"
                          />
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/products/${p.id}`}
                              onClick={() => setOpen(false)}
                              className="text-sm font-medium line-clamp-1 hover:underline"
                            >
                              {p.title}
                            </Link>
                            <div className="text-xs text-muted mt-0.5">
                              {formatINR(p.price)} · ⭐{' '}
                              {Number(p.rating || 0).toFixed(1)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAdd(p.id)}
                            className="glass-button-primary !py-1.5 !px-3 text-xs flex items-center gap-1"
                          >
                            <ShoppingCart size={12} /> Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {busy && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Loader2 size={12} className="animate-spin" />
                  Thinking…
                </div>
              )}
            </div>

            {messages.length <= 1 && (
              <div className="px-5 pt-3 flex flex-wrap gap-2 border-t border-line-soft">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    disabled={busy}
                    className="text-xs bg-surface-2 hover:bg-surface-3 border border-line-soft rounded-full px-3 py-1.5 text-ink-2 disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="p-5 flex gap-2 border-t border-line-soft"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about products, prices, comparisons…"
                className="glass-input"
                disabled={busy}
              />
              <button
                type="submit"
                disabled={!input.trim() || busy}
                className="glass-button-primary !px-4"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
