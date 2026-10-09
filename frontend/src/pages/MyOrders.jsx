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
        const data = response.data;
        setOrders(Array.isArray(data) ? data : data?.results || []);
      } catch (err) {
        setError('Failed to load your orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const formatPrice = (amount) =>
    Number(amount || 0).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (dateString) => {
    if (!dateString) return 'Date unavailable';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Date unavailable';
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatStatus = (status) =>
    status
      ? status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
      : 'Unknown';

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      paid: { label: 'Paid', className: 'badge-paid' },
      pending: { label: 'Payment Pending', className: 'badge-pending' },
      failed: { label: 'Payment Failed', className: 'badge-failed' },
    };
    return statusMap[status] || {
      label: formatStatus(status),
      className: 'badge-default',
    };
  };

  const getDeliveryStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Processing', className: 'badge-pending' },
      processing: { label: 'Processing', className: 'badge-pending' },
      shipped: { label: 'Dispatched', className: 'badge-shipped' },
      delivered: { label: 'Delivered', className: 'badge-delivered' },
      cancelled: { label: 'Cancelled', className: 'badge-failed' },
    };
    return statusMap[status] || {
      label: formatStatus(status),
      className: 'badge-default',
    };
  };

  if (loading) {
    return (
      <div className="my-orders-page">
        <div className="orders-state" role="status">
          <div className="loading-spinner" />
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-orders-page">
        <div className="orders-state orders-error" role="alert">
          <h2>Unable to load orders</h2>
          <p>{error}</p>
          <button
            className="btn-primary"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="my-orders-page">
      <header className="orders-header">
        <Link to="/" className="back-link">&larr; Back to books</Link>
        <p className="orders-eyebrow">YOUR ACCOUNT</p>
        <h1>My Orders</h1>
        <p className="orders-subtitle">
          Track and review your recent book purchases.
        </p>
      </header>

      {orders.length === 0 ? (
        <section className="empty-orders">
          <span
            className="material-symbols-outlined empty-orders-icon"
            aria-hidden="true"
          >
            inventory_2
          </span>
          <h2>No orders yet</h2>
          <p>
            Your next favorite read is waiting. Explore our collection and
            your purchases will appear here.
          </p>
          <Link to="/" className="btn-primary">Browse books</Link>
        </section>
      ) : (
        <section className="orders-list" aria-label="Your orders">
          {orders.map((order) => {
            const paymentBadge = getPaymentStatusBadge(order.payment_status);
            const deliveryBadge = getDeliveryStatusBadge(order.delivery_status);

            return (
              <Link
                to={`/orders/${order.id}`}
                key={order.id}
                className="order-card"
              >
                <div className="order-card-header">
                  <div className="order-meta">
                    <span className="order-number">Order #{order.id}</span>
                    <span className="order-date">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                  <span className="view-details-link">
                    View details <span aria-hidden="true">&rarr;</span>
                  </span>
                </div>

                <div className="order-card-body">
                  <div className="badges-group">
                    <span className="badge-label">Payment</span>
                    <span className={`status-badge ${paymentBadge.className}`}>
                      {paymentBadge.label}
                    </span>
                    <span className="badge-label delivery-label">Order</span>
                    <span className={`status-badge ${deliveryBadge.className}`}>
                      {deliveryBadge.label}
                    </span>
                  </div>

                  <div className="order-card-total">
                    <span className="total-label">Total amount</span>
                    <span className="total-amount">
                      KSh {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </main>
  );
}

export default MyOrders;

