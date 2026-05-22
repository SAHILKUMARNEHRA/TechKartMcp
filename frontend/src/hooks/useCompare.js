import { useStore } from '../store/useStore.js';

export function useCompare() {
  const compare = useStore((s) => s.compare);
  const addToCompare = useStore((s) => s.addToCompare);
  const removeFromCompare = useStore((s) => s.removeFromCompare);
  const clearCompare = useStore((s) => s.clearCompare);
  const isInCompare = useStore((s) => s.isInCompare);
  return { compare, addToCompare, removeFromCompare, clearCompare, isInCompare };
}
