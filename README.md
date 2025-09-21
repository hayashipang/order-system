# 🥬 訂單管理系統

一個基於 React + Node.js 的訂單管理系統，專為蔬果飲品店設計，包含廚房製作清單、客戶訂單管理和產品管理功能。

## ✨ 功能特色

- 🍃 **廚房製作清單**：按產品類型顯示製作數量，支援狀態管理
- 👥 **客戶訂單管理**：完整的客戶資訊和訂單追蹤
- 📊 **一週預覽**：便當盒風格的週訂單概覽
- 📈 **CSV 匯出**：每個客戶獨立 CSV 檔案
- 🔐 **角色管理**：管理員和廚房員工不同權限
- 📱 **響應式設計**：完美適配桌面和行動裝置

## 🏗️ 系統架構

```
Frontend (React)     → GitHub Pages
Backend (Node.js)    → Vercel
Database (SQLite)    → Supabase PostgreSQL
```

## 🚀 快速開始

### 本地開發

1. **安裝依賴**
   ```bash
   # 安裝後端依賴
   npm install
   
   # 安裝前端依賴
   cd client
   npm install
   ```

2. **啟動開發伺服器**
   ```bash
   # 啟動後端 (根目錄)
   node server.js
   
   # 啟動前端 (client 目錄)
   cd client
   npm start
   ```

3. **訪問應用程式**
   - 前端：http://localhost:3000
   - 後端 API：http://localhost:3000/api

### 測試帳號

- **管理員**：admin / admin123
- **廚房員工**：kitchen / kitchen123

## 📁 專案結構

```
order-system/
├── client/                 # React 前端
│   ├── src/
│   │   ├── components/     # React 組件
│   │   ├── App.js         # 主應用程式
│   │   └── index.css      # 樣式檔案
│   ├── public/
│   └── package.json
├── server.js              # Node.js 後端
├── package.json           # 後端依賴
├── orders.db              # SQLite 資料庫
└── README.md
```

## 🔧 技術規格

### 前端
- **框架**：React 18
- **樣式**：原生 CSS3
- **HTTP 客戶端**：Axios
- **建構工具**：Create React App

### 後端
- **運行環境**：Node.js
- **框架**：Express.js
- **資料庫**：SQLite (開發) / PostgreSQL (生產)
- **認證**：簡單的 session 管理

### 資料庫結構
- **customers**：客戶資料
- **orders**：訂單資料
- **order_items**：訂單項目
- **products**：產品資料
- **users**：使用者帳號

## 🌐 部署

### 生產環境部署

1. **前端部署 (GitHub Pages)**
   - 在 GitHub repository 設定中啟用 Pages
   - 選擇 source 為 main 分支
   - 自動部署到 `https://username.github.io/order-system`

2. **後端部署 (Vercel)**
   - 連接 Vercel 到 GitHub repository
   - 設定環境變數
   - 自動部署 API 服務

3. **資料庫部署 (Supabase)**
   - 建立 Supabase 專案
   - 匯入資料庫結構
   - 更新後端連線設定

詳細部署說明請參考 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📊 API 端點

### 認證
- `POST /api/login` - 使用者登入

### 產品管理
- `GET /api/products` - 取得產品清單
- `POST /api/products` - 新增產品
- `PUT /api/products/:id` - 更新產品
- `DELETE /api/products/:id` - 刪除產品

### 客戶管理
- `GET /api/customers` - 取得客戶清單
- `POST /api/customers` - 新增客戶
- `PUT /api/customers/:id` - 更新客戶
- `DELETE /api/customers/:id` - 刪除客戶

### 訂單管理
- `GET /api/orders/customers/:date` - 取得客戶訂單
- `GET /api/kitchen/production/:date` - 取得廚房製作清單
- `POST /api/orders` - 新增訂單
- `PUT /api/orders/:id/status` - 更新訂單狀態

### 週覽功能
- `GET /api/orders/weekly/:startDate` - 取得一週訂單概覽

### 匯出功能
- `GET /api/orders/export/:date` - 匯出 CSV 檔案

## 🎨 介面特色

- **便當盒風格週覽**：直觀的 7 天訂單概覽
- **顏色編碼狀態**：紅色(待製作)、綠色(已完成)
- **響應式設計**：適配各種螢幕尺寸
- **直觀操作**：簡單易用的介面設計

## 🔒 安全性

- 簡單的角色權限控制
- 基本的輸入驗證
- SQL 注入防護
- CORS 設定

## 📄 授權

MIT License - 可自由使用、修改和分發

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request 來改善這個專案！

---

**享受高效的訂單管理！** 🥬✨