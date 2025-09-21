// 環境配置
const config = {
  // API 基礎 URL
  apiUrl: process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL || 'https://your-vercel-app.vercel.app'
    : 'http://localhost:3000',
  
  // 應用程式設定
  app: {
    name: '訂單管理系統',
    version: '1.0.0'
  }
};

export default config;
