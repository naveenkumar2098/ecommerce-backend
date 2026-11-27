import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CART_KEY = 'ohm.cart';
const CartContext = createContext(null);

const load = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // Storage unavailable: the cart lives in memory only.
    }
  }, [items]);

  const add = useCallback((product, qty = 1) => {
    setItems((current) => {
      const found = current.find((i) => i.id === product._id);
      const max = product.stock;
      if (found) {
        return current.map((i) =>
          i.id === product._id ? { ...i, qty: Math.min(i.qty + qty, max), stock: max, price: product.price } : i
        );
      }
      return [
        ...current,
        { id: product._id, name: product.name, price: product.price, stock: max, qty: Math.min(qty, max) },
      ];
    });
  }, []);

  const setQty = useCallback((id, qty) => {
    setItems((current) =>
      current.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) } : i))
    );
  }, []);

  const remove = useCallback((id) => setItems((current) => current.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      add,
      setQty,
      remove,
      clear,
      count: items.reduce((n, i) => n + i.qty, 0),
      total: items.reduce((sum, i) => sum + i.price * i.qty, 0),
      qtyOf: (id) => items.find((i) => i.id === id)?.qty || 0,
    }),
    [items, add, setQty, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
