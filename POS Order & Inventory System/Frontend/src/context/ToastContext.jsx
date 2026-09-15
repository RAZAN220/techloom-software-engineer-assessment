import { createContext, useContext, useState } from 'react';

const ToastContext = createContext(null);
export const ToastProvider = ({ children }) => {
  const [message, setMessage] = useState('');
  const toast = value => { setMessage(value); setTimeout(() => setMessage(''), 2600); };
  return <ToastContext.Provider value={toast}>{children}{message && <div className="toast">{message}</div>}</ToastContext.Provider>;
};
export const useToast = () => useContext(ToastContext);