import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.get('/wishlist');
      setItems(data.items);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isWishlisted = (productId) =>
    items.some((i) => i.productId === productId);

  const toggle = async (productId, productTitle = '') => {
    if (!user) {
      const message = 'Please log in to save favorites';
      toast.error(message);
      navigate('/login', {
        state: { from: location.pathname + location.search, message },
      });
      return false;
    }
    try {
      if (isWishlisted(productId)) {
        await api.delete(`/wishlist/${productId}`);
        setItems((items) => items.filter((i) => i.productId !== productId));
        toast.success(productTitle ? `Removed "${productTitle.slice(0, 24)}..."` : 'Removed');
      } else {
        await api.post('/wishlist', { productId });
        toast.success('Saved');
        refresh();
      }
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not update wishlist');
      return false;
    }
  };

  return (
    <WishlistContext.Provider
      value={{ items, count: items.length, loading, isWishlisted, toggle, refresh }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
