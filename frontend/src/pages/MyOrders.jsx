import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../services/orderService';
import '../styles/MyOrders.css';

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await orderService.getOrders();
        setOrders(response.data.results);
      } catch (err) {
        setError('Failed to load your orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="loading">Loading your orders...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="my-orders-page">
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <div className="empty-cart">
          <p>You haven't placed any orders yet.</p>
          <Link to="/">Browse books</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <Link to={`/orders/${order.id}`} key={order.id} className="order-card">
              <div className="order-card-header">
                <span>Order #{order.id}</span>
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div className="order-card-body">
                <span className={`status-badge payment-${order.payment_status}`}>
                  {order.payment_status}
                </span>
                <span className={`status-badge delivery-${order.delivery_status}`}>
                  {order.delivery_status}
                </span>
                <span className="order-card-total">KSh {order.total}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyOrders;