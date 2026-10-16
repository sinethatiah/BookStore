import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../services/bookService';
import BookCard from '../components/BookCard';
import '../styles/Home.css';

function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await bookService.getBooks({
          page_size: 4,
          ordering: '-created_at',
        });

        setBooks(response.data.results || []);
      } catch (err) {
        setError('Failed to load books. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  const showMessage = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const heroBook = books.find((book) => book.cover_image_url);

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-eyebrow">READ · EXPLORE · GROW</p>

          <h1 className="hero-title">
            Find your next
            <br />
            great story.
          </h1>

          <p className="hero-subtitle">
            Thoughtful reads, real stories and unforgettable voices,
            carefully selected by Stori Zetu.
          </p>

          <Link to="/books" className="hero-button">
            Browse all books
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {heroBook && (
          <Link
            to={`/books/${heroBook.id}`}
            className="hero-book"
            aria-label={`Discover ${heroBook.title}`}
          >
            <span className="hero-book-label">Featured</span>

            <img
              src={heroBook.cover_image_url}
              alt={`${heroBook.title} book cover`}
            />

            <span className="hero-book-shadow" />
          </Link>
        )}
      </section>

      <section className="books-section">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">NEW ARRIVALS</p>
            <h2>Latest books</h2>
          </div>
        </div>

        {message && (
          <div className="cart-message" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading" role="status">
            <div className="loading-spinner" />
            <p>Finding your books...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="no-results">
            <h3>No books yet</h3>
            <p>Check back soon.</p>
          </div>
        ) : (
          <>
            <div className="books-grid">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onMessage={showMessage}
                />
              ))}
            </div>

            <div className="see-more">
              <Link to="/books" className="btn-secondary">
                See all books
              </Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

export default Home;