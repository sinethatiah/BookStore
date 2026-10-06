import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import bookService from "../services/bookService";
import categoryService from "../services/categoryService";
import cartService from "../services/cartService";
import "../styles/BookListing.css";

function CustomSelect({ options, value, onChange, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value),
  );

  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  return (
    <div className="custom-select-container" ref={selectRef}>
      <button
        type="button"
        className={`custom-select-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span>{displayLabel}</span>

        <svg
          className="select-arrow"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <ul className="custom-select-menu">
          <li
            className={`custom-select-item ${value === "" ? "selected" : ""}`}
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
          >
            {placeholder}
          </li>

          {options.map((option) => (
            <li
              key={option.value}
              className={`custom-select-item ${
                String(value) === String(option.value) ? "selected" : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
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
  const [error, setError] = useState("");
  const [cartMessage, setCartMessage] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "",
  });
  const [addingToCart, setAddingToCart] = useState(null);

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
    const fetchBooks = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await bookService.getBooks(filters);
        setBooks(response.data.results || []);
      } catch (err) {
        setError("Failed to fetch books. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchBooks, 300);

    return () => clearTimeout(timeoutId);
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      category: "",
      status: "",
    });
  };

  const handleAddToCart = async (bookId) => {
    setAddingToCart(bookId);
    setCartMessage("");

    try {
      await cartService.addToCart(bookId, 1);
      setCartMessage("Book added to your cart.");
    } catch (err) {
      setCartMessage("Please log in to add books to your cart.");
    } finally {
      setAddingToCart(null);

      setTimeout(() => {
        setCartMessage("");
      }, 3000);
    }
  };

  const handleNotifyMe = async (bookId) => {
    try {
      await bookService.notifyMe(bookId);
      setCartMessage("You will be notified when this book is back in stock.");
    } catch (err) {
      setCartMessage("Please log in to get notified.");
    }

    setTimeout(() => {
      setCartMessage("");
    }, 3000);
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      in_stock: "badge-in-stock",
      pre_order: "badge-pre-order",
      out_of_stock: "badge-out-of-stock",
    };

    return statusMap[status] || "";
  };

  const formatStatusLabel = (status) => {
    if (!status) return "";

    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const statusOptions = [
    { value: "in_stock", label: "In Stock" },
    { value: "pre_order", label: "Pre-order" },
    { value: "out_of_stock", label: "Out of Stock" },
  ];

  /*
    Pick the first book with an image for the hero.
    In a larger app, I'd eventually make this a dedicated
    "featured book" coming from the backend.
  */
  const heroBook = books.find((book) => book.cover_image_url);

  return (
    <main className="book-listing-page">
      {/* HERO */}
      <section className="hero-section">
        <div className="hero-content">
          <p className="hero-eyebrow">READ · EXPLORE · GROW</p>

          <h1 className="hero-title">
            Find your next
            <br />
            great story.
          </h1>

          <p className="hero-subtitle">
            Thoughtful reads, real stories and unforgettable voices — carefully
            selected by Stori Zetu.
          </p>

          <a href="#browse-books" className="hero-button">
            Browse Books
            <span>↓</span>
          </a>
        </div>

        {heroBook && (
          <div className="hero-book">
            <div className="hero-book-label">Featured</div>

            <img src={heroBook.cover_image_url} alt={heroBook.title} />

            <div className="hero-book-shadow" />
          </div>
        )}
      </section>

      {/* BOOK SECTION */}
      <section className="books-section" id="browse-books">
        <div className="section-heading">
          <div>
            <p className="section-eyebrow">OUR COLLECTION</p>

            <h2>Browse Books</h2>
          </div>

          {!loading && (
            <span className="book-count">
              {books.length} {books.length === 1 ? "book" : "books"}
            </span>
          )}
        </div>

        {/* FILTERS */}
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
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="16.5" y1="16.5" x2="21" y2="21" />
            </svg>

            <input
              type="text"
              name="search"
              placeholder="Search by title or author..."
              value={filters.search}
              onChange={handleInputChange}
              className="search-input"
            />
          </div>

          <CustomSelect
            options={categoryOptions}
            value={filters.category}
            onChange={(value) => handleFilterChange("category", value)}
            placeholder="All Categories"
          />

          <CustomSelect
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
              Clear
            </button>
          )}
        </div>

        {/* MESSAGE */}
        {cartMessage && <div className="cart-message">{cartMessage}</div>}

        {error && <div className="error-message">{error}</div>}

        {/* BOOKS */}
        {loading ? (
          <div className="loading">
            <div className="loading-spinner" />
            <p>Finding your books...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="no-results">
            <div className="empty-state-icon">
  <span className="material-symbols-outlined">menu_book</span>
</div>

            <h3>No books found</h3>

            <p>Try adjusting your search or filters.</p>

            <button className="btn-primary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="books-grid">
            {books.map((book) => (
              <article key={book.id} className="book-card">
                {/* COVER */}
                <Link to={`/books/${book.id}`} className="book-image">
                  {book.cover_image_url ? (
                    <img src={book.cover_image_url} alt={book.title} />
                  ) : (
                    <div className="book-image-placeholder">
                      <span>{book.title}</span>
                    </div>
                  )}
                </Link>

                {/* INFO */}
                <div className="book-info">
                  <h3 className="book-title">{book.title}</h3>

                  <p className="book-author">{book.author}</p>

                  <div className="book-meta">
                    <span
                      className={`badge ${getStatusBadgeClass(book.status)}`}
                    >
                      {formatStatusLabel(book.status)}
                    </span>

                    {book.stock > 0 && (
                      <span className="stock-info">{book.stock} left</span>
                    )}
                  </div>

                  <p className="book-price">
                    KSh{" "}
                    {Number(book.price).toLocaleString("en-KE", {
                      minimumFractionDigits: 2,
                    })}
                  </p>

                  <div className="book-actions">
                    <Link to={`/books/${book.id}`} className="btn-secondary">
                      View
                    </Link>

                    {book.status === "out_of_stock" ? (
                      <button
                        className="btn-primary"
                        onClick={() => handleNotifyMe(book.id)}
                      >
                        Notify Me
                      </button>
                    ) : (
                      <button
                        className="btn-primary"
                        onClick={() => handleAddToCart(book.id)}
                        disabled={addingToCart === book.id}
                      >
                        {addingToCart === book.id ? "Adding..." : "Add to Cart"}
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
