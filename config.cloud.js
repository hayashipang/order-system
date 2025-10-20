// 雲端生產環境配置
const config = {
  // API 基礎 URL - 雲端生產環境
  apiUrl: 'https://order-system-production-6ef7.up.railway.app',
  
  // 應用程式設定
  app: {
    name: '果然盈訂單管理系統 (雲端)',
    version: '1.0.0'
  },
  
  // 環境資訊
  environment: {
    isDevelopment: false,
    isProduction: true,
    nodeEnv: 'production'
  },
  
  // 是否使用本地存儲（當沒有後端時）
  useLocalStorage: false,
  
  // 除錯模式
  debug: false
};

// 生產模式下顯示配置資訊
console.log('☁️ 雲端生產配置:', config);

export default config;
