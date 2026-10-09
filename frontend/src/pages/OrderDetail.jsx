import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
import '../styles/OrderDetail.css';

function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [retryingPayment, setRetryingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');

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

  useEffect(() => {
    fetchOrder();
  }, [id]);

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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRetryPayment = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setRetryingPayment(true);
    setPaymentMessage('');

    try {
      await paymentService.initiatePayment({
        phone_number: phone,
        amount: order.total,
        order_id: order.id,
      });
      setPaymentMessage('STK prompt sent to your phone! Complete payment to update order.');
      setTimeout(() => fetchOrder(), 4000);
    } catch (err) {
      setPaymentMessage('Failed to initiate payment prompt. Please try again.');
    } finally {
      setRetryingPayment(false);
    }
  };

  const getPaymentBadge = (status) => {
    const statusMap = {
      paid: { label: 'Payment Received', class: 'badge-paid' },
      pending: { label: 'Payment Pending', class: 'badge-pending' },
      failed: { label: 'Payment Failed', class: 'badge-failed' },
    };
    return statusMap[status] || { label: status, class: 'badge-default' };
  };

  const getDeliveryBadge = (status) => {
    const statusMap = {
      pending: { label: 'Processing Order', class: 'badge-pending' },
      shipped: { label: 'Dispatched', class: 'badge-shipped' },
      delivered: { label: 'Delivered', class: 'badge-delivered' },
      cancelled: { label: 'Cancelled', class: 'badge-failed' },
    };
    return statusMap[status] || { label: status, class: 'badge-default' };
  };

  if (loading) return <div className="loading"><div className="loading-spinner"></div>Loading order...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!order) return null;

  const paymentBadge = getPaymentBadge(order.payment_status);
  const deliveryBadge = getDeliveryBadge(order.delivery_status);
  const needsPayment = order.payment_status === 'pending' || order.payment_status === 'failed';

  return (
    <div className="order-detail-page">
      <div className="order-detail-header">
        <Link to="/orders" className="back-link">&larr; Back to my orders</Link>
        <div className="header-title-row">
          <h1>Order #{order.id}</h1>
          <span className="order-timestamp">{formatDate(order.created_at)}</span>
        </div>
        <div className="order-status-row">
          <span className={`status-badge ${paymentBadge.class}`}>
            {paymentBadge.label}
          </span>
          <span className={`status-badge ${deliveryBadge.class}`}>
            {deliveryBadge.label}
          </span>
        </div>
      </div>

      <div className="order-detail-grid">
        <div className="order-main-content">
          <section className="detail-card">
            <h2>Purchased Items</h2>
            <div className="order-items-list">
              {order.items.map((item) => {
                const itemTotal = Number(item.price_at_purchase) * item.quantity;
                return (
                  <div key={item.id} className="order-item-row">
                    <div className="item-info">
                      <span className="item-title">{item.book_title || `Book #${item.book}`}</span>
                      <span className="item-qty">Qty: {item.quantity} &times; KSh {formatPrice(item.price_at_purchase)}</span>
                    </div>
                    <span className="item-total">KSh {formatPrice(itemTotal)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {needsPayment && (
            <section className="detail-card payment-retry-card">
              <h2>Complete Payment</h2>
              <p className="retry-desc">
                Your order is reserved. Enter your M-Pesa phone number below to send a payment request directly to your phone.
              </p>
              <form onSubmit={handleRetryPayment} className="retry-form">
                <input
                  type="tel"
                  placeholder="2547XXXXXXXX or 07XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="retry-input"
                  required
                />
                <button type="submit" className="btn-primary" disabled={retryingPayment}>
                  {retryingPayment ? 'Sending...' : 'Pay with M-Pesa'}
                </button>
              </form>
              {paymentMessage && <div className="retry-status-message">{paymentMessage}</div>}
            </section>
          )}
        </div>

        <aside className="order-sidebar">
          <section className="detail-card">
            <h2>Delivery Details</h2>
            <div className="info-group">
              <span className="info-label">Fulfillment Method</span>
              <span className="info-value">{order.delivery_method === 'delivery' ? 'Doorstep Delivery' : 'In-Store Pickup'}</span>
            </div>

            {order.delivery_method === 'delivery' && (
              <div className="info-group">
                <span className="info-label">Address</span>
                <span className="info-value">{order.delivery_address || 'N/A'}</span>
              </div>
            )}
          </section>

          <section className="detail-card">
            <h2>Payment Summary</h2>
            <div className="summary-line">
              <span>Items Subtotal</span>
              <span>KSh {formatPrice(Number(order.total) - Number(order.delivery_fee || 0))}</span>
            </div>
            <div className="summary-line">
              <span>Delivery Fee</span>
              <span>KSh {formatPrice(order.delivery_fee || 0)}</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-line grand-total">
              <span>Total Amount</span>
              <span>KSh {formatPrice(order.total)}</span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default OrderDetail;