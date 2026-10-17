import { useState, useEffect } from 'react';
import adminService from '../services/adminService';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
  const [tab, setTab] = useState('orders');

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="admin-tabs">
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>Orders</button>
        <button className={tab === 'books' ? 'active' : ''} onClick={() => setTab('books')}>Books</button>
        <button className={tab === 'categories' ? 'active' : ''} onClick={() => setTab('categories')}>Categories</button>
      </div>

      {tab === 'orders' && <OrdersTab />}
      {tab === 'books' && <BooksTab />}
      {tab === 'categories' && <CategoriesTab />}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await adminService.getAllOrders();
      setOrders(response.data.results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await adminService.updateDeliveryStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      alert('Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="loading">Loading orders...</div>;

  return (
    <table className="admin-table">
      <thead>
        <tr><th>Order #</th><th>Customer</th><th>Total</th><th>Payment</th><th>Delivery Status</th></tr>
      </thead>
      <tbody>
        {orders.map(order => (
          <tr key={order.id}>
            <td>#{order.id}</td>
            <td>{order.username}</td>
            <td>KSh {order.total}</td>
            <td>{order.payment_status}</td>
            <td>
              <select
                value={order.delivery_status}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                disabled={updating === order.id}
              >
                <option value="pending">Pending</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function BooksTab() {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [formData, setFormData] = useState({
    title: '', author: '', isbn: '', description: '',
    price: '', stock: '', category: '', cover_image_url: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [booksRes, catsRes] = await Promise.all([
        adminService.getAllBooks(),
        adminService.getCategories(),
      ]);
      const booksData = booksRes.data?.results || booksRes.data || [];
      const catsData = catsRes.data?.results || catsRes.data || [];
      setBooks(Array.isArray(booksData) ? booksData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
    } catch (err) {
      console.error('Failed to load local inventory:', err);
      setBooks([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Robust search function with Open Library fallback on 503
  const searchBooks = async (query) => {
    try {
      // Try Google Books first (without API key to avoid project quota blocks)
      const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`;
      const res = await fetch(googleUrl);
      
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) return data.items;
      }
      throw new Error('Google Books unavailable, switching to Open Library');
    } catch (googleErr) {
      console.warn('Google Books failed, falling back to Open Library:', googleErr.message);
      
      // Fallback: Open Library API (no 503 rate limits)
      const openLibUrl = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`;
      const res = await fetch(openLibUrl);
      if (!res.ok) throw new Error('Open Library search failed');
      
      const data = await res.json();
      // Normalize Open Library data structure to match Google Books format expected by handleSelectResult
      return (data.docs || []).map(doc => ({
        id: doc.key,
        volumeInfo: {
          title: doc.title,
          authors: doc.author_name ? doc.author_name : ['Unknown author'],
          industryIdentifiers: doc.isbn ? [{ type: 'ISBN_13', identifier: doc.isbn[0] }] : [],
          description: '',
          imageLinks: doc.cover_i ? {
            thumbnail: `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          } : {}
        }
      }));
    }
  };

  // Debounced live search effect
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query || query.length < 3) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const items = await searchBooks(query);
        setSearchResults(items);
      } catch (err) {
        console.error('All book search providers failed:', err);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectResult = (item) => {
    const info = item.volumeInfo;
    
    // Safely extract ISBN
    const isbnObj = info.industryIdentifiers?.find(
      id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    );
    const extractedIsbn = isbnObj ? isbnObj.identifier : '';

    // Clean up HTML tags if Google Books includes them in descriptions (e.g., <p>, <b>)
    const rawDescription = info.description || '';
    const cleanDescription = rawDescription.replace(/<\/?[>]+(>|$)/g, ""); // strip HTML if any

    // Professional fallback only if description is completely missing from the API
    const authorsStr = info.authors ? info.authors.join(', ') : 'Unknown author';
    const finalDescription = cleanDescription.trim() !== '' 
      ? cleanDescription 
      : `An engaging literary work authored by ${authorsStr}, exploring rich narrative themes and compelling storytelling.`;

    setFormData({
      title: info.title || '',
      author: authorsStr,
      isbn: extractedIsbn,
      description: finalDescription,
      price: '',
      stock: '10',
      category: categories[0]?.id || '',
      cover_image_url: info.imageLinks?.thumbnail?.replace('http://', 'https://') || '',
    });
    
    setSearchResults([]);
    setSearchQuery('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminService.createBook(formData);
      setFormData({ title: '', author: '', isbn: '', description: '', price: '', stock: '', category: '', cover_image_url: '' });
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert('Failed to add book. Check fields and try again.');
    }
  };

  const handleStockChange = async (bookId, stock) => {
    try {
      await adminService.updateBook(bookId, { stock: Number(stock) });
      fetchData();
    } catch (err) {
      alert('Failed to update stock.');
    }
  };

  const handleDelete = async (bookId) => {
    if (!confirm('Delete this book?')) return;
    try {
      await adminService.deleteBook(bookId);
      fetchData();
    } catch (err) {
      alert('Failed to delete book.');
    }
  };

  if (loading) return <div className="loading">Loading books...</div>;

  return (
    <div>
      <div className="book-search-section">
        <h3>Find a book to add</h3>
        <div className="book-search-bar" style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Type at least 3 characters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searching && (
            <span style={{ position: 'absolute', right: '12px', top: '12px', fontSize: '0.8rem', color: 'var(--gray)' }}>
              Searching...
            </span>
          )}
        </div>

        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map(item => (
              <div key={item.id} className="search-result-item" onClick={() => handleSelectResult(item)}>
                {item.volumeInfo.imageLinks?.thumbnail && (
                  <img src={item.volumeInfo.imageLinks.thumbnail} alt="" />
                )}
                <div>
                  <strong>{item.volumeInfo.title}</strong>
                  <p>{item.volumeInfo.authors?.join(', ') || 'Unknown author'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button className="btn-secondary toggle-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : 'Or add manually'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-form">
          <input name="title" placeholder="Title" value={formData.title} onChange={handleChange} required />
          <input name="author" placeholder="Author" value={formData.author} onChange={handleChange} required />
          <input name="isbn" placeholder="ISBN" value={formData.isbn} onChange={handleChange} />
          <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
          <input name="price" type="number" step="0.01" placeholder="Price (KSh)" value={formData.price} onChange={handleChange} required />
          <input name="stock" type="number" placeholder="Stock" value={formData.stock} onChange={handleChange} required />
          <select name="category" value={formData.category} onChange={handleChange} required>
            <option value="">Select Category</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <input name="cover_image_url" placeholder="Cover Image URL" value={formData.cover_image_url} onChange={handleChange} />
          {formData.cover_image_url && (
            <img src={formData.cover_image_url} alt="Cover preview" className="cover-preview" />
          )}
          <button type="submit" className="btn-primary">Save Book</button>
        </form>
      )}

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr><th>Title</th><th>Author</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {books.map(book => (
              <tr key={book.id}>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>KSh {book.price}</td>
                <td>
                  <input
                    type="number"
                    defaultValue={book.stock}
                    onBlur={(e) => handleStockChange(book.id, e.target.value)}
                    className="stock-input"
                  />
                </td>
                <td>{book.status}</td>
                <td>
                  <button className="delete-btn" onClick={() => handleDelete(book.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await adminService.getCategories();
      setCategories(response.data.results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || saving) return;

    setSaving(true);
    setError('');

    try {
      await adminService.createCategory({ name: name.trim() });
      setName('');
      fetchCategories();
    } catch (err) {
      const data = err.response?.data;
      if (err.response?.status === 403) {
        setError('Your account is not an admin on this server.');
      } else if (data && typeof data === 'object') {
        setError(Object.values(data).flat().join(' '));
      } else {
        setError('Failed to add category. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading categories...</div>;

  return (
    <div>
      <form onSubmit={handleSubmit} className="admin-form-inline">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
        />
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Adding...' : 'Add'}
        </button>
      </form>

      {error && <div className="error-message">{error}</div>}

      <ul className="category-list">
        {categories.map(cat => <li key={cat.id}>{cat.name}</li>)}
      </ul>
    </div>
  );
}

export default AdminDashboard;