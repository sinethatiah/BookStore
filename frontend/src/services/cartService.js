import api from './api';

const cartService = {
  getCart: () => api.get('/cart/'),

  addToCart: (bookId, quantity = 1) =>
    api.post('/cart-items/', { book: bookId, quantity }),

  removeFromCart: (cartItemId) => api.delete(`/cart-items/${cartItemId}/`),

  updateQuantity: (cartItemId, quantity) =>
    api.patch(`/cart-items/${cartItemId}/`, { quantity }),
};

export default cartService;