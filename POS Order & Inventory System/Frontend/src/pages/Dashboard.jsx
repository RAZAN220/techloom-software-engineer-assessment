import StatusBadge from '../components/StatusBadge.jsx';

const money = value => `$${Number(value || 0).toFixed(2)}`;

export default function Dashboard({ products, orders, onNavigate }) {
  const totalUnits = products.reduce((sum, product) => sum + (product.stock || 0), 0);
  const lowStock = products.filter(product => product.stock > 0 && product.stock <= 5);
  const outOfStock = products.filter(product => product.stock === 0);
  const paidOrders = orders.filter(order => order.status === 'PAID');
  const sales = paidOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const today = new Date().toDateString();
  const todaySales = paidOrders.filter(order => new Date(order.createdAt).toDateString() === today).reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const metrics = [
    ['Products', products.length, 'catalog', 'teal'],
    ['Available units', totalUnits, 'on hand', 'blue'],
    ['Low stock', lowStock.length, 'needs attention', 'amber'],
    ['Out of stock', outOfStock.length, 'unavailable', 'red'],
    ['Total orders', orders.length, 'all time', 'slate'],
    ['Paid orders', paidOrders.length, 'completed', 'green'],
    ["Today's sales", money(todaySales), 'revenue', 'green'],
    ['Total sales', money(sales), 'all time', 'teal']
  ];

  return <section className="dashboard-page">
    <div className="page-heading"><div><p className="eyebrow">Operations overview</p><h1>Good morning, operator.</h1><p className="page-subtitle">A clear view of your counter, stock position, and today’s trade.</p></div><button className="primary-button" onClick={() => onNavigate('Products')}>+ Add inventory</button></div>
    <div className="metric-grid">{metrics.map(([label, value, caption, color]) => <article className={`metric-card metric-${color}`} key={label}><span>{label}</span><strong>{value}</strong><small>{caption}</small></article>)}</div>
    <div className="dashboard-columns">
      <article className="panel recent-panel"><div className="panel-heading"><div><p className="eyebrow">Latest activity</p><h2>Recent orders</h2></div><button className="text-button" onClick={() => onNavigate('Orders')}>View all →</button></div>{orders.length ? <div className="activity-list">{orders.slice(0, 5).map(order => <div className="activity-row" key={order._id}><div><strong>{order.orderNumber}</strong><small>{new Date(order.createdAt).toLocaleString()}</small></div><span>{money(order.totalAmount)}</span><StatusBadge value={order.status} /></div>)}</div> : <p className="muted">No orders have been created yet.</p>}</article>
      <article className="panel low-stock-panel"><div className="panel-heading"><div><p className="eyebrow">Inventory watch</p><h2>Low stock</h2></div><button className="text-button" onClick={() => onNavigate('Stock')}>Open stock →</button></div>{lowStock.length ? <div className="watch-list">{lowStock.slice(0, 5).map(product => <div className="watch-row" key={product._id}><span className="watch-dot" /><div><strong>{product.name}</strong><small>SKU {product._id.slice(-6).toUpperCase()}</small></div><b>{product.stock} left</b></div>)}</div> : <p className="muted">All products have healthy stock levels.</p>}</article>
    </div>
    <div className="quick-actions"><p className="eyebrow">Quick actions</p><div><button onClick={() => onNavigate('Products')}>Browse live catalog <span>↗</span></button><button onClick={() => onNavigate('Stock')}>Review stock levels <span>↗</span></button><button onClick={() => onNavigate('Cart')}>Open current cart <span>↗</span></button></div></div>
  </section>;
}