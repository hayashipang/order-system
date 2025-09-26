# 果然盈訂單管理系統 - 雲端部署指南

## 📋 系統概述

這是一個專為蔬果飲品店設計的訂單管理系統，包含：
- **前端**: React.js 應用程式
- **後端**: Node.js + Express.js API
- **資料庫**: JSON 檔案存儲
- **功能**: 訂單管理、客戶管理、產品管理、廚房製作清單、客戶訂單查詢

## 🚀 部署平台

本系統支援多個雲端平台部署：

### 1. Vercel 部署 (推薦)
- **優點**: 自動部署、CDN 加速、免費額度充足
- **適用**: 前端 + 後端 API 同時部署

### 2. Railway 部署
- **優點**: 簡單易用、支援持久化存儲
- **適用**: 需要持久化資料的場景

### 3. GitHub Pages
- **優點**: 免費、與 GitHub 整合
- **限制**: 僅支援靜態網站

## 📦 部署前準備

### 1. 環境要求
- Node.js >= 18.0.0
- npm >= 8.0.0
- Git

### 2. 本地測試
```bash
# 安裝依賴
npm install
cd client && npm install && cd ..

# 建置生產版本
npm run build

# 本地測試生產版本
npm start
```

## 🌐 Vercel 部署

### 步驟 1: 準備 GitHub 倉庫
```bash
# 初始化 Git 倉庫
git init
git add .
git commit -m "Initial commit: 果然盈訂單管理系統"

# 推送到 GitHub
git remote add origin https://github.com/yourusername/order-system.git
git push -u origin main
```

### 步驟 2: 連接 Vercel
1. 訪問 [Vercel](https://vercel.com)
2. 使用 GitHub 帳號登入
3. 點擊 "New Project"
4. 選擇你的 GitHub 倉庫
5. 配置設定：
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `client/build`
   - **Install Command**: `npm install`

### 步驟 3: 環境變數設定
在 Vercel 專案設定中添加：
```
NODE_ENV=production
```

### 步驟 4: 部署
- Vercel 會自動檢測 `vercel.json` 配置
- 每次推送到 main 分支會自動觸發部署

## 🚂 Railway 部署

### 步驟 1: 準備專案
確保 `railway.json` 配置正確

### 步驟 2: 連接 Railway
1. 訪問 [Railway](https://railway.app)
2. 使用 GitHub 帳號登入
3. 點擊 "New Project" → "Deploy from GitHub repo"
4. 選擇你的倉庫

### 步驟 3: 配置設定
- Railway 會自動檢測 `railway.json`
- 設定環境變數：
  ```
  NODE_ENV=production
  PORT=3000
  ```

### 步驟 4: 部署
- Railway 會自動建置和部署
- 提供一個 `.railway.app` 域名

## 📄 GitHub Pages 部署

### 步驟 1: 建置靜態版本
```bash
# 建置前端
cd client
npm run build

# 將建置檔案移到根目錄
cp -r build/* ../
```

### 步驟 2: 配置 GitHub Pages
1. 在 GitHub 倉庫設定中啟用 Pages
2. 選擇 "Deploy from a branch"
3. 選擇 `main` 分支和 `/` 根目錄

## 🔧 環境變數配置

### 開發環境
```bash
# env.local
NODE_ENV=development
PORT=3000
REACT_APP_API_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000
```

### 生產環境
```bash
# 各平台會自動設定
NODE_ENV=production
PORT=3000
REACT_APP_API_URL=https://your-domain.com
API_BASE_URL=https://your-domain.com
```

## 📊 資料持久化

### Vercel
- 使用 JSON 檔案存儲
- 每次部署會重置資料
- 適合測試和演示

### Railway
- 支援持久化存儲
- 資料不會因部署而丟失
- 適合生產環境

## 🔍 故障排除

### 常見問題

1. **建置失敗**
   ```bash
   # 清除快取重新安裝
   rm -rf node_modules client/node_modules
   npm install
   cd client && npm install
   ```

2. **API 路由 404**
   - 檢查 `vercel.json` 路由配置
   - 確認 API 路徑以 `/api/` 開頭

3. **環境變數未生效**
   - 檢查平台環境變數設定
   - 確認變數名稱正確

4. **CORS 錯誤**
   - 檢查 `server.js` 中的 CORS 配置
   - 確認允許的來源域名

### 日誌查看
- **Vercel**: 在專案 Dashboard 的 Functions 頁面
- **Railway**: 在專案 Dashboard 的 Deployments 頁面

## 📈 效能優化

### 前端優化
- 使用 React.memo 減少重渲染
- 實作虛擬滾動處理大量資料
- 壓縮圖片和靜態資源

### 後端優化
- 實作 API 快取
- 使用資料庫索引
- 實作分頁查詢

## 🔒 安全性考量

### 生產環境
- 使用 HTTPS
- 實作 API 速率限制
- 驗證輸入資料
- 使用環境變數存儲敏感資訊

### 資料備份
- 定期備份 JSON 資料檔案
- 實作資料匯出功能
- 考慮使用雲端資料庫

## 📞 支援

如有問題，請：
1. 檢查本文件中的故障排除部分
2. 查看 GitHub Issues
3. 聯繫開發團隊

---

**部署完成後，您的訂單管理系統將可以在雲端正常運行！** 🎉