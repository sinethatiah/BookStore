import api from './api';

const bookService = {
  getBooks: (filters = {}) => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.status) params.status = filters.status;
    return api.get('/books/', { params });
  },

  getBooks: (filters = {}) => {
  const params = {};
  if (filters.search) params.search = filters.search;
  if (filters.category) params.category = filters.category;
  if (filters.status) params.status = filters.status;
  if (filters.ordering) params.ordering = filters.ordering;
  if (filters.page) params.page = filters.page;
  if (filters.page_size) params.page_size = filters.page_size;
  return api.get('/books/', { params });
},

  notifyMe: (bookId) => api.post(`/books/${bookId}/notify_me/`),
};

export default bookService;