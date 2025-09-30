# 果然盈訂單系統 - 配置指南

## 🎯 配置原則

**重要：地端就對地端，雲端就對雲端，不要混亂！**

- **地端開發**：所有服務都指向 `localhost` 端口
- **雲端部署**：所有服務都指向雲端域名
- **絕對不要**：地端配置指向雲端，或雲端配置指向地端

## 🏠 地端開發配置

### 端口分配
- **後端API服務**: `3001`
- **前端管理系統**: `3000` 
- **POS收銀系統**: `3002`

### 配置文件

#### 1. 根目錄 `env.local`
```bash
# 本地開發環境變數
NODE_ENV=development
PORT=3001

# API 配置
REACT_APP_API_URL=http://localhost:3001
API_BASE_URL=http://localhost:3001

# 資料庫配置
DATABASE_TYPE=json
DATA_FILE=./data.json

# 開發模式設定
DEV_MODE=true
HOT_RELOAD=true
```

#### 2. 前端系統 `client/package.json`
```json
{
  "scripts": {
    "start": "PORT=3000 react-scripts start"
  },
  "proxy": "http://localhost:3001"
}
```

#### 3. 前端系統 `client/src/config.js`
```javascript
// 開發環境使用 localhost
return 'http://localhost:3001';
```

#### 4. POS系統 `pos-system/package.json`
```json
{
  "scripts": {
    "start": "PORT=3002 react-scripts start"
  },
  "proxy": "http://localhost:3001"
}
```

#### 5. POS系統 `pos-system/src/services/api.js`
```javascript
// API 基礎 URL - 地端開發時指向本地後端
const API_BASE_URL = 'http://localhost:3001';
```

## ☁️ 雲端部署配置

### 配置文件

#### 1. 根目錄 `env.production`
```bash
# 生產環境變數
NODE_ENV=production
PORT=3000

# API 配置 (部署時會被平台覆蓋)
REACT_APP_API_URL=https://your-app.vercel.app
API_BASE_URL=https://your-app.vercel.app

# 資料庫配置
DATABASE_TYPE=json
DATA_FILE=./data.json

# 生產模式設定
DEV_MODE=false
HOT_RELOAD=false
```

#### 2. 前端系統 `client/vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://your-backend-url.vercel.app/api/$1"
    }
  ]
}
```

## 🚀 啟動地端服務

### 1. 啟動後端API服務 (端口3001)
```bash
cd "/Users/james/Desktop/程式/POS system/order-system"
npm start
```

### 2. 啟動前端管理系統 (端口3000)
```bash
cd "/Users/james/Desktop/程式/POS system/order-system/client"
npm start
```

### 3. 啟動POS收銀系統 (端口3002)
```bash
cd "/Users/james/Desktop/程式/POS system/order-system/pos-system"
npm start
```

## 🔍 配置檢查清單

### 地端開發檢查
- [ ] `env.local` 中 `PORT=3001`
- [ ] `env.local` 中 `API_BASE_URL=http://localhost:3001`
- [ ] `client/package.json` 中 `proxy: "http://localhost:3001"`
- [ ] `client/src/config.js` 中返回 `http://localhost:3001`
- [ ] `pos-system/package.json` 中 `proxy: "http://localhost:3001"`
- [ ] `pos-system/src/services/api.js` 中 `API_BASE_URL = 'http://localhost:3001'`

### 雲端部署檢查
- [ ] `env.production` 中指向雲端域名
- [ ] `client/vercel.json` 中指向雲端後端
- [ ] 所有API調用都指向雲端服務

## ⚠️ 常見問題

### 問題1：POS系統看不到銷售歷史
**原因**：API配置指向雲端服務器
**解決**：檢查 `pos-system/src/services/api.js` 和 `pos-system/package.json` 的配置

### 問題2：前端系統無法連接後端
**原因**：proxy配置錯誤
**解決**：檢查 `client/package.json` 中的proxy設定

### 問題3：後端服務端口錯誤
**原因**：`env.local` 中的PORT設定錯誤
**解決**：確保 `env.local` 中 `PORT=3001`

## 📝 配置變更記錄

### 2025-09-29 修正
- 修正 `env.local` 中API配置指向3001端口
- 修正 `client/package.json` 中proxy指向3001端口
- 修正 `client/src/config.js` 中API URL指向3001端口
- 修正 `pos-system/package.json` 中proxy指向3001端口
- 修正 `pos-system/src/services/api.js` 中API_BASE_URL指向3001端口

---

**記住：地端就對地端，雲端就對雲端，不要混亂！**
