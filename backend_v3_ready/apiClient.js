// ===========================================
// GreenWin Backend v3 API Client
// ===========================================

// 方法一：使用 Axios
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// 響應攔截器
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ===========================================
// API 服務類別
// ===========================================

class GreenWinAPI {
  // 系統狀態
  async getHealth() {
    const response = await apiClient.get('/api/health');
    return response.data;
  }

  // 訂單管理
  async getOrders() {
    const response = await apiClient.get('/api/orders');
    return response.data;
  }

  async createOrder(orderData) {
    const response = await apiClient.post('/api/orders', orderData);
    return response.data;
  }

  async getUncompletedOrders(date) {
    const response = await apiClient.get('/api/orders/uncompleted', {
      params: { date }
    });
    return response.data;
  }

  // 排程管理
  async confirmScheduling(orderIds, selectedDate, manufacturingQuantities) {
    const response = await apiClient.post('/api/scheduling/confirm', {
      orderIds,
      selectedDate,
      manufacturingQuantities
    });
    return response.data;
  }

  // 廚房管理
  async getKitchenProduction(date) {
    const response = await apiClient.get(`/api/kitchen/production/${date}`);
    return response.data;
  }

  async updateProductStatus(date, productName, status) {
    const encodedProductName = encodeURIComponent(productName);
    const response = await apiClient.put(
      `/api/kitchen/production/${date}/${encodedProductName}/status`,
      { status }
    );
    return response.data;
  }

  // 庫存管理
  async getInventoryScheduling(date) {
    const response = await apiClient.get('/api/inventory/scheduling', {
      params: { date }
    });
    return response.data;
  }

  // 產品管理
  async getProducts() {
    const response = await apiClient.get('/api/products');
    return response.data;
  }

  // 客戶管理
  async getCustomers() {
    const response = await apiClient.get('/api/customers');
    return response.data;
  }

  // 訂單項目
  async getOrderItems() {
    const response = await apiClient.get('/api/order-items');
    return response.data;
  }
}

// 創建 API 實例
const greenWinAPI = new GreenWinAPI();

export default greenWinAPI;

// ===========================================
// 使用範例
// ===========================================

// 範例 1: 檢查系統狀態
export const checkSystemHealth = async () => {
  try {
    const health = await greenWinAPI.getHealth();
    console.log('系統狀態:', health);
    return health;
  } catch (error) {
    console.error('系統檢查失敗:', error);
    throw error;
  }
};

// 範例 2: 建立排程
export const createSchedule = async (orderIds, selectedDate, quantities) => {
  try {
    const result = await greenWinAPI.confirmScheduling(
      orderIds,
      selectedDate,
      quantities
    );
    console.log('排程建立成功:', result);
    return result;
  } catch (error) {
    console.error('排程建立失敗:', error);
    throw error;
  }
};

// 範例 3: 廚房標記完成
export const markProductCompleted = async (date, productName) => {
  try {
    const result = await greenWinAPI.updateProductStatus(
      date,
      productName,
      'completed'
    );
    console.log('產品標記完成:', result);
    return result;
  } catch (error) {
    console.error('標記完成失敗:', error);
    throw error;
  }
};

// 範例 4: 取得廚房生產清單
export const getKitchenProductionList = async (date) => {
  try {
    const productionList = await greenWinAPI.getKitchenProduction(date);
    console.log('廚房生產清單:', productionList);
    return productionList;
  } catch (error) {
    console.error('取得生產清單失敗:', error);
    throw error;
  }
};

// ===========================================
// React Hook 範例
// ===========================================

import { useState, useEffect } from 'react';

// 使用系統狀態的 Hook
export const useSystemHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setLoading(true);
        const healthData = await greenWinAPI.getHealth();
        setHealth(healthData);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
  }, []);

  return { health, loading, error };
};

// 使用訂單列表的 Hook
export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await greenWinAPI.getOrders();
      setOrders(ordersData);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return { orders, loading, error, refetch: fetchOrders };
};

// 使用廚房生產清單的 Hook
export const useKitchenProduction = (date) => {
  const [productionList, setProductionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProduction = async () => {
    if (!date) return;
    
    try {
      setLoading(true);
      const productionData = await greenWinAPI.getKitchenProduction(date);
      setProductionList(productionData);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduction();
  }, [date]);

  return { productionList, loading, error, refetch: fetchProduction };
};

// ===========================================
// 方法二：使用原生 Fetch API
// ===========================================

class FetchAPI {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🚀 Fetch Request: ${config.method || 'GET'} ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Fetch Response: ${response.status} ${url}`);
      return data;
    } catch (error) {
      console.error(`❌ Fetch Error: ${url}`, error);
      throw error;
    }
  }

  // GET 請求
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST 請求
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT 請求
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE 請求
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// 創建 Fetch API 實例
export const fetchAPI = new FetchAPI();

// ===========================================
// Fetch API 使用範例
// ===========================================

// 範例 1: 使用 Fetch 取得訂單
export const fetchOrders = async () => {
  try {
    const orders = await fetchAPI.get('/api/orders');
    console.log('訂單列表:', orders);
    return orders;
  } catch (error) {
    console.error('取得訂單失敗:', error);
    throw error;
  }
};

// 範例 2: 使用 Fetch 建立排程
export const fetchCreateSchedule = async (orderIds, selectedDate, quantities) => {
  try {
    const result = await fetchAPI.post('/api/scheduling/confirm', {
      orderIds,
      selectedDate,
      manufacturingQuantities: quantities
    });
    console.log('排程建立成功:', result);
    return result;
  } catch (error) {
    console.error('排程建立失敗:', error);
    throw error;
  }
};

// 範例 3: 使用 Fetch 標記完成
export const fetchMarkCompleted = async (date, productName) => {
  try {
    const encodedProductName = encodeURIComponent(productName);
    const result = await fetchAPI.put(
      `/api/kitchen/production/${date}/${encodedProductName}/status`,
      { status: 'completed' }
    );
    console.log('標記完成成功:', result);
    return result;
  } catch (error) {
    console.error('標記完成失敗:', error);
    throw error;
  }
};

// ===========================================
// 錯誤處理工具
// ===========================================

export const handleAPIError = (error) => {
  if (error.response) {
    // 伺服器回應錯誤
    const { status, data } = error.response;
    console.error(`API Error ${status}:`, data);
    return {
      type: 'api_error',
      status,
      message: data.message || data.error || 'API 請求失敗',
      details: data
    };
  } else if (error.request) {
    // 網路錯誤
    console.error('Network Error:', error.request);
    return {
      type: 'network_error',
      message: '網路連線失敗，請檢查網路狀態',
      details: error.request
    };
  } else {
    // 其他錯誤
    console.error('Unknown Error:', error.message);
    return {
      type: 'unknown_error',
      message: error.message || '未知錯誤',
      details: error
    };
  }
};

// ===========================================
// 環境設定
// ===========================================

export const API_CONFIG = {
  development: {
    baseURL: 'http://localhost:3000',
    timeout: 10000,
  },
  production: {
    baseURL: process.env.REACT_APP_API_URL || 'https://your-api-domain.com',
    timeout: 15000,
  },
};

// 根據環境選擇配置
export const getAPIConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return API_CONFIG[env];
};
