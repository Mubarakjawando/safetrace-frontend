import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically attach the JWT token to every request, once logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('safetrace_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;