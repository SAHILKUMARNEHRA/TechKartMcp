import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CreditCard, Wallet, Banknote, Lock } from 'lucide-react';
import api from '../services/api.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatINR } from '../components/ui/ProductCard.jsx';

const PAYMENT_METHODS = [
  { value: 'COD', label: 'Cash on Delivery', icon: <Banknote size={16} /> },
  { value: 'UPI', label: 'UPI / Wallet', icon: <Wallet size={16} /> },
  { value: 'CARD', label: 'Credit / Debit Card', icon: <CreditCard size={16} /> },
];

export default function Checkout() {
  const { items, total, refresh } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: user?.name || '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const shipping = total > 50000 ? 0 : 99;
  const tax = Math.round(total * 0.18);
  const grand = total + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="water-bg min-h-screen">
        <div className="container-page py-20 text-center flex flex-col items-center gap-4">
          <h1 className="text-2xl font-semibold">Your cart is empty</h1>
          <Link to="/products" className="glass-button-primary">
            Browse products
          </Link>
        </div>
      </div>
    );
  }

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(form.pincode))
      return toast.error('Pincode must be 6 digits');
    if (!/^\d{10}$/.test(form.phone))
      return toast.error('Phone must be 10 digits');
    if (!form.fullName || !form.street || !form.city || !form.state)
      return toast.error('Please fill all address fields');

    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        shippingAddr: form,
        paymentMethod,
        notes,
      });
      await refresh();
      toast.success('Order placed!');
      navigate(`/orders?placed=${data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="water-bg min-h-screen">
      <div className="container-page py-10">
        <h1 className="text-3xl font-semibold gradient-text mb-8">Checkout</h1>
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="flex flex-col gap-6">
            <section className="glass-card p-6 flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Shipping Address</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Full Name" value={form.fullName} onChange={update('fullName')} />
                <Field
                  label="Phone (10 digits)"
                  value={form.phone}
                  onChange={update('phone')}
                  maxLength={10}
                />
                <div className="sm:col-span-2">
                  <Field label="Street Address" value={form.street} onChange={update('street')} />
                </div>
                <Field label="City" value={form.city} onChange={update('city')} />
                <Field label="State" value={form.state} onChange={update('state')} />
                <Field
                  label="Pincode (6 digits)"
                  value={form.pincode}
                  onChange={update('pincode')}
                  maxLength={6}
                />
              </div>
            </section>

            <section className="glass-card p-6 flex flex-col gap-4">
              <h2 className="text-lg font-semibold">Payment Method</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((m) => (
                  <label
                    key={m.value}
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition ${
                      paymentMethod === m.value
                        ? 'border-accent bg-accent-soft'
                        : 'border-line-soft bg-surface-2 hover:bg-surface-3'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === m.value}
                      onChange={() => setPaymentMethod(m.value)}
                      className="hidden"
                    />
                    <span className="text-accent">{m.icon}</span>
                    <span className="text-sm">{m.label}</span>
                  </label>
                ))}
              </div>
            </section>

            <section className="glass-card p-6 flex flex-col gap-3">
              <h2 className="text-lg font-semibold">Order Notes (optional)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any special delivery instructions…"
                className="glass-input"
              />
            </section>
          </div>

          <aside className="glass-card p-6 h-fit lg:sticky lg:top-24 flex flex-col gap-4">
            <h2 className="text-lg font-semibold">Summary</h2>
            <div className="flex flex-col gap-2 text-sm max-h-56 overflow-y-auto">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between text-ink-2">
                  <span className="truncate pr-2">
                    {i.product.title} × {i.quantity}
                  </span>
                  <span className="whitespace-nowrap">
                    {formatINR(Number(i.product.price) * i.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="divider" />
            <Row label="Subtotal" value={formatINR(total)} />
            <Row label="Shipping" value={shipping === 0 ? 'Free' : formatINR(shipping)} />
            <Row label="Tax (18%)" value={formatINR(tax)} />
            <div className="divider" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>{formatINR(grand)}</span>
            </div>
            <button
              type="submit"
              disabled={placing}
              className="glass-button-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              <Lock size={14} />
              {placing ? 'Placing order…' : 'Place Order'}
            </button>
            <p className="text-xs text-faint text-center">
              By placing the order you agree to TechKart Terms & Conditions.
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wider text-faint">{label}</span>
      <input className="glass-input" required {...props} />
    </label>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm text-ink-2">
      <span>{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  );
}
