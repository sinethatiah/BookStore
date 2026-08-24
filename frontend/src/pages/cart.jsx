import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import cartService from '../services/cartService';
import '../styles/Cart.css';

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchCart = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await cartService.getCart();
      // Cart list endpoint returns paginated results — user has one cart, so grab the first
      const carts = response.data.results;
      setCart(carts.length > 0 ? carts[0] : null);
    } catch (err) {
      setError('Failed to load cart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      await cartService.updateQuantity(itemId, quantity);
      fetchCart();
    } catch (err) {
      alert('Failed to update quantity.');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await cartService.removeFromCart(itemId);
      fetchCart();
    } catch (err) {
      alert('Failed to remove item.');
    }
  };

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => sum + item.book_price * item.quantity, 0);
  };

  if (loading) return <div className="loading">Loading cart...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="cart-page">
      <h1>Your Cart</h1>

      {!cart || cart.items.length === 0 ? (
        <div className="empty-cart">
          <p>Your cart is empty.</p>
          <Link to="/">Browse books</Link>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.items.map(item => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <h3>{item.book_title}</h3>
                  <p>KSh {item.book_price}</p>
                </div>
                <div className="cart-item-quantity">
                  <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <button className="remove-btn" onClick={() => handleRemove(item.id)}>Remove</button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <p className="cart-total">Total: KSh {calculateTotal()}</p>
            <button className="btn-primary" onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;