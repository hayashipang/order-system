// 環境配置
const config = {
  // API 基礎 URL
  apiUrl: process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL || window.location.origin
    : 'http://localhost:3000',
  
  // 應用程式設定
  app: {
    name: '訂單管理系統',
    version: '1.0.0'
  },
  
  // 是否使用本地存儲（當沒有後端時）
  useLocalStorage: !process.env.REACT_APP_API_URL && process.env.NODE_ENV === 'production'
};

export default config;
