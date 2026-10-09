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
      setError('');
      try {
        const response = await cartService.getCart();
        const carts = response.data.results || [];
        setCart(carts.length > 0 ? carts[0] : null);
      } catch (err) {
        setError('Failed to load your cart. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const items = cart?.items || [];
  const calculateItemsTotal = () =>
    items.reduce((sum, item) => sum + Number(item.book_price) * item.quantity, 0);
  const deliveryFee = deliveryMethod === 'delivery' ? 200 : 0;
  const grandTotal = calculateItemsTotal() + deliveryFee;
  const formatPrice = (amount) =>
    Number(amount).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (placingOrder) return;
    setError('');
    setPaymentStatus('');

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
        delivery_address: deliveryMethod === 'delivery' ? deliveryAddress.trim() : '',
        delivery_fee: deliveryFee
      });
      order = orderResponse.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to place your order. Please try again.');
      setPlacingOrder(false);
      return;
    }

    setPaymentStatus('Order created. Requesting your M-Pesa payment prompt...');

    try {
      await paymentService.initiatePayment({
        phone_number: phoneNumber.trim(),
        amount: order.total ?? grandTotal,
        order_id: order.id
      });
      setPaymentStatus('Payment prompt requested. Check your phone to complete payment.');
    } catch (err) {
      setPaymentStatus('Your order was created, but the payment prompt could not be sent. Visit your orders page to check the order and retry payment if available.');
    }

    navigate(`/orders/${order.id}`);
  };

  if (loading) {
    return <div className="checkout-loading"><div className="loading-spinner"></div><p>Loading checkout...</p></div>;
  }

  if (error && !cart) {
    return (
      <div className="checkout-page">
        <div className="checkout-message">
          <h2>Unable to load checkout</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>Try again</button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-message">
          <span className="material-symbols-outlined checkout-empty-icon" aria-hidden="true">shopping_cart</span>
          <h2>Your cart is empty</h2>
          <p>You need items in your cart to proceed with checkout.</p>
          <Link to="/" className="btn-primary">Browse books</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <Link to="/cart" className="back-link">&larr; Return to Cart</Link>
        <p className="checkout-eyebrow">STORI ZETU · YOUR ORDER</p>
        <h1>Checkout</h1>
        <p className="checkout-subtitle">Review your order and complete your details.</p>
      </header>

      <div className="checkout-layout">
        <form onSubmit={handlePlaceOrder} className="checkout-form">
          <section className="form-section">
            <div className="section-heading">
              <span className="section-number">01</span>
              <div>
                <h2 className="section-title">Fulfilment</h2>
                <p className="section-description">How would you like to receive your books?</p>
              </div>
            </div>

            <div className="delivery-cards">
              <label className={`option-card ${deliveryMethod === 'pickup' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="pickup"
                  checked={deliveryMethod === 'pickup'}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                />
                <span className="radio-indicator"></span>
                <span className="option-content">
                  <span className="option-header">
                    <span className="option-title">In-store pickup</span>
                    <span className="option-badge free">Free</span>
                  </span>
                  <span className="option-desc">Collect your order from our store.</span>
                </span>
              </label>

              <label className={`option-card ${deliveryMethod === 'delivery' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="deliveryMethod"
                  value="delivery"
                  checked={deliveryMethod === 'delivery'}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                />
                <span className="radio-indicator"></span>
                <span className="option-content">
                  <span className="option-header">
                    <span className="option-title">Doorstep delivery</span>
                    <span className="option-badge">KSh 200.00</span>
                  </span>
                  <span className="option-desc">Have your books delivered to your address.</span>
                </span>
              </label>
            </div>

            {deliveryMethod === 'delivery' && (
              <div className="form-group slide-down">
                <label htmlFor="address">Delivery address <span className="required-mark">*</span></label>
                <input
                  id="address"
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street, estate, building or apartment"
                  className="form-input"
                  autoComplete="street-address"
                  required
                />
              </div>
            )}
          </section>

          <section className="form-section">
            <div className="section-heading">
              <span className="section-number">02</span>
              <div>
                <h2 className="section-title">Payment</h2>
                <p className="section-description">Pay securely using M-Pesa.</p>
              </div>
            </div>

            <div className="mpesa-banner">
              <div className="mpesa-header">
                <span className="mpesa-logo">M-PESA</span>
                <span className="mpesa-badge">STK Push</span>
              </div>
              <p className="mpesa-desc">A payment request will be sent to your phone. Follow the prompt to authorise payment.</p>
            </div>

            <div className="form-group">
              <label htmlFor="phone">M-Pesa phone number <span className="required-mark">*</span></label>
              <input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 0712345678"
                className="form-input"
                autoComplete="tel"
                inputMode="tel"
                required
              />
              <span className="input-hint">Enter the number registered with M-Pesa, including your country code if needed.</span>
            </div>
          </section>

          {error && <div className="checkout-alert error-message" role="alert">{error}</div>}
          {paymentStatus && <div className="checkout-alert payment-status" role="status">{paymentStatus}</div>}

          <button type="submit" className="btn-primary checkout-submit-btn" disabled={placingOrder}>
            {placingOrder ? 'Processing your order...' : `Pay KSh ${formatPrice(grandTotal)}`}
          </button>
          <p className="checkout-note">Review your delivery method and total before placing your order.</p>
        </form>

        <aside className="checkout-summary-card">
          <p className="summary-eyebrow">YOUR PURCHASE</p>
          <h2>Order Summary</h2>

          <div className="summary-items-list">
            {items.map((item) => (
              <div key={item.id} className="summary-item-row">
                <div className="summary-item-info">
                  <span className="summary-item-name">{item.book_title}</span>
                  <span className="summary-item-qty">Quantity: {item.quantity}</span>
                </div>
                <span className="summary-item-price">KSh {formatPrice(Number(item.book_price) * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="summary-divider"></div>
          <div className="summary-row">
            <span>Items subtotal</span>
            <span>KSh {formatPrice(calculateItemsTotal())}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span>{deliveryFee ? `KSh ${formatPrice(deliveryFee)}` : 'Free'}</span>
          </div>
          <div className="summary-divider"></div>
          <div className="summary-row grand-total-row">
            <span>Total payable</span>
            <span>KSh {formatPrice(grandTotal)}</span>
          </div>
          <p className="summary-footnote">Your delivery fee updates when you change your fulfilment method.</p>
          <Link to="/cart" className="summary-edit-link">&larr; Edit your cart</Link>
        </aside>
      </div>
    </div>
  );
}

export default Checkout;
