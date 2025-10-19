// 環境配置 - 自動選擇地端或雲端配置
import localConfig from './config.local.js';
import cloudConfig from './config.cloud.js';

// 根據環境變數選擇配置
// 雲端部署時 NODE_ENV 為 production，地端開發時為 development
const config = process.env.NODE_ENV === 'production' ? cloudConfig : localConfig;

// 顯示當前使用的配置
console.log('🔧 當前配置:', config);

export default config;
