import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, GitCompare, ShoppingBag, Check, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext.jsx';
import { useCompare } from '../../hooks/useCompare.js';
import { useWishlist } from '../../context/WishlistContext.jsx';

function formatINR(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n));
}

export default function ProductCard({ product, index = 0 }) {
  const { addItem } = useCart();
  const { addToCompare, isInCompare, removeFromCompare } = useCompare();
  const { isWishlisted, toggle: toggleWishlist } = useWishlist();
  const inCompare = isInCompare(product.id);
  const saved = isWishlisted(product.id);

  const discount =
    product.originalPrice && Number(product.originalPrice) > Number(product.price)
      ? Math.round(
          ((Number(product.originalPrice) - Number(product.price)) /
            Number(product.originalPrice)) *
            100
        )
      : 0;

  const handleCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) removeFromCompare(product.id);
    else addToCompare(product);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product.id, 1);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id, product.title);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="card-reveal"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <Link
        to={`/products/${product.id}`}
        className="group block bg-surface rounded-2xl p-2.5 border border-line-soft transition-[border-color,box-shadow] duration-300 hover:border-accent-ring hover:shadow-lg"
      >
        <div className="product-canvas relative w-full aspect-square rounded-xl flex items-center justify-center overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain p-5 transition-transform duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.08]"
            onError={(e) => {
              e.currentTarget.src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="%23f5f5f7" width="200" height="200"/><text x="50%25" y="50%25" fill="%23a1a1a6" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="14">No image</text></svg>';
            }}
          />
          {discount > 0 && (
            <span className="absolute top-3 left-3 price-badge">−{discount}%</span>
          )}
          {product.isFeatured && (
            <span className="absolute top-3 right-3 badge-featured">Featured</span>
          )}

          <button
            onClick={handleWishlist}
            aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            className={`absolute bottom-3 left-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 active:scale-90 ${
              saved
                ? 'bg-danger/10 text-danger border border-danger/30'
                : 'bg-surface/85 text-ink-2 opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 border border-line-soft hover:text-danger'
            }`}
          >
            <Heart size={13} className={saved ? 'fill-current' : ''} />
          </button>

          <button
            onClick={handleCompare}
            aria-label="Compare"
            title={inCompare ? 'Remove from compare' : 'Add to compare'}
            className={`absolute bottom-3 right-3 w-8 h-8 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 ease-out hover:scale-110 active:scale-90 ${
              inCompare
                ? 'bg-accent text-white'
                : 'bg-surface/85 text-ink-2 opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 border border-line-soft'
            }`}
          >
            {inCompare ? <Check size={13} /> : <GitCompare size={13} />}
          </button>
        </div>

        <div className="px-1.5 pt-3.5 pb-1.5 flex flex-col gap-1.5">
          {product.brand && (
            <span className="text-[11px] uppercase tracking-wider text-faint font-medium">
              {product.brand}
            </span>
          )}
          <h3 className="text-[14px] font-medium leading-snug line-clamp-2 min-h-[2.5em]">
            {product.title}
          </h3>
          <div className="flex items-center gap-1.5 text-[12px] text-muted mt-0.5">
            <Star size={11} className="fill-warning text-warning" strokeWidth={0} />
            <span className="text-ink-2 font-medium">
              {Number(product.rating || 0).toFixed(1)}
            </span>
            <span>·</span>
            <span>{product.reviewCount || 0} reviews</span>
          </div>
          <div className="flex items-baseline justify-between mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-[17px] font-semibold tracking-tight">
                {formatINR(product.price)}
              </span>
              {product.originalPrice &&
                Number(product.originalPrice) > Number(product.price) && (
                  <span className="text-[12px] text-faint line-through">
                    {formatINR(product.originalPrice)}
                  </span>
                )}
            </div>
            <motion.button
              onClick={handleAdd}
              aria-label="Add to cart"
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center shadow-[0_4px_12px_-3px_var(--accent-ring)]"
            >
              <ShoppingBag size={14} />
            </motion.button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export { formatINR };
