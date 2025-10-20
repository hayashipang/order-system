// 環境配置 - 自動選擇地端或雲端配置
import localConfig from './config.local.js';
import cloudConfig from './config.cloud.js';

// 根據環境變數選擇配置
// 雲端部署時（NODE_ENV=production）使用雲端配置；
// 若顯式設置 REACT_APP_FORCE_CLOUD=true 也使用雲端配置；否則使用本地配置。
const useCloud = process.env.NODE_ENV === 'production' || process.env.REACT_APP_FORCE_CLOUD === 'true';
const config = useCloud ? cloudConfig : localConfig;

// 顯示當前使用的配置
console.log('🔧 當前配置:', config);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 REACT_APP_FORCE_CLOUD:', process.env.REACT_APP_FORCE_CLOUD);

export default config;
