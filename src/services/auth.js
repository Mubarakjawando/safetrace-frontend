import api from './api';

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (phone_number, password) => {
  const response = await api.post('/auth/login', { phone_number, password });
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('safetrace_token');
  localStorage.removeItem('safetrace_user');
};