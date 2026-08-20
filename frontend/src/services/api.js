import axios from 'axios';

// Safely determine base URL: if running on localhost, use local backend, otherwise use Vercel backend
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const PROD_URL = 'https://hirate-backend.vercel.app/api/v1';
const DEV_URL = 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (isLocal ? DEV_URL : PROD_URL),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (!error.response) {
      console.error('Network Error: Make sure the backend server is running and CORS is configured.', error);
    }
    return Promise.reject(error);
  }
);

export default api;
