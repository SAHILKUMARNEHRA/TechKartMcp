import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import api, { setAccessToken } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { updateUser } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      navigate('/login?error=oauth_failed');
      return;
    }
    setAccessToken(token);
    api
      .get('/auth/me')
      .then((res) => {
        updateUser(res.data.user);
        navigate('/');
      })
      .catch(() => navigate('/login?error=oauth_failed'));
  }, [params, navigate, updateUser]);

  return (
    <div className="water-bg min-h-screen flex items-center justify-center">
      <div className="glass-card p-10 flex items-center gap-3">
        <Loader2 className="animate-spin text-accent" size={20} />
        <span>Completing sign-in…</span>
      </div>
    </div>
  );
}
