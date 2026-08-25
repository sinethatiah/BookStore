import api from './api';

const adminService = {
  getAllOrders: () => api.get('/orders/'),
  updateDeliveryStatus: (orderId, status) =>
    api.patch(`/orders/${orderId}/update_delivery_status/`, { delivery_status: status }),
  getAllBooks: () => api.get('/books/'),
  updateBook: (bookId, data) => api.patch(`/books/${bookId}/`, data),
};

export default adminService;