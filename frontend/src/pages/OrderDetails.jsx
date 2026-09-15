import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../services/orderService';
import '../styles/OrderDetail.css';

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await orderService.getOrder(id);
        setOrder(response.data);
      } catch (err) {
        setError('Order not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (loading) return <div className="loading">Loading order...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!order) return null;

  return (
    <div className="order-detail-page">
      <Link to="/" className="back-link">&larr; Continue shopping</Link>

      <h1>Order #{order.id}</h1>

      <div className="order-status-row">
        <span className={`status-badge payment-${order.payment_status}`}>
          Payment: {order.payment_status}
        </span>
        <span className={`status-badge delivery-${order.delivery_status}`}>
          Delivery: {order.delivery_status}
        </span>
      </div>

      <div className="order-items">
        <h3>Items</h3>
        {order.items.map(item => (
          <div key={item.id} className="order-item-row">
            <span>{item.book_title || `Book #${item.book}`} x{item.quantity}</span>
            <span>KSh {item.price_at_purchase * item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="order-summary-row">
        <span>Delivery Method</span>
        <span>{order.delivery_method}</span>
      </div>
      {order.delivery_method === 'delivery' && (
        <div className="order-summary-row">
          <span>Delivery Address</span>
          <span>{order.delivery_address}</span>
        </div>
      )}
      <div className="order-summary-row total">
        <span>Total</span>
        <span>KSh {order.total}</span>
      </div>
    </div>
  );
}

export default OrderDetail;