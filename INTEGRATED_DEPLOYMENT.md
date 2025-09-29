# 🚀 整合部署指南

## 📋 專案結構

```
order-system/
├── server.js              # 後端 API (Railway)
├── client/                # Order System 前端 (Vercel 主頁)
├── pos-system/            # POS 系統前端 (Vercel /pos 路徑)
├── package.json           # 根目錄配置
├── vercel.json           # Vercel 部署配置
├── railway.json          # Railway 部署配置
└── data.local.json       # 共享資料庫
```

## 🎯 部署架構

### 單一 Git 倉庫 → 雙平台部署
- **Railway**: 後端 API (server.js)
- **Vercel**: 前端系統
  - 主頁: Order System (client/)
  - POS: `/pos` 路徑 (pos-system/)

## 📦 第一步：Git 設定

### 1. 初始化 Git 倉庫
```bash
# 在 order-system 目錄下
git init
git add .
git commit -m "Initial commit: Integrated order-system with POS"
```

### 2. 連接到 GitHub
```bash
# 創建 GitHub 倉庫後
git remote add origin https://github.com/YOUR_USERNAME/order-system.git
git branch -M main
git push -u origin main
```

## 🚂 第二步：Railway 部署 (後端)

### 1. 註冊 Railway
- 訪問 [railway.app](https://railway.app)
- 使用 GitHub 登入

### 2. 創建新專案
- 點擊 "New Project"
- 選擇 "Deploy from GitHub repo"
- 選擇您的 `order-system` 倉庫

### 3. 配置環境變數
在 Railway 專案設定中添加：
```
NODE_ENV=production
PORT=3000
```

### 4. 部署設定
- Railway 會自動偵測 `server.js`
- 使用 `npm start` 啟動

### 5. 獲取 Railway URL
部署完成後，記住您的 Railway URL：
```
https://your-app-name.railway.app
```

## ⚡ 第三步：Vercel 部署 (前端)

### 1. 註冊 Vercel
- 訪問 [vercel.com](https://vercel.com)
- 使用 GitHub 登入

### 2. 導入專案
- 點擊 "New Project"
- 選擇您的 `order-system` 倉庫
- 選擇 "order-system" 專案

### 3. 配置構建設定
- **Framework Preset**: Other
- **Build Command**: `npm run build`
- **Output Directory**: `client/build`
- **Install Command**: `npm run install-all`

### 4. 環境變數設定
在 Vercel 專案設定中添加：
```
NODE_ENV=production
REACT_APP_API_URL=https://your-app-name.railway.app
```

### 5. 部署
- 點擊 "Deploy"
- 等待構建完成

## 🔧 第四步：配置更新

### 1. 更新 API 配置
更新 `client/src/config.js` 和 `pos-system/src/config.js`：

```javascript
const config = {
  apiUrl: process.env.REACT_APP_API_URL || 'https://your-app-name.railway.app'
};
```

### 2. 重新部署
```bash
git add .
git commit -m "Update API configuration for production"
git push origin main
```

## 🌐 最終結果

部署完成後，您將擁有：

### 主系統 (Order System)
- **URL**: `https://your-project.vercel.app`
- **功能**: 客戶訂單管理、歷史記錄、管理面板

### POS 系統
- **URL**: `https://your-project.vercel.app/pos`
- **功能**: 現場收銀、庫存管理、銷售歷史

### 後端 API
- **URL**: `https://your-app-name.railway.app`
- **功能**: 共享資料庫、API 服務

## 🔄 日常更新流程

### 1. 本地開發
```bash
# 啟動後端
npm run dev:server

# 啟動 Order System 前端
npm run dev:client

# 啟動 POS 系統前端
npm run dev:pos
```

### 2. 部署更新
```bash
# 提交變更
git add .
git commit -m "Your update message"
git push origin main

# Vercel 和 Railway 會自動重新部署
```

## 📊 監控和管理

### Railway 監控
- 訪問 Railway Dashboard
- 查看後端日誌和性能
- 監控資料庫使用情況

### Vercel 監控
- 訪問 Vercel Dashboard
- 查看前端部署狀態
- 監控訪問統計

## 🛠️ 故障排除

### 常見問題

1. **API 連接失敗**
   - 檢查 Railway URL 是否正確
   - 確認環境變數設定

2. **POS 系統無法訪問**
   - 確認 Vercel 路由配置
   - 檢查 `homepage` 設定

3. **構建失敗**
   - 檢查依賴安裝
   - 確認 Node.js 版本

### 重新部署
```bash
# 清理並重新安裝
npm run clean
npm run install-all
npm run build

# 提交並推送
git add .
git commit -m "Fix deployment issues"
git push origin main
```

## 💰 成本估算

### 免費額度
- **Railway**: $5/月 免費額度
- **Vercel**: 100GB 頻寬/月
- **GitHub**: 公開倉庫免費

### 預估使用量
- 小型商店：完全免費
- 中型商店：可能需要 Railway Pro ($5/月)

## 🎉 完成！

您的整合系統現在已經部署完成！

- **Order System**: 管理客戶訂單
- **POS System**: 現場收銀
- **共享後端**: 統一資料管理

所有系統都使用同一個資料庫，確保資料一致性。
