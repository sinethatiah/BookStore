import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../services/bookService';
import categoryService from '../services/categoryService';
import cartService from '../services/cartService';
import '../styles/BookListing.css';

// Reusable Custom Select Component
function CustomSelect({ options, value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className="custom-select-container" ref={selectRef}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{displayLabel}</span>
        <svg className="select-arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <ul className="custom-select-menu">
          <li
            className={`custom-select-item ${value === '' ? 'selected' : ''}`}
            onClick={() => {
              onChange('');
              setIsOpen(false);
            }}
          >
            {placeholder}
          </li>
          {options.map((opt) => (
            <li
              key={opt.value}
              className={`custom-select-item ${String(value) === String(opt.value) ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BookListing() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
  });
  const [addingToCart, setAddingToCart] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        setCategories(response.data.results || []);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await bookService.getBooks(filters);
        setBooks(response.data.results || []);
      } catch (err) {
        setError('Failed to fetch books. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchBooks();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddToCart = async (bookId) => {
    setAddingToCart(bookId);
    try {
      await cartService.addToCart(bookId, 1);
      alert('Book added to cart!');
    } catch (err) {
      alert('Failed to add book to cart. Please log in.');
    } finally {
      setAddingToCart(null);
    }
  };

  const handleNotifyMe = async (bookId) => {
    try {
      await bookService.notifyMe(bookId);
      alert('You will be notified when this book is back in stock.');
    } catch (err) {
      alert('Please log in to get notified.');
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      in_stock: 'badge-in-stock',
      pre_order: 'badge-pre-order',
      out_of_stock: 'badge-out-of-stock',
    };
    return statusMap[status] || 'badge-default';
  };

  const formatStatusLabel = (status) => {
    if (!status) return '';
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const heroBook = books.find((b) => b.cover_image_url);

  // Format options for CustomSelect
  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  const statusOptions = [
    { value: 'in_stock', label: 'In Stock' },
    { value: 'pre_order', label: 'Pre-order' },
    { value: 'out_of_stock', label: 'Out of Stock' },
  ];

  return (
    <div className="book-listing-page">
      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-eyebrow">READ · EXPLORE · GROW</p>
          <h1 className="hero-title">
            Stories for a<br />
            Kinder, Calmer You
          </h1>
          <p className="hero-subtitle">
            Thoughtful reads from Stori Zetu — real stories, real voices, delivered to your door.
          </p>
        </div>
        {heroBook && (
          <div className="hero-book">
            <img src={heroBook.cover_image_url} alt={heroBook.title} />
          </div>
        )}
      </section>

      <div className="filters-section">
        <h2>Browse Books</h2>

        <div className="filters">
          <div className="filter-group flex-1">
            <input
              type="text"
              name="search"
              placeholder="Search by title or author..."
              value={filters.search}
              onChange={handleInputChange}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <CustomSelect
              options={categoryOptions}
              value={filters.category}
              onChange={(val) => handleFilterChange('category', val)}
              placeholder="All Categories"
            />
          </div>

          <div className="filter-group">
            <CustomSelect
              options={statusOptions}
              value={filters.status}
              onChange={(val) => handleFilterChange('status', val)}
              placeholder="All Status"
            />
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading books...</div>
      ) : books.length === 0 ? (
        <div className="no-results">No books found. Try adjusting your filters.</div>
      ) : (
        <div className="books-grid">
          {books.map((book) => (
            <div key={book.id} className="book-card">
              <div className="book-image">
                {book.cover_image_url ? (
                  <img src={book.cover_image_url} alt={book.title} />
                ) : (
                  <div className="book-image-placeholder">
                    <span>{book.title}</span>
                  </div>
                )}
              </div>

              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">{book.author}</p>

                <div className="book-meta">
                  <span className={`badge ${getStatusBadgeClass(book.status)}`}>
                    {formatStatusLabel(book.status)}
                  </span>
                  {book.stock > 0 && <span className="stock-info">{book.stock} left</span>}
                </div>

                <p className="book-price">KSh {book.price}</p>

                <div className="book-actions">
                  <Link to={`/books/${book.id}`} className="btn-secondary">
                    View Details
                  </Link>
                  {book.status === 'out_of_stock' ? (
                    <button className="btn-secondary" onClick={() => handleNotifyMe(book.id)}>
                      Notify Me
                    </button>
                  ) : (
                    <button
                      onClick={() => handleAddToCart(book.id)}
                      disabled={addingToCart === book.id}
                      className="btn-primary"
                    >
                      {addingToCart === book.id ? 'Adding...' : 'Add to Cart'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookListing;