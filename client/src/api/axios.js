import axios from 'axios';

// Log the API URL for debugging
console.log('API URL:', import.meta.env.VITE_API_URL);

// Use environment variable or fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const API = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Add this for credentials
});

// ─── Request interceptor: attach JWT token ───────────────────────────────────
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Log request for debugging
    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor: handle 401 globally ───────────────────────────────
API.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;