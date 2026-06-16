import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  ShoppingBag,
  User,
  LogOut,
  Menu,
  X,
  Bot,
  Sun,
  Moon,
  Heart,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useWishlist } from '../../context/WishlistContext.jsx';
import { useStore } from '../../store/useStore.js';
import api from '../../services/api.js';
import { formatINR } from '../ui/ProductCard.jsx';

export default function Navbar() {
  const { user, logout, loading: authLoading } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const { count: wishlistCount } = useWishlist();
  const cartCount = useStore((s) => s.cartCount);
  const toggleAgent = useStore((s) => s.toggleAgent);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Elevate the nav once the user scrolls past the hero edge.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Live search suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [sugLoading, setSugLoading] = useState(false);
  const [sugOpen, setSugOpen] = useState(false);
  const [activeSugIndex, setActiveSugIndex] = useState(-1);
  const searchBoxRef = useRef(null);

  useEffect(() => {
    if (!sugOpen) return;
    const handler = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setSugOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sugOpen]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setSugLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      api
        .get('/products', {
          params: { q, limit: 6 },
          signal: ctrl.signal,
        })
        .then((res) => {
          setSuggestions(res.data.products || []);
          setSugLoading(false);
          setActiveSugIndex(-1);
        })
        .catch(() => setSugLoading(false));
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (activeSugIndex >= 0 && suggestions[activeSugIndex]) {
      goToProduct(suggestions[activeSugIndex].id);
      return;
    }
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products');
    closeSearch();
  };

  const closeSearch = () => {
    setSugOpen(false);
    setMenuOpen(false);
  };

  const goToProduct = (id) => {
    setQuery('');
    closeSearch();
    navigate(`/products/${id}`);
  };

  const onKeyDown = (e) => {
    if (!sugOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSugIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSugIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setSugOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setProfileOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 px-3 sm:px-4 pt-3">
      <div
        className={`liquid-glass max-w-[1200px] mx-auto flex items-center h-14 gap-5 px-4 sm:px-5 rounded-[22px] ${
          scrolled ? 'is-scrolled' : ''
        }`}
      >
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-base group"
        >
          <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white transition-transform duration-300 group-hover:rotate-[12deg] group-hover:scale-110">
            <Zap size={15} className="fill-current" />
          </span>
          <span className="font-display tracking-tight">TechKart</span>
        </Link>

        <DockNav />

        <form
          ref={searchBoxRef}
          onSubmit={handleSearch}
          className="hidden lg:block flex-1 max-w-sm ml-auto relative"
        >
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSugOpen(true);
              }}
              onFocus={() => setSugOpen(true)}
              onKeyDown={onKeyDown}
              placeholder="Search"
              className="glass-input !h-9 !pl-9 !py-0 !text-sm"
            />
          </div>

          {sugOpen && query.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-card !rounded-xl overflow-hidden z-50">
              {sugLoading && suggestions.length === 0 ? (
                <div className="p-3 text-xs text-muted">Searching…</div>
              ) : suggestions.length === 0 ? (
                <div className="p-3 text-xs text-muted">No results.</div>
              ) : (
                <ul className="py-1 max-h-[400px] overflow-y-auto">
                  {suggestions.map((p, idx) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setActiveSugIndex(idx)}
                        onClick={() => goToProduct(p.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left ${
                          activeSugIndex === idx ? 'bg-surface-2' : ''
                        }`}
                      >
                        <img
                          src={p.imageUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-md object-contain bg-surface-2 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] truncate">{p.title}</div>
                          <div className="text-[11px] text-muted">
                            {formatINR(p.price)} · ⭐ {Number(p.rating || 0).toFixed(1)}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                  <li className="border-t border-line-soft mt-1 pt-1">
                    <button
                      type="submit"
                      className="w-full text-left px-3 py-2 text-[12px] text-accent hover:bg-surface-2 flex items-center gap-2"
                    >
                      <Search size={12} /> See all results for "{query.trim()}"
                    </button>
                  </li>
                </ul>
              )}
            </div>
          )}
        </form>

        <div className="flex items-center gap-1 ml-auto lg:ml-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            className="w-9 h-9 rounded-full flex items-center justify-center text-ink-2 hover:bg-surface-2 transition-transform duration-300 hover:rotate-45 active:scale-90"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={toggleAgent}
            aria-label="Shopping assistant"
            title="Shopping assistant"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-accent text-white agent-pulse"
          >
            <Bot size={16} />
          </button>

          <Link
            to="/wishlist"
            className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-2 transition"
            aria-label="Wishlist"
          >
            <Heart size={16} />
            {wishlistCount > 0 && (
              <span
                key={wishlistCount}
                className="badge-pop absolute -top-0.5 -right-0.5 bg-danger text-white text-[10px] font-semibold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1"
              >
                {wishlistCount}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-2 transition"
            aria-label="Cart"
          >
            <ShoppingBag size={16} />
            {cartCount > 0 && (
              <span
                key={cartCount}
                className="badge-pop absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-semibold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1"
              >
                {cartCount}
              </span>
            )}
          </Link>

          {authLoading ? (
            <div className="w-9 h-9 rounded-full bg-surface-2 animate-pulse" />
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-2 transition overflow-hidden"
                aria-label="Profile"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={16} />
                )}
              </button>
              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 glass-card p-2 z-40"
                  onMouseLeave={() => setProfileOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-line-soft mb-1">
                    <div className="text-sm font-medium">{user.name}</div>
                    <div className="text-xs text-muted truncate">{user.email}</div>
                  </div>
                  <DropLink to="/profile" icon={<User size={14} />} onClick={() => setProfileOpen(false)}>Profile</DropLink>
                  <DropLink to="/orders" icon={<ShoppingBag size={14} />} onClick={() => setProfileOpen(false)}>Orders</DropLink>
                  <DropLink to="/wishlist" icon={<Heart size={14} />} onClick={() => setProfileOpen(false)}>Wishlist</DropLink>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-surface-2 text-sm text-danger"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1 ml-1">
              <Link
                to="/login"
                className="h-9 inline-flex items-center px-3 text-[13px] text-ink-2 hover:text-ink transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="glass-button-primary !h-9 !py-0 !px-4 !text-[13px]"
              >
                Sign up
              </Link>
            </div>
          )}

          <button
            className="md:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-surface-2"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="menu"
          >
            {menuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden liquid-glass rounded-2xl mt-2 px-5 py-4 flex flex-col gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="glass-input !pl-9"
            />
          </form>
          <div className="flex flex-col gap-1 text-sm">
            <NavLink to="/products" onClick={() => setMenuOpen(false)} className={navLinkCls}>Shop</NavLink>
            <NavLink to="/wishlist" onClick={() => setMenuOpen(false)} className={navLinkCls}>Wishlist</NavLink>
            <NavLink to="/compare" onClick={() => setMenuOpen(false)} className={navLinkCls}>Compare</NavLink>
            {user ? (
              <>
                <NavLink to="/orders" onClick={() => setMenuOpen(false)} className={navLinkCls}>Orders</NavLink>
                <NavLink to="/profile" onClick={() => setMenuOpen(false)} className={navLinkCls}>Profile</NavLink>
                <button onClick={handleLogout} className="text-left px-3 py-2 rounded-md text-danger">
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={() => setMenuOpen(false)} className={navLinkCls}>Sign in</NavLink>
                <NavLink to="/register" onClick={() => setMenuOpen(false)} className={navLinkCls}>Sign up</NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function DropLink({ to, icon, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-surface-2 text-sm"
    >
      {icon} {children}
    </Link>
  );
}

function navLinkCls({ isActive }) {
  return `nav-link${isActive ? ' is-active' : ''}`;
}

const NAV_ITEMS = [
  { to: '/products', label: 'Shop' },
  { to: '/products?category=laptops', label: 'Mac' },
  { to: '/products?category=smartphones', label: 'Phone' },
  { to: '/products?category=audio', label: 'Audio' },
  { to: '/compare', label: 'Compare' },
];

// Which nav item matches the current route (handles ?category= params).
function isNavActive(item, location) {
  const url = new URL(item.to, 'http://x');
  if (location.pathname !== url.pathname) return false;
  const itemCat = url.searchParams.get('category');
  const curCat = new URLSearchParams(location.search).get('category');
  return itemCat ? curCat === itemCat : !curCat;
}

// Apple-Music-style nav: a frosted "liquid glass" pill slides between items
// (follows hover, rests on the active category) via a shared layout animation.
function DockNav() {
  const location = useLocation();
  const [hovered, setHovered] = useState(null);
  const activeIndex = NAV_ITEMS.findIndex((it) => isNavActive(it, location));
  const pillIndex = hovered !== null ? hovered : activeIndex;

  return (
    <nav
      className="hidden md:flex items-center gap-0.5"
      onMouseLeave={() => setHovered(null)}
    >
      {NAV_ITEMS.map((item, i) => (
        <NavLink
          key={item.to}
          to={item.to}
          onMouseEnter={() => setHovered(i)}
          className={`nav-dock-link${i === activeIndex ? ' is-active' : ''}`}
        >
          {pillIndex === i && (
            <motion.span
              layoutId="nav-pill"
              className="nav-dock-pill"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <span className="relative z-10">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
