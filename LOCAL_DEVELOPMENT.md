# 🏠 本地開發指南

本指南將協助您設置與雲端完全一致的本地開發環境。

## 🎯 目標

確保本地開發環境與雲端部署環境功能完全一致，包括：
- 相同的 API 端點
- 相同的資料結構
- 相同的建構流程
- 相同的環境變數處理

## 🚀 快速開始

### 1. 自動設置（推薦）

```bash
# 給腳本執行權限
chmod +x scripts/dev-setup.sh

# 執行自動設置
./scripts/dev-setup.sh
```

### 2. 手動設置

```bash
# 安裝依賴
npm install
cd client && npm install && cd ..

# 創建環境變數檔案
cp env.local .env.local

# 啟動開發伺服器
npm run dev:full
```

## 📋 開發指令

### 基本指令

```bash
# 同時啟動前後端（推薦）
npm run dev:full

# 只啟動後端
npm run dev:server

# 只啟動前端
npm run dev:client

# 建構生產版本
npm run build

# 測試本地部署
npm run test:local

# 清理所有檔案
npm run clean
```

### 進階指令

```bash
# 生產環境建構
npm run build:prod

# 只安裝前端依賴
npm run install-client

# 檢查環境設定
node -e "console.log(require('./env.local'))"
```

## 🌍 環境配置

### 環境變數檔案

- `env.local` - 本地開發環境變數
- `env.production` - 生產環境變數範例
- `.env.local` - 實際使用的本地環境變數（自動生成）

### 重要環境變數

```bash
# 環境設定
NODE_ENV=development
PORT=3000

# API 配置
REACT_APP_API_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000

# 資料庫配置
DATABASE_TYPE=json
DATA_FILE=./data.json
```

## 🔧 開發流程

### 1. 日常開發

```bash
# 啟動開發環境
npm run dev:full

# 在瀏覽器中訪問
# http://localhost:3000
```

### 2. 功能測試

```bash
# 建構並測試
npm run test:local

# 檢查建構結果
ls -la client/build/
```

### 3. 部署準備

```bash
# 執行部署腳本
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

## 📊 資料管理

### 本地資料檔案

- `data.json` - 主要資料檔案
- 包含：用戶、客戶、產品、訂單資料

### 資料備份

```bash
# 備份資料
cp data.json data.backup.$(date +%Y%m%d_%H%M%S).json

# 恢復資料
cp data.backup.20231201_120000.json data.json
```

## 🧪 測試

### 功能測試

1. **登入測試**
   - 管理員：admin / admin123
   - 廚房員工：kitchen / kitchen123

2. **API 測試**
   ```bash
   # 測試 API 端點
   curl http://localhost:3000/api/products
   curl http://localhost:3000/api/customers
   ```

3. **前端測試**
   - 訪問 http://localhost:3000
   - 測試所有頁面功能
   - 檢查響應式設計

### 部署測試

```bash
# 測試本地部署
npm run test:local

# 檢查建構檔案
ls -la client/build/static/
```

## 🚨 故障排除

### 常見問題

1. **端口被佔用**
   ```bash
   # 檢查端口使用情況
   lsof -i :3000
   
   # 終止佔用進程
   kill -9 <PID>
   ```

2. **依賴安裝失敗**
   ```bash
   # 清理並重新安裝
   npm run clean
   npm install
   cd client && npm install
   ```

3. **環境變數問題**
   ```bash
   # 檢查環境變數
   cat .env.local
   
   # 重新創建環境變數檔案
   cp env.local .env.local
   ```

4. **建構失敗**
   ```bash
   # 檢查 Node.js 版本
   node -v
   
   # 清理快取
   npm cache clean --force
   cd client && npm cache clean --force
   ```

### 除錯模式

```bash
# 啟用詳細日誌
DEBUG=* npm run dev:server

# 檢查配置
node -e "console.log(require('./client/src/config.js').default)"
```

## 📱 多平台部署

### Vercel 部署

```bash
# 推送到 GitHub
git add .
git commit -m "Update for deployment"
git push origin main

# Vercel 會自動部署
```

### Railway 部署

```bash
# 確保 railway.json 配置正確
# 推送到 GitHub，Railway 會自動部署
```

### Netlify 部署

```bash
# 確保 netlify.toml 配置正確
# 推送到 GitHub，Netlify 會自動部署
```

## 🔄 版本控制

### Git 工作流程

```bash
# 開發新功能
git checkout -b feature/new-feature
# ... 開發 ...
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# 合併到主分支
git checkout main
git merge feature/new-feature
git push origin main
```

### 部署流程

```bash
# 1. 本地測試
npm run test:local

# 2. 推送到 GitHub
git add .
git commit -m "Ready for deployment"
git push origin main

# 3. 檢查部署狀態
# - Vercel Dashboard
# - Railway Dashboard  
# - Netlify Dashboard
```

## 📈 效能優化

### 開發模式優化

```bash
# 使用生產模式建構進行測試
npm run build:prod
npm start
```

### 監控工具

```bash
# 監控資源使用
top -p $(pgrep -f "node server.js")

# 監控網路請求
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3000/api/products
```

## 🎉 完成檢查清單

- [ ] 本地開發環境正常運行
- [ ] 所有功能測試通過
- [ ] 建構流程正常
- [ ] 環境變數配置正確
- [ ] 資料檔案正常
- [ ] API 端點正常
- [ ] 前端頁面正常
- [ ] 響應式設計正常
- [ ] 部署腳本正常
- [ ] 版本控制正常

---

**現在您可以在本地端進行完全一致的開發，然後部署到雲端！** 🚀
