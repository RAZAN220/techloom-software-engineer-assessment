const rawBase = process.env.REACT_APP_API_URL;
if (!rawBase) throw new Error('REACT_APP_API_URL is not set. Add it to your Vercel environment variables.');
const API_BASE_URL = rawBase.replace(/\/$/, '');
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const api = async (path, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });

    const text = await response.text();
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`Server returned unexpected response (${response.status} ${response.statusText})`);
    }

    if (!response.ok) throw new Error(body.message || `Request failed with status ${response.status}`);
    return body;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(`Cannot connect to the backend at ${API_URL}. Check that the backend is running.`);
    }
    throw error;
  }
};

export const getProducts = () => api('/products');
export const createProduct = product => api('/products', { method: 'POST', body: JSON.stringify(product) });
export const deleteProduct = productId => api(`/products/${productId}`, { method: 'DELETE' });
export const updateProduct = (productId, product) => api(`/products/${productId}`, { method: 'PUT', body: JSON.stringify(product) });
export const getStock = () => api('/products/stock');
export const createCart = () => api('/carts', { method: 'POST' });
export const addCartItem = (cartId, item) => api(`/carts/${cartId}/items`, { method: 'POST', body: JSON.stringify(item) });
export const updateCartItem = (cartId, productId, quantity) => api(`/carts/${cartId}/items/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
export const removeCartItem = (cartId, productId) => api(`/carts/${cartId}/items/${productId}`, { method: 'DELETE' });
export const clearCart = cartId => api(`/carts/${cartId}/items`, { method: 'DELETE' });
export const createOrder = (cartId) => api('/orders', { method: 'POST', body: JSON.stringify({ cartId, idempotencyKey: generateUUID() }) });
export const checkout = orderId => api(`/orders/${orderId}/checkout`, { method: 'POST' });
export const payment = (orderId, outcome) => api(`/orders/${orderId}/payment`, { method: 'POST', body: JSON.stringify({ outcome, idempotencyKey: generateUUID() }) });
export const cancelOrder = orderId => api(`/orders/${orderId}/cancel`, { method: 'POST' });
export const refundOrder = orderId => api(`/orders/${orderId}/refund`, { method: 'POST' });
export const getOrders = () => api('/orders');