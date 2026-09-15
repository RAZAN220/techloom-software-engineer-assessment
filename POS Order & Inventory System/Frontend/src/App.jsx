import { useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';
import Products from './pages/Products.jsx';
import Cart from './pages/Cart.jsx';
import Orders from './pages/Orders.jsx';
import StockDashboard from './pages/StockDashboard.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { useCart } from './context/CartContext.jsx';
import { useToast } from './context/ToastContext.jsx';
import { addCartItem, cancelOrder, checkout, clearCart as clearRemoteCart, createCart, createOrder, createProduct, deleteProduct, getOrders, getProducts, payment, refundOrder, removeCartItem, updateCartItem, updateProduct } from './services/api.js';

export default function App() {
  const [page, setPage] = useState('Dashboard');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [loading, setLoading] = useState(true);
  const { items, addItem, removeItem, setQuantity, clear, count } = useCart();
  const toast = useToast();

  useEffect(() => {
    const startedAt = Date.now();
    Promise.all([getProducts(), getOrders(), createCart()]).then(([loadedProducts, loadedOrders, cart]) => {
      setProducts(loadedProducts); setOrders(loadedOrders); setCartId(cart._id);
    }).catch(error => toast(error.message)).finally(() => {
      window.setTimeout(() => setLoading(false), Math.max(0, 3000 - (Date.now() - startedAt)));
    });
  }, []);

  const addProduct = async product => { try { await addCartItem(cartId, { productId: product._id, quantity: 1 }); addItem(product); toast('Added to cart'); } catch (error) { toast(error.message); } };
  const changeQuantity = async (item, quantity) => { if (quantity < 1) return; try { await updateCartItem(cartId, item._id, quantity); setQuantity(item._id, quantity); } catch (error) { toast(error.message); } };
  const removeProduct = async item => { try { await removeCartItem(cartId, item._id); removeItem(item._id); toast(`${item.name} removed`); } catch (error) { toast(error.message); } };
  const emptyCart = async () => { try { await clearRemoteCart(cartId); clear(); toast('Cart cleared'); } catch (error) { toast(error.message); } };
  const createCheckout = async () => { try { const order = await createOrder(cartId); await checkout(order._id); setOrders(await getOrders()); clear(); setPage('Orders'); toast('Stock reserved. Choose a payment outcome below.'); } catch (error) { toast(error.message); } };
  const processPayment = async (orderId, outcome) => { try { await payment(orderId, outcome); setOrders(await getOrders()); toast(`Payment ${outcome.toLowerCase()}`); } catch (error) { toast(error.message); } };
  const cancelExistingOrder = async orderId => { try { await cancelOrder(orderId); setOrders(await getOrders()); toast('Order cancelled and stock released'); } catch (error) { toast(error.message); } };
  const addProductRecord = async product => { try { const created = await createProduct(product); setProducts(current => [...current, created]); toast('Product added'); } catch (error) { toast(error.message); throw error; } };
  const updateProductRecord = async (productId, product) => { try { const updated = await updateProduct(productId, product); setProducts(current => current.map(item => item._id === productId ? updated : item)); toast('Product updated'); } catch (error) { toast(error.message); throw error; } };
  const removeProductRecord = async product => { if (!window.confirm(`Delete ${product.name}?`)) return; try { await deleteProduct(product._id); setProducts(current => current.filter(item => item._id !== product._id)); toast('Product deleted'); } catch (error) { toast(error.message); } };
  const refundExistingOrder = async orderId => { try { await refundOrder(orderId); setOrders(await getOrders()); toast('Refund issued and stock restored'); } catch (error) { toast(error.message); } };

  if (loading) return <LoadingSpinner />;
  return <div className="app-shell"><Navbar page={page} setPage={setPage} cartCount={count} /><main>{page === 'Dashboard' && <Dashboard products={products} orders={orders} onNavigate={setPage} />}{page === 'Products' && <Products products={products} onAdd={addProduct} onCreate={addProductRecord} onUpdate={updateProductRecord} onDelete={removeProductRecord} />}{page === 'Stock' && <StockDashboard products={products} />}{page === 'Orders' && <Orders orders={orders} onPayment={processPayment} onCancel={cancelExistingOrder} onRefund={refundExistingOrder} />}{page === 'Cart' && <Cart items={items} onRemove={removeProduct} onQuantity={changeQuantity} onClear={emptyCart} onCheckout={createCheckout} />}</main></div>;
}