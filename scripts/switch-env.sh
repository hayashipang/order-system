#!/bin/bash

# 環境切換腳本
# 用法: ./scripts/switch-env.sh [local|production]

ENV_TYPE=${1:-local}

echo "🔄 切換環境配置到: $ENV_TYPE"

case $ENV_TYPE in
  "local")
    echo "📱 切換到地端開發環境..."
    
    # 複製地端配置
    cp env.local .env
    
    # 更新客戶端配置
    cp client/src/config.js client/src/config.js.backup
    cat > client/src/config.js << 'EOF'
// 環境配置
const config = {
  // API 基礎 URL - 地端開發環境
  apiUrl: 'http://localhost:3001',
  
  // 應用程式設定
  app: {
    name: '果然盈訂單管理系統',
    version: '1.0.0'
  },
  
  // 環境資訊
  environment: {
    isDevelopment: true,
    isProduction: false,
    nodeEnv: 'development'
  },
  
  // 是否使用本地存儲（當沒有後端時）
  useLocalStorage: false,
  
  // 除錯模式
  debug: true
};

// 開發模式下顯示配置資訊
if (config.debug) {
  console.log('🔧 應用程式配置:', config);
}

export default config;
EOF
    
    # 更新 POS 系統配置
    cp pos-system/src/services/api.js pos-system/src/services/api.js.backup
    cat > pos-system/src/services/api.js << 'EOF'
import axios from 'axios';

// API 基礎 URL - 地端開發環境
const API_BASE_URL = 'http://localhost:3001';

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
  // 更新產品資訊
  updateProduct: (productId, productData) => api.put(`/api/products/${productId}`, productData),
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
EOF
    
    echo "✅ 已切換到地端開發環境"
    echo "🌐 API 基礎 URL: http://localhost:3001"
    ;;
    
  "production")
    echo "☁️ 切換到雲端生產環境..."
    
    # 複製雲端配置
    cp env.production .env
    
    # 更新客戶端配置
    cp client/src/config.js client/src/config.js.backup
    cp client/src/config.production.js client/src/config.js
    
    # 更新 POS 系統配置
    cp pos-system/src/services/api.js pos-system/src/services/api.js.backup
    cp pos-system/src/services/api.production.js pos-system/src/services/api.js
    
    echo "✅ 已切換到雲端生產環境"
    echo "🌐 API 基礎 URL: https://order-system-production-6ef7.up.railway.app"
    ;;
    
  *)
    echo "❌ 無效的環境類型: $ENV_TYPE"
    echo "用法: $0 [local|production]"
    exit 1
    ;;
esac

echo ""
echo "📋 當前配置:"
echo "   環境類型: $ENV_TYPE"
if [ -f .env ]; then
  echo "   環境檔案: .env"
  grep "REACT_APP_API_URL" .env | head -1
fi
echo ""
echo "💡 提示: 切換環境後，請重新啟動相關服務"
