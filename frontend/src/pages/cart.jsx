import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import cartService from '../services/cartService';
import bookService from '../services/bookService';
import '../styles/Cart.css';

function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const navigate = useNavigate();

  const fetchCart = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await cartService.getCart();
      const carts = response.data.results || [];

      if (carts.length === 0) {
        setCart(null);
        return;
      }

      const cartData = carts[0];
      const items = await Promise.all(
        (cartData.items || []).map(async (item) => {
          try {
            const bookResponse = await bookService.getBook(item.book);
            const book = bookResponse.data;

            return {
              ...item,
              book_title: book.title,
              book_author: book.author,
              cover_image_url: book.cover_image_url
            };
          } catch (err) {
            return item;
          }
        })
      );

      setCart({ ...cartData, items });
    } catch (err) {
      setError('Failed to load cart.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (itemId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) return;

    setUpdatingId(itemId);
    try {
      await cartService.updateQuantity(itemId, newQty);
      await fetchCart();
    } catch (err) {
      alert('Failed to update quantity.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId) => {
    setUpdatingId(itemId);
    try {
      await cartService.removeFromCart(itemId);
      await fetchCart();
    } catch (err) {
      alert('Failed to remove item.');
    } finally {
      setUpdatingId(null);
    }
  };

  const calculateTotal = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce(
      (sum, item) => sum + Number(item.book_price) * item.quantity,
      0
    );
  };

  const formatPrice = (amount) =>
    Number(amount).toLocaleString('en-KE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        Loading cart...
      </div>
    );
  }

  if (error) return <div className="error-message">{error}</div>;

  const items = cart?.items || [];
  const total = calculateTotal();

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Your Shopping Cart</h1>
        <p className="cart-subtitle">
          {items.length} {items.length === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      {items.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">
            <span className="material-symbols-outlined">shopping_cart</span>
          </div>
          <h3>Your cart is currently empty</h3>
          <p>Explore our library and discover your next great read.</p>
          <Link to="/" className="btn-primary">Browse books</Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items-list">
            {items.map((item) => {
              const itemSubtotal = Number(item.book_price) * item.quantity;
              const isBusy = updatingId === item.id;

              return (
                <div
                  key={item.id}
                  className={`cart-item ${isBusy ? 'busy' : ''}`}
                >
                  <div className="cart-item-image">
                    {item.cover_image_url ? (
                      <img src={item.cover_image_url} alt={item.book_title} />
                    ) : (
                      <div className="cart-item-placeholder">
                        {item.book_title?.[0] || 'B'}
                      </div>
                    )}
                  </div>

                  <div className="cart-item-details">
                    <h3 className="cart-item-title">{item.book_title}</h3>
                    {item.book_author && (
                      <p className="cart-item-author">by {item.book_author}</p>
                    )}
                    <p className="cart-item-price">
                      KSh {formatPrice(item.book_price)} each
                    </p>

                    <div className="cart-item-controls">
                      <div className="quantity-picker">
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity, -1)
                          }
                          disabled={item.quantity <= 1 || isBusy}
                          aria-label={`Decrease quantity of ${item.book_title}`}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() =>
                            handleUpdateQuantity(item.id, item.quantity, 1)
                          }
                          disabled={isBusy}
                          aria-label={`Increase quantity of ${item.book_title}`}
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="remove-btn"
                        onClick={() => handleRemove(item.id)}
                        disabled={isBusy}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-subtotal">
                    <span className="subtotal-label">Subtotal</span>
                    <span className="subtotal-amount">
                      KSh {formatPrice(itemSubtotal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-summary-card">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Items Total</span>
              <span>KSh {formatPrice(total)}</span>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <span className="summary-calc">Calculated at checkout</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row total-row">
              <span>Subtotal</span>
              <span>KSh {formatPrice(total)}</span>
            </div>

            <button
              className="btn-primary checkout-btn"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </button>

            <Link to="/" className="continue-link">
              &larr; Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;