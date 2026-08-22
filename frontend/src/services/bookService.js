import api from './api';

const bookService = {
  getBooks: (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.status) params.status = filters.status;
    return api.get('/books/', { params });
  },

  getBook: (id) => api.get(`/books/${id}/`),

  notifyMe: (bookId) => api.post(`/books/${bookId}/notify_me/`),
};

export default bookService;