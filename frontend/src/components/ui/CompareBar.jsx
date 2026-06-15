import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, GitCompare } from 'lucide-react';
import { useCompare } from '../../hooks/useCompare.js';

export default function CompareBar() {
  const { compare, removeFromCompare, clearCompare } = useCompare();

  // Reserve page space while the bar is open so it never covers the footer.
  useEffect(() => {
    if (compare.length > 0) document.body.setAttribute('data-compare-open', '');
    else document.body.removeAttribute('data-compare-open');
    return () => document.body.removeAttribute('data-compare-open');
  }, [compare.length]);

  return (
    <AnimatePresence>
      {compare.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 18 }}
          className="fixed bottom-6 inset-x-0 mx-auto z-40 w-[min(94vw,860px)]"
        >
          <div className="glass-card !shadow-lg px-3 sm:px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-accent flex-shrink-0">
              <GitCompare size={16} />
              <span className="hidden sm:inline">Compare</span> ({compare.length}/4)
            </div>
            <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar min-w-0">
              {compare.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 bg-surface-2 border border-line-soft rounded-lg pl-1 pr-2 py-1 text-xs flex-shrink-0"
                >
                  <img
                    src={p.imageUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded object-contain product-canvas"
                  />
                  <span className="max-w-[100px] truncate">{p.title}</span>
                  <button
                    onClick={() => removeFromCompare(p.id)}
                    className="text-faint hover:text-ink"
                    aria-label="remove"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={clearCompare}
                className="text-xs text-muted hover:text-ink"
              >
                Clear
              </button>
              <Link
                to="/compare"
                className="glass-button-primary !py-1.5 !px-4 text-xs"
              >
                Compare →
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
