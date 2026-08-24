import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import bookService from '../services/bookService';
import cartService from '../services/cartService';
import '../styles/BookDetail.css';

function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      try {
        const response = await bookService.getBook(id);
        setBook(response.data);
      } catch (err) {
        setError('Book not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id]);

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await cartService.addToCart(book.id, 1);
      navigate('/cart');
    } catch (err) {
      alert('Please log in to add items to your cart.');
    } finally {
      setAdding(false);
    }
  };

  const handleNotifyMe = async () => {
    setNotifying(true);
    try {
      await bookService.notifyMe(book.id);
      alert('You will be notified when this book is back in stock.');
    } catch (err) {
      alert('Please log in to get notified.');
    } finally {
      setNotifying(false);
    }
  };

  if (loading) return <div className="loading">Loading book...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!book) return null;

  return (
    <div className="book-detail-page">
      <Link to="/" className="back-link">&larr; Back to books</Link>

      <div className="book-detail-content">
        <div className="book-detail-image">
          {book.cover_image_url ? (
            <img src={book.cover_image_url} alt={book.title} />
          ) : (
            <div className="no-cover">No cover available</div>
          )}
        </div>

        <div className="book-detail-info">
          <h1>{book.title}</h1>
          <p className="book-detail-author">by {book.author}</p>

          <span className={`status-badge ${book.status.replace('_', '-')}`}>
            {book.status.replace('_', ' ').toUpperCase()}
          </span>

          <p className="book-detail-price">KSh {book.price}</p>

          {book.description && (
            <div className="book-detail-description">
              <h3>About this book</h3>
              <p>{book.description}</p>
            </div>
          )}

          <div className="book-detail-actions">
            {book.status === 'out_of_stock' ? (
              <button className="btn-secondary" onClick={handleNotifyMe} disabled={notifying}>
                {notifying ? 'Subscribing...' : 'Notify me when in stock'}
              </button>
            ) : (
              <button className="btn-primary" onClick={handleAddToCart} disabled={adding}>
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookDetail;