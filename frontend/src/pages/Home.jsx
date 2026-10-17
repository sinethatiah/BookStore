import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../services/bookService';
import BookCard from '../components/BookCard';
import '../styles/Home.css';

const categories = [
  {
    name: 'Fiction & Literature',
    description: 'Stories that stay with you',
    icon: 'auto_stories',
  },
  {
    name: 'Business & Finance',
    description: 'Ideas for your next chapter',
    icon: 'trending_up',
  },
  {
    name: 'Science & Technology',
    description: 'Explore how the world works',
    icon: 'science',
  },
  {
    name: 'Personal Development',
    description: 'Learn, grow and discover',
    icon: 'psychology',
  },
];

function Home() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    const fetchBooks = async () => {
      try {
        const response = await bookService.getBooks({
          page_size: 4,
          ordering: '-created_at',
        });

        if (active) {
          setBooks(response.data.results || []);
        }
      } catch {
        if (active) {
          setError('Failed to load books. Please try again.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchBooks();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!message) return;

    const timeout = setTimeout(() => setMessage(''), 3000);
    return () => clearTimeout(timeout);
  }, [message]);

  const showMessage = (text) => {
    setMessage(text);
  };

  const heroBook = books.find((book) => book.cover_image_url);

  return (
    <main className="home-page">
      {/* Hero */}
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
            Explore books
            <span aria-hidden="true">→</span>
          </Link>

          <p className="hero-note">
            A world of stories, waiting to be discovered.
          </p>
        </div>

        {heroBook && (
          <Link
            to={`/books/${heroBook.id}`}
            className="hero-book"
            aria-label={`Discover ${heroBook.title}`}
          >
            <span className="hero-book-label">A recent arrival</span>
            <img
              src={heroBook.cover_image_url}
              alt={`Book cover: ${heroBook.title}`}
            />
            <span className="hero-book-shadow" />
          </Link>
        )}
      </section>

      {/* Browse by category */}
      <section className="category-section">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">SOMETHING FOR EVERY MIND</p>
            <h2>Explore by interest</h2>
          </div>

          <Link to="/books" className="section-link">
            All books <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="category-grid">
          {categories.map((category, index) => (
            <Link
              to="/books"
              className="category-card"
              key={category.name}
            >
              <span className="category-number">
                0{index + 1}
              </span>

              <span
                className="material-symbols-outlined category-icon"
                aria-hidden="true"
              >
                {category.icon}
              </span>

              <span className="category-name">{category.name}</span>
              <span className="category-description">
                {category.description}
              </span>

              <span className="category-arrow" aria-hidden="true">
                ↗
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest books */}
      <section className="books-section">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">FRESH OFF THE SHELF</p>
            <h2>Discover your next read</h2>
            <p className="section-description">
              Take a look at the latest additions to our collection.
            </p>
          </div>

          <Link to="/books" className="section-link">
            View collection <span aria-hidden="true">→</span>
          </Link>
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
            <h3>No books just yet</h3>
            <p>Check back soon to discover our collection.</p>
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
                Explore all books <span aria-hidden="true">→</span>
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Brand statement */}
      <section className="brand-section">
        <div className="brand-mark" aria-hidden="true">
          <span className="material-symbols-outlined">
            menu_book
          </span>
        </div>

        <p className="section-eyebrow">THE STORI ZETU IDEA</p>

        <h2>
          Every book opens
          <br />
          <em>another world.</em>
        </h2>

        <p className="brand-description">
          Some books entertain us. Others challenge the way we think,
          introduce us to new perspectives or inspire us to do more.
          Whatever you are looking for, your next chapter starts here.
        </p>

        <Link to="/books" className="brand-link">
          Find your next book <span aria-hidden="true">→</span>
        </Link>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-main">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              Stori Zetu<span>.</span>
            </Link>

            <p>
              Stories, ideas and new perspectives.
              Find something worth reading.
            </p>
          </div>

          <div className="footer-column">
            <h3>Discover</h3>
            <Link to="/books">All books</Link>
            <Link to="/books">Browse collection</Link>
          </div>

          <div className="footer-column">
            <h3>Your account</h3>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create account</Link>
            <Link to="/my-orders">My orders</Link>
          </div>

          <div className="footer-column">
            <h3>Keep exploring</h3>
            <p>
              There is always another story to discover.
              Start with the collection.
            </p>
            <Link to="/books" className="footer-cta">
              Browse books <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="footer-bottom">
          <Link to="/" className="footer-bottom-brand">
            Stori Zetu
          </Link>

          <p>
            © {new Date().getFullYear()} Stori Zetu. All rights reserved.
          </p>

          <Link to="/books" className="footer-back-to-books">
            Find your next read ↑
          </Link>
        </div>
      </footer>
    </main>
  );
}

export default Home;