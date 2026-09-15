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
      setBooks(booksRes.data.results);
      setCategories(catsRes.data.results);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=5`
      );
      const data = await response.json();
      setSearchResults(data.items || []);
    } catch (err) {
      alert('Search failed. Please try again or enter details manually.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (item) => {
    const info = item.volumeInfo;
    const isbnObj = info.industryIdentifiers?.find(
      id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    );

    setFormData({
      title: info.title || '',
      author: info.authors ? info.authors.join(', ') : '',
      isbn: isbnObj ? isbnObj.identifier : '',
      description: info.description || '',
      price: '',
      stock: '',
      category: '',
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
      alert('Failed to add book. Check the fields and try again.');
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
        <div className="book-search-bar">
          <input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn-primary" onClick={handleSearch} disabled={searching}>
            {searching ? 'Searching...' : 'Search'}
          </button>
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

      <button className="btn-secondary" onClick={() => setShowForm(!showForm)}>
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
  );
}

function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

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
    if (!name.trim()) return;
    try {
      await adminService.createCategory({ name });
      setName('');
      fetchCategories();
    } catch (err) {
      alert('Failed to add category.');
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
        <button type="submit" className="btn-primary">Add</button>
      </form>

      <ul className="category-list">
        {categories.map(cat => <li key={cat.id}>{cat.name}</li>)}
      </ul>
    </div>
  );
}

export default AdminDashboard;