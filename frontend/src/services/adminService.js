import api from './api';

const adminService = {
  // Orders
  getAllOrders: () => api.get('/orders/'),
  updateDeliveryStatus: (orderId, status) =>
    api.patch(`/orders/${orderId}/update_delivery_status/`, { delivery_status: status }),

  // Books
  getAllBooks: () => api.get('/books/'),
  createBook: (data) => api.post('/books/', data),
  updateBook: (bookId, data) => api.patch(`/books/${bookId}/`, data),
  deleteBook: (bookId) => api.delete(`/books/${bookId}/`),

  // Categories
  getCategories: () => api.get('/categories/'),
  createCategory: (data) => api.post('/categories/', data),
};

export default adminService;