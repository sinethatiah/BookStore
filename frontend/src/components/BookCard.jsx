import { useState } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../services/bookService';
import cartService from '../services/cartService';

const BADGE_CLASSES = {
  in_stock: 'badge-in-stock',
  pre_order: 'badge-pre-order',
  out_of_stock: 'badge-out-of-stock',
};

function BookCard({ book, onMessage }) {
  const [adding, setAdding] = useState(false);

  const say = (text) => {
    if (onMessage) onMessage(text);
  };

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await cartService.addToCart(book.id, 1);
      say('Book added to your cart.');
    } catch (err) {
      say('Please log in to add books to your cart.');
    } finally {
      setAdding(false);
    }
  };

  const handleNotifyMe = async () => {
    try {
      await bookService.notifyMe(book.id);
      say('You will be notified when this book is back in stock.');
    } catch (err) {
      say('Please log in to get notified.');
    }
  };

  const statusLabel = (book.status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  return (
    <article className="book-card">
      <Link to={`/books/${book.id}`} className="book-image">
        {book.cover_image_url ? (
          <img src={book.cover_image_url} alt={book.title} />
        ) : (
          <div className="book-image-placeholder">
            <span>{book.title}</span>
          </div>
        )}
      </Link>

      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">{book.author}</p>

        <div className="book-meta">
          <span className={`badge ${BADGE_CLASSES[book.status] || ''}`}>
            {statusLabel}
          </span>
        </div>

        <p className="book-price">
          KSh {Number(book.price).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
        </p>

        <div className="book-actions">
          <Link to={`/books/${book.id}`} className="btn-secondary">View</Link>

          {book.status === 'out_of_stock' ? (
            <button className="btn-primary" onClick={handleNotifyMe}>Notify Me</button>
          ) : (
            <button className="btn-primary" onClick={handleAddToCart} disabled={adding}>
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default BookCard;