// 環境配置 - 自動選擇地端或雲端配置
import localConfig from './config.local.js';
import cloudConfig from './config.cloud.js';

// 根據環境變數選擇配置
// 本地開發時強制使用本地配置（localhost 或 127.0.0.1）
// 雲端部署時使用雲端配置
const isLocalDev = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' || 
                   window.location.hostname === '';
const useCloud = !isLocalDev && process.env.REACT_APP_FORCE_CLOUD === 'true';
const config = useCloud ? cloudConfig : localConfig;


export default config;
