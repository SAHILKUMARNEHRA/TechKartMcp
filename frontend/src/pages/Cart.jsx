import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatINR } from '../components/ui/ProductCard.jsx';

export default function Cart() {
  const { items, total, itemCount, updateItem, removeItem, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="water-bg min-h-screen">
        <div className="container-page py-20 text-center flex flex-col items-center gap-4">
          <ShoppingCart size={48} className="text-faint" />
          <h1 className="text-3xl font-semibold">Sign in to view your cart</h1>
          <Link to="/login" className="glass-button-primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <div className="water-bg min-h-screen">
        <div className="container-page py-20 text-center flex flex-col items-center gap-4">
          <ShoppingCart size={48} className="text-faint" />
          <h1 className="text-3xl font-semibold">Your cart is empty</h1>
          <p className="text-muted">Let's find you something great.</p>
          <Link to="/products" className="glass-button-primary">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  const shipping = total > 50000 ? 0 : 99;
  const tax = Math.round(total * 0.18);
  const grand = total + shipping + tax;

  return (
    <div className="water-bg min-h-screen">
      <div className="container-page py-10">
        <h1 className="text-3xl font-semibold gradient-text mb-1">Your Cart</h1>
        <p className="text-sm text-muted mb-8">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="glass-card p-4 flex gap-4 items-center"
              >
                <Link
                  to={`/products/${item.product.id}`}
                  className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-surface-2 flex items-center justify-center"
                >
                  <img
                    src={item.product.imageUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain p-2"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${item.product.id}`}
                    className="font-medium line-clamp-2 hover:underline"
                  >
                    {item.product.title}
                  </Link>
                  <div className="text-sm text-muted mt-1">
                    {formatINR(item.product.price)} each
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center bg-surface-2 border border-line-soft rounded-lg">
                      <button
                        className="w-8 h-8 flex items-center justify-center"
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <button
                        className="w-8 h-8 flex items-center justify-center"
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-faint hover:text-red-400 text-sm flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>
                </div>
                <div className="text-lg font-semibold whitespace-nowrap">
                  {formatINR(Number(item.product.price) * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <aside className="glass-card p-6 h-fit lg:sticky lg:top-24 flex flex-col gap-4">
            <h3 className="text-lg font-semibold">Order Summary</h3>
            <div className="flex flex-col gap-2 text-sm">
              <Row label={`Subtotal (${itemCount} items)`} value={formatINR(total)} />
              <Row
                label="Shipping"
                value={shipping === 0 ? 'Free' : formatINR(shipping)}
              />
              <Row label="Tax (18% GST)" value={formatINR(tax)} />
            </div>
            <div className="divider" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatINR(grand)}</span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="glass-button-primary w-full mt-2"
            >
              Proceed to Checkout
            </button>
            <Link
              to="/products"
              className="text-center text-sm text-muted hover:text-ink"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-ink-2">
      <span>{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
