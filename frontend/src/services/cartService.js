import api from './api';

const cartService = {
  getCart: () => api.get('/cart/'),

  addToCart: (bookId, quantity = 1) =>
    api.post('/cart-items/', { book: bookId, quantity }),

  removeFromCart: (cartItemId) => api.delete(`/cart-items/${cartItemId}/`),
};

export default cartService;