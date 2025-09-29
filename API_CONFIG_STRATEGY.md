# API 配置策略

## 🎯 配置原則

### 地端開發環境
- **POS系統API**: `http://localhost:3000`
- **用途**: 本地開發和測試
- **配置位置**: 
  - `pos-system/src/services/api.js` → `API_BASE_URL = 'http://localhost:3000'`
  - `pos-system/package.json` → `"proxy": "http://localhost:3000"`

### 雲端生產環境
- **POS系統API**: `https://order-system-production-6ef7.up.railway.app`
- **用途**: 雲端部署和生產使用
- **配置位置**: 
  - `pos-system/src/services/api.js` → `API_BASE_URL = 'https://order-system-production-6ef7.up.railway.app'`
  - `pos-system/package.json` → `"proxy": "https://order-system-production-6ef7.up.railway.app"`

## 🔄 部署流程

### 地端開發
1. 確保API配置指向 `http://localhost:3000`
2. 啟動地端後端: `npm run dev:server`
3. 啟動地端POS: `npm run dev:pos`

### 雲端部署
1. **部署前**: 修改API配置指向雲端
2. **部署**: 使用 `npm run deploy:quick` 或 `npm run deploy:full`
3. **部署後**: 雲端POS系統自動使用雲端API

## ⚠️ 注意事項

- **不要混用**: 地端開發時不要連到雲端API
- **部署前檢查**: 確保API配置正確
- **測試分離**: 地端測試地端，雲端測試雲端

## 🛠️ 快速切換腳本

### 切換到地端配置
```bash
# 修改 pos-system/src/services/api.js
API_BASE_URL = 'http://localhost:3000'

# 修改 pos-system/package.json
"proxy": "http://localhost:3000"
```

### 切換到雲端配置
```bash
# 修改 pos-system/src/services/api.js
API_BASE_URL = 'https://order-system-production-6ef7.up.railway.app'

# 修改 pos-system/package.json
"proxy": "https://order-system-production-6ef7.up.railway.app"
```
