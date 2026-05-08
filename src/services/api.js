import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ====================================================
// F2C App - API Service
// Replace BASE_URL with your actual backend URL
// ====================================================

const BASE_URL = 'https://api.f2capp.com/v1'; // Replace with your API URL

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor - Add JWT token to every request
api.interceptors.request.use(
  async config => {
    try {
      const token = await AsyncStorage.getItem('@F2C_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.log('Token error:', error);
    }
    return config;
  },
  error => Promise.reject(error),
);

// Response Interceptor - Handle errors globally
api.interceptors.response.use(
  response => response.data,
  async error => {
    if (error.response?.status === 401) {
      // Token expired - logout user
      await AsyncStorage.multiRemove([
        '@F2C_token',
        '@F2C_user',
        '@F2C_userType',
      ]);
    }
    return Promise.reject(error.response?.data || error.message);
  },
);

// ====================================================
// AUTH APIs
// ====================================================
export const authAPI = {
  login: (email, password) => api.post('/auth/login', {email, password}),

  register: userData => api.post('/auth/register', userData),

  forgotPassword: email => api.post('/auth/forgot-password', {email}),

  resetPassword: (token, password) =>
    api.post('/auth/reset-password', {token, password}),

  refreshToken: () => api.post('/auth/refresh'),
};

// ====================================================
// PRODUCT APIs
// ====================================================
export const productAPI = {
  getAll: params => api.get('/products', {params}),

  getById: id => api.get(`/products/${id}`),

  getFeatured: () => api.get('/products/featured'),

  getByCategory: category => api.get(`/products/category/${category}`),

  getByFarmer: farmerId => api.get(`/products/farmer/${farmerId}`),

  create: productData => api.post('/products', productData),

  update: (id, productData) => api.put(`/products/${id}`, productData),

  delete: id => api.delete(`/products/${id}`),

  search: query => api.get('/products/search', {params: {q: query}}),
};

// ====================================================
// FARMER APIs
// ====================================================
export const farmerAPI = {
  getAll: () => api.get('/farmers'),

  getById: id => api.get(`/farmers/${id}`),

  getFeatured: () => api.get('/farmers/featured'),

  verifyQR: qrCode => api.post('/farmers/verify-qr', {qrCode}),

  updateProfile: data => api.put('/farmers/profile', data),

  uploadStoryVideo: videoData => api.post('/farmers/story-video', videoData),

  getDashboardStats: () => api.get('/farmers/dashboard'),
};

// ====================================================
// ORDER APIs
// ====================================================
export const orderAPI = {
  create: orderData => api.post('/orders', orderData),

  getMyOrders: () => api.get('/orders/my'),

  getById: id => api.get(`/orders/${id}`),

  updateStatus: (id, status) => api.put(`/orders/${id}/status`, {status}),

  cancel: id => api.put(`/orders/${id}/cancel`),
};

// ====================================================
// CART APIs (Backup - use local CartContext primarily)
// ====================================================
export const cartAPI = {
  get: () => api.get('/cart'),

  add: (productId, quantity) => api.post('/cart', {productId, quantity}),

  update: (productId, quantity) => api.put(`/cart/${productId}`, {quantity}),

  remove: productId => api.delete(`/cart/${productId}`),

  clear: () => api.delete('/cart'),
};

export default api;
