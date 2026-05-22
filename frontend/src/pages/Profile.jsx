import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Camera, Loader2 } from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '' });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  if (!user) {
    return (
      <div className="bg-bg min-h-screen page-fade">
        <div className="container-page py-20 text-center flex flex-col items-center gap-4">
          <h1>Sign in to view your profile.</h1>
          <Link to="/login" className="glass-button-primary">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.patch('/users/profile', { name: form.name });
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be 2 MB or smaller');
      return;
    }
    const formData = new FormData();
    formData.append('avatar', file);
    setUploading(true);
    try {
      const { data } = await api.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.user);
      toast.success('Avatar updated');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-bg min-h-screen page-fade">
      <div className="container-page py-12">
        <span className="eyebrow">Account</span>
        <h1 className="mt-2 mb-8">Your profile.</h1>

        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          <aside className="glass-card p-6 flex flex-col items-center gap-3 h-fit">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-surface-2 border border-line-soft flex items-center justify-center">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={36} className="text-faint" strokeWidth={1.5} />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                aria-label="Change avatar"
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-ink text-bg flex items-center justify-center shadow-md hover:opacity-90 transition disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Camera size={14} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div className="text-center mt-2">
              <div className="font-medium text-lg">{user.name}</div>
              <div className="text-xs text-muted">{user.email}</div>
              <div className="inline-block mt-3 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-accent-soft text-accent">
                {user.role}
              </div>
            </div>
            <p className="text-[11px] text-faint text-center mt-1 leading-relaxed">
              JPEG, PNG, WEBP or GIF · up to 2 MB
            </p>
          </aside>

          <form onSubmit={handleSave} className="glass-card p-6 flex flex-col gap-4">
            <h2 className="!text-xl">Edit details</h2>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-wider text-faint">Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="glass-input"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs uppercase tracking-wider text-faint">Email</span>
              <input value={user.email} className="glass-input opacity-60" disabled />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="glass-button-primary self-start mt-2"
            >
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
