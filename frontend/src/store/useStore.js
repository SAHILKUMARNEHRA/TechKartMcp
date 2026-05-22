import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      compare: [],
      addToCompare: (product) => {
        const { compare } = get();
        if (compare.find((p) => p.id === product.id)) return;
        if (compare.length >= 4) return;
        set({ compare: [...compare, product] });
      },
      removeFromCompare: (id) =>
        set({ compare: get().compare.filter((p) => p.id !== id) }),
      clearCompare: () => set({ compare: [] }),
      isInCompare: (id) => !!get().compare.find((p) => p.id === id),

      cartCount: 0,
      cartTotal: 0,
      setCartSummary: (count, total) => set({ cartCount: count, cartTotal: total }),

      agentOpen: false,
      toggleAgent: () => set({ agentOpen: !get().agentOpen }),
      setAgentOpen: (v) => set({ agentOpen: v }),
    }),
    {
      name: 'techkart-store',
      partialize: (s) => ({ compare: s.compare }),
    }
  )
);
