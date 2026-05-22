import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Package,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  X,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { LineSkeleton } from '../components/ui/LoadingSkeleton.jsx';
import { formatINR } from '../components/ui/ProductCard.jsx';

const STATUS_META = {
  PENDING: { color: 'text-warning', icon: <Clock size={14} />, label: 'Pending' },
  CONFIRMED: { color: 'text-accent', icon: <CheckCircle2 size={14} />, label: 'Confirmed' },
  PROCESSING: { color: 'text-accent', icon: <Package size={14} />, label: 'Processing' },
  SHIPPED: { color: 'text-accent', icon: <Truck size={14} />, label: 'Shipped' },
  DELIVERED: { color: 'text-success', icon: <CheckCircle2 size={14} />, label: 'Delivered' },
  CANCELLED: { color: 'text-danger', icon: <XCircle size={14} />, label: 'Cancelled' },
};

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const justPlaced = searchParams.get('placed');

  useEffect(() => {
    if (!user) return;
    api
      .get('/orders')
      .then((res) => setOrders(res.data.orders))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="bg-bg min-h-screen page-fade">
        <div className="container-page py-20 text-center flex flex-col items-center gap-4">
          <h1>Sign in to view your orders.</h1>
          <Link to="/login" className="glass-button-primary">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const cancel = async (id) => {
    if (!confirm('Cancel this order?')) return;
    try {
      await api.patch(`/orders/${id}/cancel`);
      setOrders((os) =>
        os.map((o) => (o.id === id ? { ...o, status: 'CANCELLED' } : o))
      );
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cancel failed');
    }
  };

  const downloadReceipt = async (id) => {
    setDownloading(id);
    try {
      const res = await api.get(`/orders/${id}/receipt.pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `techkart-${id.slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (err) {
      toast.error('Could not download receipt');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="bg-bg min-h-screen page-fade">
      <div className="container-page py-12">
        <span className="eyebrow">Order history</span>
        <h1 className="mt-2 mb-8">Your orders.</h1>

        {justPlaced && (
          <div className="glass-card p-4 mb-6 flex items-center justify-between !border-success/30 bg-success-bg">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 size={18} />
              <span className="text-sm">
                Order placed successfully — #{justPlaced.slice(0, 8)}
              </span>
            </div>
            <button
              onClick={() => {
                const next = new URLSearchParams(searchParams);
                next.delete('placed');
                setSearchParams(next);
              }}
              className="text-muted hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-3">
            <LineSkeleton height={120} />
            <LineSkeleton height={120} />
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-dashed border-line rounded-2xl p-20 text-center flex flex-col items-center gap-4">
            <Package size={40} className="text-faint" strokeWidth={1.5} />
            <h2 className="!text-xl">No orders yet.</h2>
            <Link to="/products" className="glass-button-primary">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((o) => {
              const meta = STATUS_META[o.status] || STATUS_META.PENDING;
              return (
                <article key={o.id} className="glass-card p-5">
                  <header className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="text-xs text-faint uppercase tracking-wider">
                        Order #{o.id.slice(0, 8)}
                        {o.placedByAgent && (
                          <span className="ml-2 text-accent">· Placed by AI Agent</span>
                        )}
                      </div>
                      <div className="text-sm text-muted mt-0.5">
                        {new Date(o.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1.5 text-sm ${meta.color}`}>
                        {meta.icon}
                        {meta.label}
                      </span>
                      <span className="text-lg font-semibold">
                        {formatINR(o.totalAmount)}
                      </span>
                    </div>
                  </header>
                  <div className="flex flex-col gap-2">
                    {o.items.map((i) => (
                      <div key={i.id} className="flex items-center gap-3 text-sm">
                        <img
                          src={i.product.imageUrl}
                          alt=""
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-md object-contain bg-surface-2"
                        />
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/products/${i.product.id}`}
                            className="hover:underline line-clamp-1"
                          >
                            {i.product.title}
                          </Link>
                          <div className="text-xs text-muted">
                            Qty: {i.quantity} · {formatINR(i.price)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end gap-3 items-center">
                    <button
                      onClick={() => downloadReceipt(o.id)}
                      disabled={downloading === o.id}
                      className="text-xs text-ink-2 hover:text-ink flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Download size={12} />
                      {downloading === o.id ? 'Generating…' : 'Receipt (PDF)'}
                    </button>
                    {['PENDING', 'CONFIRMED'].includes(o.status) && (
                      <button
                        onClick={() => cancel(o.id)}
                        className="text-xs text-danger hover:underline"
                      >
                        Cancel order
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
