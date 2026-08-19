import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../services/bookService';
import categoryService from '../services/categoryService';
import cartService from '../services/cartService';
import '../styles/BookListing.css';

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

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        setCategories(response.data);
      } catch (err) {
        console.error('Failed to fetch categories', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch books based on filters
  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await bookService.getBooks(filters);
        setBooks(response.data);
      } catch (err) {
        setError('Failed to fetch books. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
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

  const getStatusBadge = (status) => {
    const statusMap = {
      'in_stock': 'in-stock',
      'pre_order': 'pre-order',
      'out_of_stock': 'out-of-stock',
    };
    return statusMap[status] || status;
  };

  return (
    <div className="book-listing-page">
      <div className="filters-section">
        <h2>Browse Books</h2>
        
        <div className="filters">
          <div className="filter-group">
            <input
              type="text"
              name="search"
              placeholder="Search books..."
              value={filters.search}
              onChange={handleFilterChange}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="in_stock">In Stock</option>
              <option value="pre_order">Pre-order</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
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
          {books.map(book => (
            <div key={book.id} className="book-card">
              {book.cover_image_url && (
                <div className="book-image">
                  <img src={book.cover_image_url} alt={book.title} />
                </div>
              )}
              
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                <p className="book-author">{book.author}</p>
                
                <div className="book-meta">
                  <span className={`status-badge ${getStatusBadge(book.status)}`}>
                    {book.status.replace('_', ' ').toUpperCase()}
                  </span>
                  {book.stock > 0 && (
                    <span className="stock-info">{book.stock} in stock</span>
                  )}
                </div>
                
                <p className="book-price">${book.price}</p>
                
                <div className="book-actions">
                  <Link to={`/books/${book.id}`} className="btn-secondary">
                    View Details
                  </Link>
                  <button
                    onClick={() => handleAddToCart(book.id)}
                    disabled={book.status === 'out_of_stock' || addingToCart === book.id}
                    className="btn-primary"
                  >
                    {addingToCart === book.id ? 'Adding...' : 'Add to Cart'}
                  </button>
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