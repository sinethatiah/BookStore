import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
        const carts = response.data.results;
        setCart(carts.length > 0 ? carts[0] : null);
      } catch (err) {
        setError('Failed to load cart.');
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, []);

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    const itemsTotal = cart.items.reduce((sum, item) => sum + item.book_price * item.quantity, 0);
    const deliveryFee = deliveryMethod === 'delivery' ? 200 : 0;
    return itemsTotal + deliveryFee;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');

    if (deliveryMethod === 'delivery' && !deliveryAddress) {
      setError('Please enter a delivery address.');
      return;
    }
    if (!phoneNumber) {
      setError('Please enter a phone number for M-Pesa payment.');
      return;
    }

    setPlacingOrder(true);
    try {
      // 1. Create the order
      const orderResponse = await orderService.createOrder({
        delivery_method: deliveryMethod,
        delivery_address: deliveryMethod === 'delivery' ? deliveryAddress : '',
        delivery_fee: deliveryMethod === 'delivery' ? 200 : 0,
      });

      const order = orderResponse.data;

      // 2. Initiate M-Pesa payment for that order
      setPaymentStatus('Sending payment request to your phone...');
      await paymentService.initiatePayment({
        phone_number: phoneNumber,
        amount: order.total,
        order_id: order.id,
      });

      setPaymentStatus('Check your phone to complete the M-Pesa payment.');
      setTimeout(() => navigate(`/orders/${order.id}`), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Checkout failed. Please try again.');
      setPaymentStatus('');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) return <div className="loading">Loading checkout...</div>;
  if (!cart || cart.items.length === 0) {
    return <div className="empty-cart"><p>Your cart is empty.</p></div>;
  }

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-content">
        <form onSubmit={handlePlaceOrder} className="checkout-form">
          <div className="form-group">
            <label>Delivery Method</label>
            <div className="delivery-options">
              <label>
                <input
                  type="radio"
                  value="pickup"
                  checked={deliveryMethod === 'pickup'}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                />
                Pickup
              </label>
              <label>
                <input
                  type="radio"
                  value="delivery"
                  checked={deliveryMethod === 'delivery'}
                  onChange={(e) => setDeliveryMethod(e.target.value)}
                />
                Delivery (KSh 200)
              </label>
            </div>
          </div>

          {deliveryMethod === 'delivery' && (
            <div className="form-group">
              <label htmlFor="address">Delivery Address</label>
              <input
                id="address"
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Estate, street, landmark"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="phone">M-Pesa Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="254712345678"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {paymentStatus && <div className="payment-status">{paymentStatus}</div>}

          <button type="submit" className="btn-primary" disabled={placingOrder}>
            {placingOrder ? 'Processing...' : `Pay KSh ${calculateTotal()}`}
          </button>
        </form>

        <div className="checkout-summary">
          <h3>Order Summary</h3>
          {cart.items.map(item => (
            <div key={item.id} className="summary-item">
              <span>{item.book_title} x{item.quantity}</span>
              <span>KSh {item.book_price * item.quantity}</span>
            </div>
          ))}
          <div className="summary-total">
            <span>Total</span>
            <span>KSh {calculateTotal()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;