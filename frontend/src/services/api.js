import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const AUTH_PATHS = ['/auth/login/', '/auth/register/', '/auth/refresh/'];
const isAuthRequest = (config) =>
  AUTH_PATHS.some((path) => config?.url?.includes(path));

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && !isAuthRequest(config)) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthRequest(originalRequest)
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refresh_token');
    const hadSession = Boolean(refreshToken || localStorage.getItem('access_token'));

    // A guest has nothing to refresh. Let the caller show "please log in".
    if (!hadSession) return Promise.reject(error);

    originalRequest._retry = true;

    try {
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
        refresh: refreshToken,
      });
      localStorage.setItem('access_token', data.access);
      originalRequest.headers.Authorization = `Bearer ${data.access}`;
      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      // Failed session check on page load is handled by AuthContext. Don't redirect for it.
      const isMeRequest = originalRequest.url?.includes('/auth/me/');
      if (!isMeRequest && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  }
);

export default api;