import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, ChevronDown, Loader2 } from 'lucide-react';
import api from '../services/api.js';
import ProductCard from '../components/ui/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/ui/LoadingSkeleton.jsx';

const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

const PAGE_SIZE = 12;

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('minRating') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const sentinelRef = useRef(null);

  const buildParams = useCallback(
    (pageNum) => {
      const p = { limit: PAGE_SIZE, page: pageNum };
      if (q) p.q = q;
      if (category) p.category = category;
      if (sort) p.sort = sort;
      if (minPrice) p.minPrice = minPrice;
      if (maxPrice) p.maxPrice = maxPrice;
      if (minRating) p.minRating = minRating;
      return p;
    },
    [q, category, sort, minPrice, maxPrice, minRating]
  );

  // Reset & fetch first page whenever filters change
  useEffect(() => {
    let cancelled = false;
    setInitialLoading(true);
    setProducts([]);
    setPage(1);
    api
      .get('/products', { params: buildParams(1) })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data.products);
        setCategories(res.data.categories || []);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setTotal(0);
        }
      })
      .finally(() => !cancelled && setInitialLoading(false));
    return () => {
      cancelled = true;
    };
  }, [buildParams]);

  // Infinite scroll: when sentinel hits viewport, fetch next page
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (initialLoading) return;
    if (page >= totalPages) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore) {
          const next = page + 1;
          setLoadingMore(true);
          api
            .get('/products', { params: buildParams(next) })
            .then((res) => {
              setProducts((curr) => [...curr, ...res.data.products]);
              setPage(next);
            })
            .catch(() => {})
            .finally(() => setLoadingMore(false));
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [page, totalPages, initialLoading, loadingMore, buildParams]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(searchParams);
    if (v == null || v === '') next.delete(k);
    else next.set(k, v);
    setSearchParams(next);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    setSearchParams(next);
  };

  const activeCount = [category, minPrice, maxPrice, minRating].filter(Boolean).length;

  return (
    <div className="bg-bg min-h-screen page-fade">
      <div className="container-page py-12">
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <div>
            {q ? (
              <span className="eyebrow">Results for "{q}"</span>
            ) : category ? (
              <span className="eyebrow">{cap(category)}</span>
            ) : (
              <span className="eyebrow">All products</span>
            )}
            <h1 className="mt-2 !text-4xl">
              {q
                ? `"${q}"`
                : category
                  ? cap(category)
                  : 'The whole catalog.'}
            </h1>
          </div>
          <p className="text-sm text-muted">
            {initialLoading ? '…' : `${total} items`}
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 my-6 flex-wrap">
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className="glass-button-ghost flex items-center gap-2 text-sm md:hidden"
          >
            <Filter size={14} />
            Filters {activeCount > 0 && `(${activeCount})`}
          </button>

          <div className="relative ml-auto">
            <select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="glass-input appearance-none pr-9 text-sm"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value} className="bg-surface">
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
          <aside
            className={`${
              filtersOpen ? 'block' : 'hidden'
            } md:block glass-card p-5 h-fit md:sticky md:top-24`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">Filters</h3>
              {activeCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-muted hover:text-ink flex items-center gap-1"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            <FilterGroup label="Category">
              {categories.map((c) => (
                <button
                  key={c.name}
                  onClick={() =>
                    setParam('category', c.name === category ? '' : c.name)
                  }
                  className={`flex items-center justify-between w-full text-left px-2 py-1.5 rounded-lg text-xs ${
                    c.name === category
                      ? 'bg-accent-soft text-accent'
                      : 'text-ink-2 hover:bg-surface-2'
                  }`}
                >
                  <span className="capitalize">{c.name}</span>
                  <span className="text-faint">{c.count}</span>
                </button>
              ))}
            </FilterGroup>

            <FilterGroup label="Price (₹)">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setParam('minPrice', e.target.value)}
                  className="glass-input text-xs !py-2"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setParam('maxPrice', e.target.value)}
                  className="glass-input text-xs !py-2"
                />
              </div>
            </FilterGroup>

            <FilterGroup label="Min Rating">
              <div className="flex gap-1.5 flex-wrap">
                {[4, 4.5, 4.7].map((r) => (
                  <button
                    key={r}
                    onClick={() =>
                      setParam('minRating', String(r) === minRating ? '' : String(r))
                    }
                    className={`text-xs px-2.5 py-1 rounded-md border ${
                      String(r) === minRating
                        ? 'bg-accent-soft border-accent text-accent'
                        : 'border-line-soft text-ink-2'
                    }`}
                  >
                    ≥ {r}★
                  </button>
                ))}
              </div>
            </FilterGroup>
          </aside>

          <div>
            {initialLoading ? (
              <ProductGridSkeleton />
            ) : products.length === 0 ? (
              <div className="glass-card p-16 text-center text-muted">
                No products match these filters.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {products.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i % PAGE_SIZE} />
                  ))}
                </div>

                <div
                  ref={sentinelRef}
                  className="h-12 flex items-center justify-center mt-8"
                >
                  {loadingMore ? (
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <Loader2 size={14} className="animate-spin" />
                      Loading more…
                    </div>
                  ) : page >= totalPages ? (
                    <span className="text-xs text-faint">
                      End of results · {total} {total === 1 ? 'item' : 'items'}
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div className="mb-5 flex flex-col gap-2">
      <h4 className="text-xs uppercase tracking-wider text-faint">{label}</h4>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
