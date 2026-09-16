const API_BASE_URL = (process.env.REACT_APP_API_URL || '').replace(/\/$/, '');
const API_URL = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;

export const api = async (path, options = {}) => {
  try {
    if (!API_URL) {
      throw new Error('REACT_APP_API_URL is not configured. Set it to your deployed backend URL in Vercel.');
    }

    const response = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers }, ...options
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || 'Request failed');
    return body;
  } catch (error) {
    if (error instanceof TypeError) throw new Error(`Cannot connect to the backend. Set REACT_APP_API_URL to your deployed backend URL.`);
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
export const createOrder = (cartId) => api('/orders', { method: 'POST', body: JSON.stringify({ cartId, idempotencyKey: crypto.randomUUID() }) });
export const checkout = orderId => api(`/orders/${orderId}/checkout`, { method: 'POST' });
export const payment = (orderId, outcome) => api(`/orders/${orderId}/payment`, { method: 'POST', body: JSON.stringify({ outcome, idempotencyKey: crypto.randomUUID() }) });
export const cancelOrder = orderId => api(`/orders/${orderId}/cancel`, { method: 'POST' });
export const refundOrder = orderId => api(`/orders/${orderId}/refund`, { method: 'POST' });
export const getOrders = () => api('/orders');