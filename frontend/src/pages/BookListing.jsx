
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import bookService from "../services/bookService";
import categoryService from "../services/categoryService";
import cartService from "../services/cartService";
import "../styles/BookListing.css";

function CustomSelect({ options, value, onChange, placeholder, label }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  );

  return (
    <div className="custom-select-container" ref={selectRef}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((previous) => !previous)}
        aria-expanded={isOpen}
        aria-label={label}
      >
        <span>{selectedOption?.label || placeholder}</span>
        <svg
          className="select-arrow"
          viewBox="0 0 24 24"
          width="18"
          height="18"
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
              className={`custom-select-item ${!value ? "selected" : ""}`}
              onClick={() => {
                onChange("");
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
                  String(value) === String(option.value) ? "selected" : ""
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

function BookCover({ book, hero = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasCover = Boolean(book.cover_image_url) && !imageFailed;

  return (
    <div className={hero ? "hero-cover-frame" : "book-cover-frame"}>
      {hasCover ? (
        <img
          src={book.cover_image_url}
          alt={`${book.title} book cover`}
          loading={hero ? "eager" : "lazy"}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="book-image-placeholder">
          <span className="placeholder-label">STORI ZETU</span>
          <span className="placeholder-title">{book.title}</span>
          <span className="placeholder-author">{book.author}</span>
          <span className="placeholder-rule" />
        </div>
      )}
    </div>
  );
}

function BookListing() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
  });
  const [addingToCart, setAddingToCart] = useState(null);
  const messageTimer = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        setCategories(response.data.results || []);
      } catch (err) {
        console.error("Failed to fetch categories", err);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await bookService.getBooks(filters);
        setBooks(response.data.results || []);
      } catch (err) {
        setError("We couldn't load the books. Please try again.");
        console.error("Failed to fetch books", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  useEffect(() => {
    return () => {
      if (messageTimer.current) {
        clearTimeout(messageTimer.current);
      }
    };
  }, []);

  const showMessage = (message) => {
    setCartMessage(message);

    if (messageTimer.current) {
      clearTimeout(messageTimer.current);
    }

    messageTimer.current = setTimeout(() => {
      setCartMessage("");
    }, 3500);
  };

  const handleFilterChange = (name, value) => {
    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleInputChange = (event) => {
    handleFilterChange(event.target.name, event.target.value);
  };

  const clearFilters = () => {
    setFilters({ search: "", category: "", status: "" });
  };

  const handleAddToCart = async (bookId) => {
    setAddingToCart(bookId);
    setCartMessage("");

    try {
      await cartService.addToCart(bookId, 1);
      showMessage("Book added to your cart.");
    } catch (err) {
      showMessage(
        err.response?.status === 401
          ? "Please log in to add books to your cart."
          : "Couldn't add this book. Please try again."
      );
    } finally {
      setAddingToCart(null);
    }
  };

  const handleNotifyMe = async (bookId) => {
    try {
      await bookService.notifyMe(bookId);
      showMessage("You'll be notified when this book is back in stock.");
    } catch (err) {
      showMessage(
        err.response?.status === 401
          ? "Please log in to get stock notifications."
          : "Couldn't set up your notification. Please try again."
      );
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      in_stock: "badge-in-stock",
      pre_order: "badge-pre-order",
      out_of_stock: "badge-out-of-stock",
    };

    return statusMap[status] || "";
  };

  const formatStatusLabel = (status) =>
    status
      ? status.replace(/_/g, " ").replace(/\b\w/g, (letter) =>
          letter.toUpperCase()
        )
      : "Availability unknown";

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const statusOptions = [
    { value: "in_stock", label: "In Stock" },
    { value: "pre_order", label: "Pre-order" },
    { value: "out_of_stock", label: "Out of Stock" },
  ];

  const heroBook = books.find((book) => book.cover_image_url) || books[0];

  const formatPrice = (price) =>
    Number(price).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <main className="book-listing-page">
      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-eyebrow">READ · EXPLORE · GROW</p>

          <h1 className="hero-title">
            Find your next
            <br />
            great story.
          </h1>

          <p className="hero-subtitle">
            Thoughtful reads, real stories and unforgettable voices —
            carefully selected by Stori Zetu.
          </p>

          <a href="#browse-books" className="hero-button">
            Browse Books <span aria-hidden="true">↓</span>
          </a>
        </div>

        {heroBook && (
          <Link
            to={`/books/${heroBook.id}`}
            className="hero-book"
            aria-label={`Discover ${heroBook.title}`}
          >
            <span className="hero-book-label">Featured</span>
            <BookCover book={heroBook} hero />
            <span className="hero-book-shadow" />
          </Link>
        )}
      </section>

      <section className="books-section" id="browse-books">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">OUR COLLECTION</p>
            <h2>Browse Books</h2>
            <p className="section-description">
              Find a story worth spending time with.
            </p>
          </div>

          {!loading && (
            <span className="book-count" aria-live="polite">
              {books.length} {books.length === 1 ? "book" : "books"}
            </span>
          )}
        </div>

        <div className="filters">
          <div className="search-wrapper">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              width="19"
              height="19"
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
              onChange={handleInputChange}
              className="search-input"
              aria-label="Search books by title or author"
            />
          </div>

          <CustomSelect
            label="Filter by category"
            options={categoryOptions}
            value={filters.category}
            onChange={(value) => handleFilterChange("category", value)}
            placeholder="All Categories"
          />

          <CustomSelect
            label="Filter by availability"
            options={statusOptions}
            value={filters.status}
            onChange={(value) => handleFilterChange("status", value)}
            placeholder="All Status"
          />

          {(filters.search || filters.category || filters.status) && (
            <button
              type="button"
              className="clear-filters"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {cartMessage && (
          <div className="cart-message" role="status">
            {cartMessage}
          </div>
        )}

        {error && (
          <div className="error-message" role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setFilters((previous) => ({ ...previous }))}
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
            <p>Try another search or remove some filters.</p>
            <button
              type="button"
              className="empty-state-button"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="books-grid">
            {books.map((book) => (
              <article key={book.id} className="book-card">
                <Link
                  to={`/books/${book.id}`}
                  className="book-image"
                  aria-label={`View ${book.title}`}
                >
                  <BookCover book={book} />
                </Link>

                <div className="book-info">
                  <div className="book-copy">
                    <h3 className="book-title">
                      <Link to={`/books/${book.id}`}>{book.title}</Link>
                    </h3>
                    <p className="book-author">{book.author}</p>
                  </div>

                  <div className="book-meta">
                    <span
                      className={`badge ${getStatusBadgeClass(book.status)}`}
                    >
                      {formatStatusLabel(book.status)}
                    </span>

                    {book.status === "in_stock" && book.stock > 0 && (
                      <span className="stock-info">
                        {book.stock} left
                      </span>
                    )}
                  </div>

                  <p className="book-price">KSh {formatPrice(book.price)}</p>

                  <div className="book-actions">
                    <Link
                      to={`/books/${book.id}`}
                      className="btn-secondary"
                    >
                      View details
                    </Link>

                    {book.status === "out_of_stock" ? (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleNotifyMe(book.id)}
                      >
                        Notify me
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={() => handleAddToCart(book.id)}
                        disabled={addingToCart === book.id}
                      >
                        {addingToCart === book.id
                          ? "Adding..."
                          : "Add to cart"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default BookListing;

