import { useState, useEffect, useRef } from 'react';
import bookService from '../services/bookService';
import categoryService from '../services/categoryService';
import cartService from '../services/cartService';
import BookCard from '../components/BookCard';
import '../styles/BookListing.css';

const PAGE_SIZE = 12;

function CustomSelect({ options, value, onChange, placeholder, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        selectRef.current &&
        !selectRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  );

  return (
    <div className="custom-select-container" ref={selectRef}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
        aria-label={label}
      >
        <span>{selectedOption?.label || placeholder}</span>

        <svg
          className="select-arrow"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <ul className="custom-select-menu">
          <li>
            <button
              type="button"
              className={`custom-select-item ${!value ? 'selected' : ''}`}
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
            >
              {placeholder}
            </button>
          </li>

          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                className={`custom-select-item ${
                  String(value) === String(option.value) ? 'selected' : ''
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
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
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [addingToCart, setAddingToCart] = useState(null);

  const messageTimer = useRef(null);

  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    ordering: '',
    page: 1,
  });

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
        const response = await bookService.getBooks({
          ...filters,
          page_size: PAGE_SIZE,
        });

        setBooks(response.data.results || []);
        setTotalCount(response.data.count || 0);
      } catch (err) {
        setError('We couldn’t load the books. Please try again.');
        console.error('Failed to fetch books', err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchBooks, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  useEffect(() => {
    return () => {
      if (messageTimer.current) {
        clearTimeout(messageTimer.current);
      }
    };
  }, []);

  const showMessage = (text) => {
    setMessage(text);

    if (messageTimer.current) {
      clearTimeout(messageTimer.current);
    }

    messageTimer.current = setTimeout(() => {
      setMessage('');
    }, 3500);
  };

  const handleFilterChange = (name, value) => {
    setFilters((previous) => ({
      ...previous,
      [name]: value,
      page: 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      status: '',
      ordering: '',
      page: 1,
    });
  };

  const goToPage = (page) => {
    setFilters((previous) => ({ ...previous, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToCart = async (bookId) => {
    setAddingToCart(bookId);

    try {
      await cartService.addToCart(bookId, 1);
      showMessage('Book added to your cart.');
    } catch (err) {
      showMessage(
        err.response?.status === 401
          ? 'Please log in to add books to your cart.'
          : 'Could not add this book. Please try again.'
      );
    } finally {
      setAddingToCart(null);
    }
  };

  const handleNotifyMe = async (bookId) => {
    try {
      await bookService.notifyMe(bookId);
      showMessage('You’ll be notified when this book is back in stock.');
    } catch (err) {
      showMessage(
        err.response?.status === 401
          ? 'Please log in to get stock notifications.'
          : 'Could not set up your notification. Please try again.'
      );
    }
  };

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const statusOptions = [
    { value: 'in_stock', label: 'In Stock' },
    { value: 'pre_order', label: 'Pre-order' },
    { value: 'out_of_stock', label: 'Out of Stock' },
  ];

  const sortOptions = [
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: 'title', label: 'Title: A to Z' },
    { value: '-title', label: 'Title: Z to A' },
  ];

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.category ||
    filters.status ||
    filters.ordering
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <main className="book-listing-page">
      <section className="books-section books-section--page">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">OUR COLLECTION</p>
            <h2>Browse Books</h2>
            <p className="section-description">
              Explore our collection and find your next great read.
            </p>
          </div>

          {!loading && (
            <span className="book-count" aria-live="polite">
              {totalCount} {totalCount === 1 ? 'book' : 'books'}
            </span>
          )}
        </div>

        <div className="filters">
          <div className="search-wrapper">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>

            <input
              type="search"
              name="search"
              placeholder="Search by title or author..."
              value={filters.search}
              onChange={(event) =>
                handleFilterChange('search', event.target.value)
              }
              className="search-input"
              aria-label="Search books by title or author"
            />
          </div>

          <CustomSelect
            label="Filter by category"
            options={categoryOptions}
            value={filters.category}
            onChange={(value) => handleFilterChange('category', value)}
            placeholder="All Categories"
          />

          <CustomSelect
            label="Filter by availability"
            options={statusOptions}
            value={filters.status}
            onChange={(value) => handleFilterChange('status', value)}
            placeholder="All Status"
          />

          <CustomSelect
            label="Sort books"
            options={sortOptions}
            value={filters.ordering}
            onChange={(value) => handleFilterChange('ordering', value)}
            placeholder="Newest First"
          />

          {hasActiveFilters && (
            <button
              type="button"
              className="clear-filters"
              onClick={clearFilters}
            >
              Clear
            </button>
          )}
        </div>

        {message && (
          <div className="cart-message" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="error-message" role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                setFilters((previous) => ({ ...previous }))
              }
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading" role="status">
            <div className="loading-spinner" />
            <p>Finding your books...</p>
          </div>
        ) : error ? null : books.length === 0 ? (
          <div className="no-results">
            <div className="empty-state-icon" aria-hidden="true">
              <span className="material-symbols-outlined">menu_book</span>
            </div>
            <h3>No books found</h3>
            <p>Try adjusting your search or filters.</p>
            <button
              type="button"
              className="btn-primary"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="books-grid">
              {books.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onMessage={showMessage}
                  onAddToCart={handleAddToCart}
                  onNotifyMe={handleNotifyMe}
                  addingToCart={addingToCart === book.id}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className="pagination" aria-label="Pagination">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => goToPage(filters.page - 1)}
                  disabled={filters.page === 1}
                >
                  Previous
                </button>

                <span className="pagination-info">
                  Page {filters.page} of {totalPages}
                </span>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => goToPage(filters.page + 1)}
                  disabled={filters.page >= totalPages}
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default BookListing;

