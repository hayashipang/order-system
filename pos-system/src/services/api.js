import axios from 'axios';

// API 基礎 URL - 指向 order-system 的後端
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// 響應攔截器
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// 產品相關 API
export const productAPI = {
  // 取得所有產品列表
  getProducts: () => api.get('/api/shared/products'),
};

// 訂單相關 API
export const orderAPI = {
  // 創建現場銷售訂單
  createPOSOrder: (orderData) => api.post('/api/shared/pos-orders', orderData),
  
  // 取得歷史訂單
  getOrderHistory: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/api/shared/orders/history?${queryString}`);
  },
  
  // 刪除訂單
  deleteOrder: (orderId) => api.delete(`/api/orders/${orderId}`),
};

// 報表相關 API
export const reportAPI = {
  // 取得日報表
  getDailyReport: (date) => api.get(`/api/shared/reports/daily/${date}`),
};

// 客戶相關 API
export const customerAPI = {
  // 取得所有客戶列表
  getCustomers: () => api.get('/api/shared/customers'),
};

export default api;
