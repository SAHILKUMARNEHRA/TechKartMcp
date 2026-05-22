import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShoppingCart, GitCompare, Check, Truck, ShieldCheck, RotateCcw } from 'lucide-react';
import api from '../services/api.js';
import { useCart } from '../context/CartContext.jsx';
import { useCompare } from '../hooks/useCompare.js';
import PriceHistoryChart from '../components/ui/PriceHistoryChart.jsx';
import { LineSkeleton } from '../components/ui/LoadingSkeleton.jsx';
import { formatINR } from '../components/ui/ProductCard.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();
  const { addToCompare, isInCompare, removeFromCompare } = useCompare();

  useEffect(() => {
    setLoading(true);
    api
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="water-bg min-h-screen">
        <div className="container-page py-10 grid lg:grid-cols-2 gap-8">
          <LineSkeleton height={420} />
          <div className="flex flex-col gap-3">
            <LineSkeleton height={32} width="60%" />
            <LineSkeleton height={20} width="40%" />
            <LineSkeleton height={20} />
            <LineSkeleton height={20} />
          </div>
        </div>
      </div>
    );
  }

  if (!product)
    return (
      <div className="water-bg min-h-screen">
        <div className="container-page py-20 text-center">
          <h1 className="text-2xl">Product not found</h1>
          <Link to="/products" className="glass-button-primary inline-block mt-6">
            Back to shop
          </Link>
        </div>
      </div>
    );

  const inCompare = isInCompare(product.id);
  const discount =
    product.originalPrice && Number(product.originalPrice) > Number(product.price)
      ? Math.round(
          ((Number(product.originalPrice) - Number(product.price)) /
            Number(product.originalPrice)) *
            100
        )
      : 0;

  return (
    <div className="water-bg min-h-screen">
      <div className="container-page py-10">
        <nav className="text-xs text-muted mb-6 flex gap-2">
          <Link to="/" className="hover:text-ink">
            Home
          </Link>
          <span>/</span>
          <Link to={`/products?category=${product.category}`} className="hover:text-ink capitalize">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-ink-2 truncate max-w-[200px]">{product.title}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-10">
          <div className="glass-card p-8 flex items-center justify-center min-h-[400px]">
            <img
              src={product.imageUrl}
              alt={product.title}
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[480px] object-contain"
              onError={(e) => {
                e.currentTarget.src =
                  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="%2313131c" width="200" height="200"/><text x="50%25" y="50%25" fill="%23555" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="14">No image</text></svg>';
              }}
            />
          </div>

          <div className="flex flex-col gap-5">
            {product.brand && (
              <span className="text-xs uppercase tracking-widest text-accent">
                {product.brand}
              </span>
            )}
            <h1 className="text-3xl lg:text-4xl font-semibold leading-tight">
              {product.title}
            </h1>
            <div className="flex items-center gap-3 text-sm text-ink-2">
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-yellow-400 text-yellow-400" />
                {Number(product.rating || 0).toFixed(1)}
              </span>
              <span className="text-faint">·</span>
              <span>{product.reviewCount} reviews</span>
              <span className="text-faint">·</span>
              <span className={product.stock > 0 ? 'text-green-400' : 'text-red-400'}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold">{formatINR(product.price)}</span>
              {product.originalPrice &&
                Number(product.originalPrice) > Number(product.price) && (
                  <>
                    <span className="text-lg text-faint line-through">
                      {formatINR(product.originalPrice)}
                    </span>
                    <span className="price-badge">-{discount}%</span>
                  </>
                )}
            </div>

            <p className="text-ink-2 leading-relaxed">{product.description}</p>

            {product.specs && (
              <div className="glass-card p-5 mt-2">
                <h3 className="text-sm font-medium mb-3 text-ink-2">Specifications</h3>
                <dl className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  {Object.entries(product.specs).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="text-faint capitalize">{k.replace(/([A-Z])/g, ' $1')}</dt>
                      <dd className="text-ink-2">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center bg-surface-2 border border-line-soft rounded-xl">
                <button
                  className="w-10 h-11 text-lg"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span className="w-10 text-center">{qty}</span>
                <button
                  className="w-10 h-11 text-lg"
                  onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                >
                  +
                </button>
              </div>
              <button
                onClick={() => addItem(product.id, qty)}
                disabled={product.stock <= 0}
                className="glass-button-primary flex-1 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={16} />
                Add to Cart
              </button>
              <button
                onClick={() =>
                  inCompare ? removeFromCompare(product.id) : addToCompare(product)
                }
                className={`glass-button-ghost flex items-center gap-2 ${
                  inCompare ? 'border-accent text-accent' : ''
                }`}
              >
                {inCompare ? <Check size={16} /> : <GitCompare size={16} />}
                <span className="hidden sm:inline">{inCompare ? 'Added' : 'Compare'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              <Perk icon={<Truck size={16} />} text="Free delivery" />
              <Perk icon={<RotateCcw size={16} />} text="30-day returns" />
              <Perk icon={<ShieldCheck size={16} />} text="Warranty included" />
            </div>
          </div>
        </div>

        <div className="mt-12">
          <PriceHistoryChart productId={product.id} />
        </div>
      </div>
    </div>
  );
}

function Perk({ icon, text }) {
  return (
    <div className="glass-card px-3 py-3 flex items-center gap-2 text-xs text-ink-2">
      <span className="text-accent">{icon}</span>
      {text}
    </div>
  );
}
