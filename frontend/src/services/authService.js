import api from './api';

const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    localStorage.setItem('access_token', response.data.access);
    localStorage.setItem('refresh_token', response.data.refresh);
    return response.data;
  },

  register: async (formData) => {
    const { username, email, password, phone_number } = formData;
    const response = await api.post('/auth/register/', {
      username,
      email,
      password,
      phone_number,
    });
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getMe: async () => {
    const response = await api.get('/auth/me/');
    return response.data;
  },
};

export default authService;