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
        const data = response.data.results || response.data || [];
        setOrders(data);
      } catch (err) {
        setError('Failed to load your orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const formatPrice = (amount) => {
    return Number(amount).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      paid: { label: 'Paid', class: 'badge-paid' },
      pending: { label: 'Payment Pending', class: 'badge-pending' },
      failed: { label: 'Payment Failed', class: 'badge-failed' },
    };
    return statusMap[status] || { label: status?.replace('_', ' ') || 'Unknown', class: 'badge-default' };
  };

  const getDeliveryStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Processing', class: 'badge-pending' },
      shipped: { label: 'Dispatched', class: 'badge-shipped' },
      delivered: { label: 'Delivered', class: 'badge-delivered' },
      cancelled: { label: 'Cancelled', class: 'badge-failed' },
    };
    return statusMap[status] || { label: status?.replace('_', ' ') || 'Processing', class: 'badge-default' };
  };

  if (loading) return <div className="loading"><div className="loading-spinner"></div>Loading your orders...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="my-orders-page">
      <div className="orders-header">
        <h1>My Orders</h1>
        <p className="orders-subtitle">Track and review your recent book purchases</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <div className="empty-orders-icon">📦</div>
          <h3>No orders found</h3>
          <p>You haven't placed any orders yet. Discover your next favorite read in our catalog.</p>
          <Link to="/" className="btn-primary">Browse books</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const paymentBadge = getPaymentStatusBadge(order.payment_status);
            const deliveryBadge = getDeliveryStatusBadge(order.delivery_status);

            return (
              <Link to={`/orders/${order.id}`} key={order.id} className="order-card">
                <div className="order-card-header">
                  <div className="order-meta">
                    <span className="order-number">Order #{order.id}</span>
                    <span className="order-date">{formatDate(order.created_at)}</span>
                  </div>
                  <span className="view-details-link">View Order &rarr;</span>
                </div>

                <div className="order-card-body">
                  <div className="badges-group">
                    <span className={`status-badge ${paymentBadge.class}`}>
                      {paymentBadge.label}
                    </span>
                    <span className={`status-badge ${deliveryBadge.class}`}>
                      {deliveryBadge.label}
                    </span>
                  </div>

                  <div className="order-card-total">
                    <span className="total-label">Total Amount</span>
                    <span className="total-amount">KSh {formatPrice(order.total)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyOrders;