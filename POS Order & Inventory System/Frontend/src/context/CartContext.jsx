import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);
export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const addItem = product => setItems(current => {
    const existing = current.find(item => item._id === product._id);
    return existing ? current.map(item => item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }];
  });
  const removeItem = id => setItems(current => current.filter(item => item._id !== id));
  const setQuantity = (id, quantity) => setItems(current => current.map(item => item._id === id ? { ...item, quantity } : item));
  return <CartContext.Provider value={{ items, addItem, removeItem, setQuantity, clear: () => setItems([]), count: items.reduce((sum, item) => sum + item.quantity, 0) }}>{children}</CartContext.Provider>;
};
export const useCart = () => useContext(CartContext);