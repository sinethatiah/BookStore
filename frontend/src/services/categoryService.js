import api from './api';

const categoryService = {
  getCategories: () => api.get('/categories/'),
};

export default categoryService;