import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api.js';
import { useAuth } from './AuthContext.jsx';
import { useStore } from '../store/useStore.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const setCartSummary = useStore((s) => s.setCartSummary);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      setTotal(0);
      setItemCount(0);
      setCartSummary(0, 0);
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.get('/cart');
      setItems(data.items);
      setTotal(data.total);
      setItemCount(data.itemCount);
      setCartSummary(data.itemCount, data.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user, setCartSummary]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = async (productId, quantity = 1) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return false;
    }
    try {
      await api.post('/cart', { productId, quantity });
      toast.success('Added to cart');
      refresh();
      return true;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add');
      return false;
    }
  };

  const updateItem = async (id, quantity) => {
    try {
      await api.patch(`/cart/${id}`, { quantity });
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    }
  };

  const removeItem = async (id) => {
    try {
      await api.delete(`/cart/${id}`);
      toast.success('Removed');
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Remove failed');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      refresh();
    } catch {}
  };

  return (
    <CartContext.Provider
      value={{ items, total, itemCount, loading, addItem, updateItem, removeItem, clearCart, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
