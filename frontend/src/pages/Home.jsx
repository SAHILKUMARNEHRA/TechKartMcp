import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  TrendingDown,
  GitCompare,
  Truck,
  Laptop,
  Smartphone,
  Headphones,
  Tv,
  Tablet,
  Cpu,
} from 'lucide-react';
import api from '../services/api.js';
import ProductCard from '../components/ui/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/ui/LoadingSkeleton.jsx';
import { useStore } from '../store/useStore.js';

const CATEGORIES = [
  { key: 'laptops', label: 'Laptops', icon: Laptop },
  { key: 'smartphones', label: 'Phones', icon: Smartphone },
  { key: 'audio', label: 'Audio', icon: Headphones },
  { key: 'tablets', label: 'Tablets', icon: Tablet },
  { key: 'televisions', label: 'TVs', icon: Tv },
  { key: 'computers', label: 'Components', icon: Cpu },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const toggleAgent = useStore((s) => s.toggleAgent);

  useEffect(() => {
    api
      .get('/products', { params: { sort: 'rating', limit: 8 } })
      .then((res) => setFeatured(res.data.products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-bg page-fade">
      {/* Hero */}
      <section className="container-page pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-3xl"
        >
          <span className="eyebrow">Introducing</span>
          <h1 className="mt-4">
            Tech,
            <br />
            considered.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-ink-2 max-w-xl leading-relaxed">
            A small, curated catalog of the best laptops, phones, and audio — with an AI
            that knows when each one is the right time to buy.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/products" className="glass-button-primary">
              Shop everything
              <ArrowRight size={16} className="ml-1" />
            </Link>
            <button onClick={toggleAgent} className="glass-button-ghost">
              <Bot size={15} className="mr-1" />
              Ask the assistant
            </button>
          </div>
        </motion.div>
      </section>

      {/* Category strip */}
      <section className="container-page pb-20">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {CATEGORIES.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.key}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  to={`/products?category=${c.key}`}
                  className="glass-card glass-card-interactive py-6 flex flex-col items-center gap-2.5"
                >
                  <Icon size={20} className="text-ink-2" strokeWidth={1.6} />
                  <span className="text-[13px] font-medium">{c.label}</span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      <section className="container-page pb-20">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <span className="eyebrow">Top-rated this week</span>
            <h2 className="mt-2">The best, right now.</h2>
          </div>
          <Link
            to="/products"
            className="text-link text-sm hidden sm:inline-flex items-center gap-1"
          >
            See all <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <ProductGridSkeleton />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Feature trio */}
      <section className="container-page pb-24">
        <div className="grid md:grid-cols-3 gap-4">
          <Feature
            icon={<Bot size={20} strokeWidth={1.6} />}
            kicker="AI assistant"
            title="A real conversation."
            text="Tell our assistant what you want. It finds, compares, and even places the order — with your approval at every step."
          />
          <Feature
            icon={<TrendingDown size={20} strokeWidth={1.6} />}
            kicker="Price intelligence"
            title="Buy at the right time."
            text="Every product carries a 90-day price chart so you know when today's price is actually a good one."
          />
          <Feature
            icon={<GitCompare size={20} strokeWidth={1.6} />}
            kicker="Side-by-side"
            title="Compare with clarity."
            text="Stack up to four products on a single page. Specs, ratings, prices — laid out so the decision makes itself."
          />
        </div>
      </section>

      {/* Quiet footer band */}
      <section className="border-t border-line-soft">
        <div className="container-page py-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-sm text-muted">
            <Truck size={16} strokeWidth={1.6} className="text-ink-2" />
            Free shipping on orders over ₹50,000
          </div>
          <div className="text-sm text-muted">30-day returns · 1-year warranty</div>
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, kicker, title, text }) {
  return (
    <div className="glass-card p-7 flex flex-col gap-3">
      <span className="w-10 h-10 rounded-full bg-accent-soft text-accent flex items-center justify-center">
        {icon}
      </span>
      <span className="eyebrow !text-muted !text-[11px]">{kicker}</span>
      <h3 className="!text-[20px]">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{text}</p>
    </div>
  );
}
