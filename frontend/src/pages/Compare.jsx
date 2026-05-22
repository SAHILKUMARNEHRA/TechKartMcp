import { Link } from 'react-router-dom';
import { GitCompare, X, Star } from 'lucide-react';
import { useCompare } from '../hooks/useCompare.js';
import { formatINR } from '../components/ui/ProductCard.jsx';

export default function Compare() {
  const { compare, removeFromCompare, clearCompare } = useCompare();

  if (compare.length === 0) {
    return (
      <div className="water-bg min-h-screen">
        <div className="container-page py-20 flex flex-col items-center text-center gap-4">
          <GitCompare size={48} className="text-faint" />
          <h1 className="text-3xl font-semibold">Nothing to compare yet</h1>
          <p className="text-muted max-w-md">
            Add 2 to 4 products to your compare list from any product card or detail page.
          </p>
          <Link to="/products" className="glass-button-primary mt-4">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  const allSpecKeys = Array.from(
    new Set(compare.flatMap((p) => Object.keys(p.specs || {})))
  );

  const best = compare.reduce((b, p) =>
    Number(p.rating || 0) / Number(p.price || 1) > Number(b.rating || 0) / Number(b.price || 1)
      ? p
      : b
  );

  return (
    <div className="water-bg min-h-screen">
      <div className="container-page py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold gradient-text">Compare</h1>
          <button
            onClick={clearCompare}
            className="glass-button-ghost !py-2 !px-4 text-sm"
          >
            Clear all
          </button>
        </div>

        <div className="overflow-x-auto pb-4">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="text-left text-xs uppercase tracking-wider text-faint p-3 w-40">
                  &nbsp;
                </th>
                {compare.map((p) => (
                  <th key={p.id} className="p-3 align-top min-w-[220px]">
                    <div className="glass-card p-4 flex flex-col gap-3 relative">
                      <button
                        onClick={() => removeFromCompare(p.id)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-md bg-surface-2 hover:bg-surface-3 flex items-center justify-center"
                      >
                        <X size={12} />
                      </button>
                      {best.id === p.id && (
                        <span className="self-start text-[10px] uppercase tracking-wider price-badge">
                          ✓ Best value
                        </span>
                      )}
                      <img
                        src={p.imageUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-full aspect-square object-contain bg-surface-2 rounded-lg p-3"
                      />
                      <Link
                        to={`/products/${p.id}`}
                        className="font-medium text-sm hover:underline line-clamp-2 text-left"
                      >
                        {p.title}
                      </Link>
                      <div className="text-lg font-semibold">{formatINR(p.price)}</div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <Row label="Brand" values={compare.map((p) => p.brand || '—')} />
              <Row
                label="Rating"
                values={compare.map((p) => (
                  <span className="flex items-center gap-1 text-sm">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    {Number(p.rating || 0).toFixed(1)}
                  </span>
                ))}
              />
              <Row label="Reviews" values={compare.map((p) => p.reviewCount || 0)} />
              <Row label="Stock" values={compare.map((p) => p.stock)} />
              <Row label="Category" values={compare.map((p) => p.category)} />
              {allSpecKeys.map((k) => (
                <Row
                  key={k}
                  label={k.replace(/([A-Z])/g, ' $1')}
                  values={compare.map((p) =>
                    p.specs && p.specs[k] !== undefined ? String(p.specs[k]) : '—'
                  )}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Row({ label, values }) {
  return (
    <tr className="border-t border-line-soft">
      <td className="text-xs uppercase tracking-wider text-faint p-3 capitalize align-top">
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} className="text-sm p-3 align-top text-ink-2">
          {v}
        </td>
      ))}
    </tr>
  );
}
