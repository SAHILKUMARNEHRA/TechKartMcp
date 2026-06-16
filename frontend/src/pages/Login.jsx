import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Zap, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectMessage = location.state?.message;
  const from = location.state?.from || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null); // { message, code }

  // Surface the reason the user was sent here (e.g. tried to add to cart).
  useEffect(() => {
    if (redirectMessage) toast(redirectMessage, { icon: '🔒' });
  }, [redirectMessage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      const message =
        data?.error ||
        (err.response?.status >= 500
          ? 'Server error — please try again in a moment.'
          : 'Could not sign you in. Please try again.');
      setError({ message, code: data?.code });
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  return (
    <div className="water-bg min-h-screen flex items-center justify-center px-4 py-16">
      <div className="glass-card p-8 w-full max-w-md flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2">
          <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
            <Zap size={22} className="text-white" />
          </span>
          <h1 className="text-2xl font-semibold gradient-text">Welcome back</h1>
          <p className="text-sm text-muted">Sign in to your TechKart account</p>
        </div>

        {redirectMessage && !error && (
          <div className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
            <Lock size={16} className="shrink-0" />
            <span>{redirectMessage} to continue.</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p>{error.message}</p>
              {error.code === 'NO_ACCOUNT' && (
                <Link
                  to="/register"
                  state={{ email: form.email }}
                  className="inline-block mt-1 font-medium underline"
                >
                  Create an account →
                </Link>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-faint">Email</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="glass-input"
              placeholder="you@example.com"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs uppercase tracking-wider text-faint">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="glass-input"
              placeholder="••••••••"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="glass-button-primary w-full mt-2"
          >
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="divider" />

        <a
          href={`${apiBase}/auth/google`}
          className="glass-button-ghost w-full text-center flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 48 48">
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.2 0-9.6-3.3-11.3-8L6.3 33.3C9.6 39.7 16.3 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.6l6.2 5.2C40.3 35.8 44 30.4 44 24c0-1.3-.1-2.4-.4-3.5z"
            />
          </svg>
          Continue with Google
        </a>

        <p className="text-center text-sm text-muted">
          New to TechKart?{' '}
          <Link to="/register" className="text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
