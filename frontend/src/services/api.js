import axios from 'axios';

const api = axios.create({
  // Update to network IP for external access or set VITE_API_URL in .env
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
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

// Warn if using localhost in production
if (import.meta.env.PROD && (!import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL.includes('localhost'))) {
  console.warn('⚠️ WARNING: Using localhost API URL in production build. Ensure VITE_API_URL is correctly set.');
}

export default api;
