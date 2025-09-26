// 環境配置
const config = {
  // API 基礎 URL - 支援多種環境
  apiUrl: (() => {
    // 1. 優先使用環境變數
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    
    // 2. 生產環境使用當前域名
    if (process.env.NODE_ENV === 'production') {
      return window.location.origin;
    }
    
    // 3. 開發環境使用 localhost
    return 'http://localhost:3000';
  })(),
  
  // 應用程式設定
  app: {
    name: '果然盈訂單管理系統',
    version: '1.0.0'
  },
  
  // 環境資訊
  environment: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    nodeEnv: process.env.NODE_ENV
  },
  
  // 是否使用本地存儲（當沒有後端時）
  useLocalStorage: false,
  
  // 除錯模式
  debug: process.env.NODE_ENV === 'development'
};

// 開發模式下顯示配置資訊
if (config.debug) {
  console.log('🔧 應用程式配置:', config);
}

export default config;
