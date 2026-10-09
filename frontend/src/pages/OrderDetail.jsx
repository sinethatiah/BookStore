import { useState, useEffect, useCallback } from 'react';
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

  const fetchOrder = useCallback(async () => {
    setError('');

    try {
      const response = await orderService.getOrder(id);
      setOrder(response.data);
    } catch (err) {
      setError('Order not found or could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchOrder();
  }, [fetchOrder]);

  const formatPrice = (amount) =>
    Number(amount ?? 0).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatDate = (dateString) => {
    if (!dateString) return 'Date unavailable';

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Date unavailable';

    return date.toLocaleString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRetryPayment = async (e) => {
    e.preventDefault();

    if (!phone.trim() || retryingPayment || !order) return;

    setRetryingPayment(true);
    setPaymentMessage('');

    try {
      await paymentService.initiatePayment({
        phone_number: phone.trim(),
        amount: order.total,
        order_id: order.id,
      });

      setPaymentMessage(
        'Payment request sent. Check your phone and follow the M-Pesa prompt.'
      );
    } catch (err) {
      setPaymentMessage(
        'Could not initiate payment. Please check the number and try again.'
      );
    } finally {
      setRetryingPayment(false);
    }
  };

  const getPaymentBadge = (status) => {
    const statusMap = {
      paid: { label: 'Payment Received', className: 'badge-paid' },
      pending: { label: 'Payment Pending', className: 'badge-pending' },
      failed: { label: 'Payment Failed', className: 'badge-failed' },
    };

    return statusMap[status] || {
      label: status
        ? status.replace(/_/g, ' ')
        : 'Unknown',
      className: 'badge-default',
    };
  };

  const getDeliveryBadge = (status) => {
    const statusMap = {
      pending: { label: 'Processing Order', className: 'badge-pending' },
      processing: { label: 'Processing Order', className: 'badge-pending' },
      shipped: { label: 'Dispatched', className: 'badge-shipped' },
      delivered: { label: 'Delivered', className: 'badge-delivered' },
      cancelled: { label: 'Cancelled', className: 'badge-failed' },
    };

    return statusMap[status] || {
      label: status
        ? status.replace(/_/g, ' ')
        : 'Unknown',
      className: 'badge-default',
    };
  };

  if (loading) {
    return (
      <div className="order-detail-page">
        <div className="order-detail-state" role="status">
          <div className="loading-spinner" />
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-detail-page">
        <div className="order-detail-state" role="alert">
          <h2>Unable to load order</h2>
          <p>{error || 'This order could not be found.'}</p>
          <div className="order-detail-actions">
            <Link to="/my-orders" className="order-action-secondary">
              Back to my orders
            </Link>
            <Link to="/" className="btn-primary order-action-primary">
              Browse books
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const paymentBadge = getPaymentBadge(order.payment_status);
  const deliveryBadge = getDeliveryBadge(order.delivery_status);
  const needsPayment =
    order.payment_status === 'pending' ||
    order.payment_status === 'failed';

  const items = Array.isArray(order.items) ? order.items : [];
  const deliveryFee = Number(order.delivery_fee || 0);
  const total = Number(order.total || 0);
  const itemsSubtotal = total - deliveryFee;

  return (
    <main className="order-detail-page">
      <header className="order-detail-header">
        <Link to="/my-orders" className="back-link">
          &larr; Back to my orders
        </Link>

        <p className="order-detail-eyebrow">YOUR PURCHASE</p>

        <div className="header-title-row">
          <h1>Order #{order.id}</h1>
          <span className="order-timestamp">
            {formatDate(order.created_at)}
          </span>
        </div>

        <div className="order-status-row">
          <span className={`status-badge ${paymentBadge.className}`}>
            {paymentBadge.label}
          </span>
          <span className={`status-badge ${deliveryBadge.className}`}>
            {deliveryBadge.label}
          </span>
        </div>
      </header>

      <div className="order-detail-grid">
        <div className="order-main-content">
          <section className="detail-card">
            <h2>Purchased Items</h2>

            {items.length === 0 ? (
              <p className="detail-empty-text">
                No item details are available for this order.
              </p>
            ) : (
              <div className="order-items-list">
                {items.map((item) => {
                  const price = Number(item.price_at_purchase || 0);
                  const quantity = Number(item.quantity || 0);
                  const itemTotal = price * quantity;

                  return (
                    <div key={item.id} className="order-item-row">
                      <div className="item-info">
                        <span className="item-title">
                          {item.book_title || `Book #${item.book}`}
                        </span>
                        <span className="item-qty">
                          Qty: {quantity} × KSh {formatPrice(price)}
                        </span>
                      </div>
                      <span className="item-total">
                        KSh {formatPrice(itemTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {needsPayment && (
            <section className="detail-card payment-retry-card">
              <h2>Complete Payment</h2>
              <p className="retry-desc">
                Your order has not been marked as paid. Enter your M-Pesa
                phone number to request a payment prompt.
              </p>

              <form onSubmit={handleRetryPayment} className="retry-form">
                <label className="visually-hidden" htmlFor="retry-phone">
                  M-Pesa phone number
                </label>
                <input
                  id="retry-phone"
                  type="tel"
                  placeholder="2547XXXXXXXX or 07XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="retry-input"
                  autoComplete="tel"
                  inputMode="tel"
                  required
                />
                <button
                  type="submit"
                  className="btn-primary retry-button"
                  disabled={retryingPayment}
                >
                  {retryingPayment ? 'Sending request...' : 'Pay with M-Pesa'}
                </button>
              </form>

              {paymentMessage && (
                <p className="retry-status-message" role="status">
                  {paymentMessage}
                </p>
              )}

              <button
                type="button"
                className="refresh-order-button"
                onClick={fetchOrder}
              >
                Refresh payment status
              </button>
            </section>
          )}
        </div>

        <aside className="order-sidebar">
          <section className="detail-card">
            <h2>Delivery Details</h2>

            <div className="info-group">
              <span className="info-label">Fulfilment Method</span>
              <span className="info-value">
                {order.delivery_method === 'delivery'
                  ? 'Doorstep Delivery'
                  : 'In-Store Pickup'}
              </span>
            </div>

            {order.delivery_method === 'delivery' && (
              <div className="info-group">
                <span className="info-label">Delivery Address</span>
                <span className="info-value">
                  {order.delivery_address || 'Address unavailable'}
                </span>
              </div>
            )}
          </section>

          <section className="detail-card">
            <h2>Payment Summary</h2>

            <div className="summary-line">
              <span>Items subtotal</span>
              <span>KSh {formatPrice(itemsSubtotal)}</span>
            </div>

            <div className="summary-line">
              <span>Delivery fee</span>
              <span>
                {deliveryFee === 0 ? 'Free' : `KSh ${formatPrice(deliveryFee)}`}
              </span>
            </div>

            <div className="summary-divider" />

            <div className="summary-line grand-total">
              <span>Total amount</span>
              <span>KSh {formatPrice(total)}</span>
            </div>
          </section>
        </aside>
      </div>

      <nav className="order-detail-actions" aria-label="Order navigation">
        <Link to="/my-orders" className="order-action-secondary">
          View all orders
        </Link>
        <Link to="/" className="btn-primary order-action-primary">
          Browse books
        </Link>
      </nav>
    </main>
  );
}

export default OrderDetail;
