import api from './api';

const orderService = {
  createOrder: (data) => api.post('/orders/', data),
  getOrders: () => api.get('/orders/'),
  getOrder: (id) => api.get(`/orders/${id}/`),
};

export default orderService;