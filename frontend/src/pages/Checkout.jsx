import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import cartService from '../services/cartService';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
import '../styles/Checkout.css';

function Checkout() {
  const [cart, setCart] = useState(null);
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await cartService.getCart();
        const carts = response.data.results || [];
        setCart(carts.length > 0 ? carts[0] : null);
      } catch (err) {
        setError('Failed to load cart.');
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const calculateItemsTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => sum + (Number(item.book_price) * item.quantity), 0);
  };

  const deliveryFee = deliveryMethod === 'delivery' ? 200 : 0;
  const grandTotal = calculateItemsTotal() + deliveryFee;

  const formatPrice = (amount) => {
    return Number(amount).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
      setError('Please enter your delivery address.');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Please enter your M-Pesa phone number.');
      return;
    }

    setPlacingOrder(true);
    let order;

    try {
      const orderResponse = await orderService.createOrder({
        delivery_method: deliveryMethod,
        delivery_address: deliveryMethod === 'delivery' ? deliveryAddress : '',
        delivery_fee: deliveryFee,
      });
      order = orderResponse.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to place order. Please try again.');
      setPlacingOrder(false);
      return;
    }

    setPaymentStatus('Order created! Sending M-Pesa payment prompt to your phone...');

    try {
      await paymentService.initiatePayment({
        phone_number: phoneNumber,
        amount: order.total || grandTotal,
        order_id: order.id,
      });
      setPaymentStatus('STK push sent! Please check your phone and enter your PIN.');
    } catch (err) {
      setPaymentStatus('Order placed, but the payment prompt failed to send. You can retry payment from your orders page.');
    }

    setPlacingOrder(false);
    setTimeout(() => navigate(`/orders/${order.id}`), 3500);
  };

  if (loading) return <div className="loading"><div className="loading-spinner"></div>Loading checkout...</div>;

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>You need items in your cart to proceed with checkout.</p>
          <Link to="/" className="btn-primary">Browse books</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <Link to="/cart" className="back-link">&larr; Return to Cart</Link>
        <h1>Checkout</h1>
        <p className="checkout-subtitle">Complete your details to finalize your purchase</p>
      </div>

      <div className="checkout-layout">
        <form onSubmit={handlePlaceOrder} className="checkout-form">
          <section className="form-section">
            <h2 className="section-title">1. Fulfillment Method</h2>
            <div className="delivery-cards">
              <label className={`option-card ${deliveryMethod === 'pickup' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="pickup"
                  checked={deliveryMethod === 'pickup'}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                />
                <div className="option-content">
                  <div className="option-header">
                    <span className="option-title">In-Store Pickup</span>
                    <span className="option-badge free">Free</span>
                  </div>
                  <p className="option-desc">Collect directly from our store location</p>
                </div>
              </label>

              <label className={`option-card ${deliveryMethod === 'delivery' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="delivery"
                  checked={deliveryMethod === 'delivery'}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                />
                <div className="option-content">
                  <div className="option-header">
                    <span className="option-title">Doorstep Delivery</span>
                    <span className="option-badge">KSh 200.00</span>
                  </div>
                  <p className="option-desc">Delivered straight to your doorstep</p>
                </div>
              </label>
            </div>

            {deliveryMethod === 'delivery' && (
              <div className="form-group slide-down">
                <label htmlFor="address">Delivery Address</label>
                <input
                  id="address"
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street name, estate, building name, or apartment number"
                  className="form-input"
                />
              </div>
            )}
          </section>

          <section className="form-section">
            <h2 className="section-title">2. Payment Method</h2>
            <div className="mpesa-banner">
              <div className="mpesa-header">
                <span className="mpesa-logo">M-PESA</span>
                <span className="mpesa-badge">Express</span>
              </div>
              <p className="mpesa-desc">An STK prompt will be sent directly to your phone for payment confirmation.</p>
            </div>

            <div className="form-group">
              <label htmlFor="phone">M-Pesa Phone Number</label>
              <input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 254712345678 or 0712345678"
                className="form-input"
              />
              <span className="input-hint">Format: 2547XXXXXXXX or 07XXXXXXXX</span>
            </div>
          </section>

          {error && <div className="error-message">{error}</div>}
          {paymentStatus && <div className="payment-status">{paymentStatus}</div>}

          <button type="submit" className="btn-primary checkout-submit-btn" disabled={placingOrder}>
            {placingOrder ? 'Processing Order...' : `Pay KSh ${formatPrice(grandTotal)}`}
          </button>
        </form>

        <aside className="checkout-summary-card">
          <h2>Order Summary</h2>
          <div className="summary-items-list">
            {items.map(item => (
              <div key={item.id} className="summary-item-row">
                <div className="summary-item-info">
                  <span className="summary-item-name">{item.book_title}</span>
                  <span className="summary-item-qty">Qty: {item.quantity}</span>
                </div>
                <span className="summary-item-price">KSh {formatPrice(Number(item.book_price) * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row">
            <span>Items Subtotal</span>
            <span>KSh {formatPrice(calculateItemsTotal())}</span>
          </div>

          <div className="summary-row">
            <span>Delivery Fee</span>
            <span>{deliveryFee > 0 ? `KSh ${formatPrice(deliveryFee)}` : 'Free'}</span>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row grand-total-row">
            <span>Total Payable</span>
            <span>KSh {formatPrice(grandTotal)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Checkout;