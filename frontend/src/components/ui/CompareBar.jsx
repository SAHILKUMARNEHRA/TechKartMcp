import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, GitCompare } from 'lucide-react';
import { useCompare } from '../../hooks/useCompare.js';

export default function CompareBar() {
  const { compare, removeFromCompare, clearCompare } = useCompare();
  return (
    <AnimatePresence>
      {compare.length > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', damping: 18 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(96vw,800px)]"
        >
          <div className="glass-card px-4 py-3 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium text-accent">
              <GitCompare size={16} />
              Compare ({compare.length}/4)
            </div>
            <div className="flex-1 flex items-center gap-2 overflow-x-auto">
              {compare.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 bg-surface-2 border border-line-soft rounded-lg pl-1 pr-2 py-1 text-xs flex-shrink-0"
                >
                  <img
                    src={p.imageUrl}
                    alt=""
                    className="w-8 h-8 rounded object-contain bg-surface-2"
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
            <div className="flex items-center gap-2">
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
