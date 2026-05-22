import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be 8+ characters');
    setBusy(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="water-bg min-h-screen flex items-center justify-center px-4 py-16">
      <div className="glass-card p-8 w-full max-w-md flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2">
          <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center">
            <Zap size={22} className="text-white" />
          </span>
          <h1 className="text-2xl font-semibold gradient-text">Create your account</h1>
          <p className="text-sm text-muted">Join TechKart and shop smarter.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Field
            label="Full Name"
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(v) => setForm({ ...form, email: v })}
          />
          <Field
            label="Password (min 8 chars)"
            type="password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            minLength={8}
          />
          <button
            type="submit"
            disabled={busy}
            className="glass-button-primary w-full mt-2"
          >
            {busy ? 'Creating…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', minLength }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wider text-faint">{label}</span>
      <input
        type={type}
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input"
      />
    </label>
  );
}
