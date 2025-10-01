// 地端開發環境配置
const config = {
  // API 基礎 URL - 地端開發環境
  apiUrl: 'http://localhost:3001',
  
  // 應用程式設定
  app: {
    name: '果然盈訂單管理系統 (地端開發)',
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
  console.log('🔧 地端開發配置:', config);
}

export default config;
