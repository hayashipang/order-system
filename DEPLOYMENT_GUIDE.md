# 🚀 雲端部署完整指南

## 📋 部署架構

```
┌─────────────────┐    ┌─────────────────┐
│   Vercel        │    │   Railway        │
│   (前端)        │    │   (後端)        │
│                 │    │                 │
│   React App     │◄──►│   Node.js API   │
│   Static Files  │    │   PostgreSQL    │
└─────────────────┘    └─────────────────┘
```

## 🎯 部署流程

### 步驟 1: 準備工作

1. **安裝部署工具**
   ```bash
   npm install -g vercel @railway/cli
   ```

2. **登入服務**
   ```bash
   vercel login
   railway login
   ```

### 步驟 2: 設定 Railway PostgreSQL

1. **創建 Railway 專案**
   - 前往 https://railway.app
   - 點擊 "New Project"
   - 選擇 "Provision PostgreSQL"

2. **獲取資料庫連接字串**
   - 點擊 PostgreSQL 服務
   - 切換到 "Variables" 頁籤
   - 複製 "DATABASE_URL"

3. **設定環境變數**
   - 在 Railway 專案中設定 `DATABASE_URL`
   - 設定 `NODE_ENV=production`

### 步驟 3: 部署後端到 Railway

1. **連接 GitHub 專案**
   ```bash
   railway link
   ```

2. **部署**
   ```bash
   railway up
   ```

3. **設定環境變數**
   - 在 Railway Dashboard 中設定 `DATABASE_URL`
   - 設定 `NODE_ENV=production`

### 步驟 4: 部署前端到 Vercel

1. **建構前端**
   ```bash
   cd client
   npm run build
   ```

2. **部署到 Vercel**
   ```bash
   vercel --prod
   ```

3. **設定環境變數**
   - 在 Vercel Dashboard 中設定 `REACT_APP_API_URL`
   - 值為你的 Railway 後端 URL

### 步驟 5: 一鍵部署 (可選)

```bash
node deploy.js
```

## 🔧 環境變數設定

### Railway (後端)
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
NODE_ENV=production
PORT=3001
```

### Vercel (前端)
```env
REACT_APP_API_URL=https://your-app-name.up.railway.app
```

## 📊 部署後檢查

### 1. 檢查後端健康狀態
```bash
curl https://your-app-name.up.railway.app/api/health
```

### 2. 檢查前端是否正常載入
- 訪問 Vercel 提供的 URL
- 確認 API 調用正常

### 3. 檢查資料庫連接
- 在 Railway Dashboard 中查看 PostgreSQL 服務狀態
- 確認資料庫表格已創建

## 🛠️ 本地開發 vs 雲端部署

### 本地開發
```bash
npm run dev          # 使用 SQLite
npm run dev-json     # 使用 JSON 文件
```

### 雲端部署
```bash
npm start            # 使用 PostgreSQL (Railway)
```

## 🔄 資料庫遷移

### 從本地 SQLite 遷移到雲端 PostgreSQL

1. **導出本地數據**
   ```bash
   # 手動備份 order_system.db 文件
   ```

2. **在雲端初始化資料庫**
   ```bash
   # Railway 會自動創建表格
   ```

3. **重新導入數據**
   - 通過前端界面重新創建數據
   - 或使用 API 批量導入

## 🚨 常見問題

### 1. CORS 錯誤
- 確認 Vercel 的 `REACT_APP_API_URL` 設定正確
- 檢查 Railway 的 CORS 設定

### 2. 資料庫連接失敗
- 確認 Railway 的 `DATABASE_URL` 設定正確
- 檢查 PostgreSQL 服務是否正常運行

### 3. 環境變數未生效
- 重新部署服務
- 檢查環境變數名稱是否正確

## 💰 費用說明

### Railway (免費方案)
- 資料庫: 1GB
- 每月請求: 500,000 次
- 足夠小型專案使用

### Vercel (免費方案)
- 每月請求: 100,000 次
- 頻寬: 100GB
- 足夠小型專案使用

## 🎉 完成！

部署完成後，你的系統將：
- ✅ 使用雲端 PostgreSQL 資料庫
- ✅ 前端部署在 Vercel
- ✅ 後端部署在 Railway
- ✅ 支援多用戶同時使用
- ✅ 數據持久化存儲
- ✅ 自動擴展和備份

---

**現在你可以專注於功能開發，不用擔心部署問題！** 🚀