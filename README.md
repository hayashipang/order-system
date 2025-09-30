# 果然盈整合管理系統

一個專為蔬果飲品店設計的完整管理系統，包含訂單管理和現場收銀 POS 系統。

## 🌟 系統組成

### 📋 Order System (訂單管理系統)
- 📋 **訂單管理**: 創建、編輯、刪除訂單，支援贈送商品功能
- 👥 **客戶管理**: 客戶資料維護，支援搜尋和篩選
- 🛍️ **產品管理**: 產品資訊管理，價格設定
- 🎁 **贈送功能**: 支援贈送商品（負價格），廚房和客戶端都會標註
- 🍳 **廚房製作清單**: 按日期查看製作需求，狀態管理
- 📊 **客戶訂單查詢**: 歷史訂單查詢和篩選，支援客戶搜尋
- 📈 **週報表**: 週訂單統計和趨勢分析
- 📤 **CSV 匯出**: 訂單資料匯出功能
- 🔐 **權限管理**: 管理員和廚房員工角色分離
- 🔍 **智能搜尋**: 客戶搜尋支援姓名、電話、地址關鍵字

### 💰 POS System (現場收銀系統)
- 🛒 **產品選擇**: 即時庫存顯示，缺貨商品自動停售
- 🔢 **虛擬鍵盤**: 實體 POS 機風格的數字鍵盤輸入
- 💳 **多種付款**: 支援現金和信用卡付款
- 📊 **銷售歷史**: 即時銷售記錄，今日總銷售統計
- 🗑️ **記錄管理**: 支援刪除錯誤的銷售記錄
- 🔄 **即時同步**: 現場銷售自動同步到訂單系統歷史

## 🏗️ 技術架構

- **前端**: React.js 18, React Router, Axios
- **後端**: Node.js, Express.js
- **資料庫**: JSON 檔案存儲
- **部署**: 支援 Vercel, Railway, GitHub Pages
- **UI**: 響應式設計，支援多種螢幕尺寸

## 🚀 快速開始

### 環境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### ⚠️ 重要配置說明

**地端就對地端，雲端就對雲端，不要混亂！**

詳細配置說明請參考：[CONFIGURATION_GUIDE.md](./CONFIGURATION_GUIDE.md)

### 地端開發環境設置

1. **克隆專案**
   ```bash
   git clone https://github.com/james/order-system.git
   cd order-system
   ```

2. **快速啟動 (推薦)**
   ```bash
   ./start-local.sh
   ```
   
   或手動啟動：

3. **檢查地端配置**
   ```bash
   npm run setup:local
   ```

4. **安裝依賴**
   ```bash
   npm run install-all
   ```

5. **啟動開發服務器**
   ```bash
   # 終端 1: 啟動後端 (port 3001)
   npm run dev:server
   
   # 終端 2: 啟動 Order System 前端 (port 3000)
   npm run dev:client
   
   # 終端 3: 啟動 POS System 前端 (port 3002)
   npm run dev:pos
   ```

5. **地端網址**
   - **Order System**: http://localhost:3001
   - **POS System**: http://localhost:3002
   - **Backend API**: http://localhost:3000

### 預設帳號
- **管理員**: admin / admin123
- **廚房員工**: kitchen / kitchen123

## 📁 專案結構

```
order-system/
├── client/                 # React 前端應用
│   ├── src/
│   │   ├── components/     # React 組件
│   │   │   ├── AdminPanel.js      # 管理員面板
│   │   │   ├── CustomerOrders.js  # 客戶訂單
│   │   │   ├── KitchenDashboard.js # 廚房儀表板
│   │   │   ├── Login.js           # 登入頁面
│   │   │   └── ProductManagement.js # 產品管理
│   │   ├── config.js       # 配置檔案
│   │   ├── App.js          # 主應用組件
│   │   └── index.js        # 入口檔案
│   └── package.json
├── server.js              # Express 後端服務器
├── data.json              # JSON 資料庫
├── package.json           # 專案依賴
├── vercel.json            # Vercel 部署配置
├── railway.json           # Railway 部署配置
├── .gitignore             # Git 忽略檔案
├── DEPLOYMENT.md          # 部署指南
└── README.md              # 專案說明
```

## 🌐 雲端部署

### Vercel 部署 (推薦)
- ✅ 自動部署
- ✅ CDN 加速
- ✅ 免費額度充足
- ✅ 支援前端 + 後端 API

### Railway 部署
- ✅ 簡單易用
- ✅ 支援持久化存儲
- ✅ 適合生產環境

### GitHub Pages
- ✅ 免費靜態託管
- ⚠️ 僅支援前端

**詳細部署說明請參考 [DEPLOYMENT.md](./DEPLOYMENT.md)**

## 🔌 API 端點

### 認證
- `POST /api/login` - 用戶登入

### 產品管理
- `GET /api/products` - 獲取產品列表
- `POST /api/products` - 創建產品
- `PUT /api/products/:id` - 更新產品
- `DELETE /api/products/:id` - 刪除產品

### 客戶管理
- `GET /api/customers` - 獲取客戶列表
- `POST /api/customers` - 創建客戶
- `PUT /api/customers/:id` - 更新客戶
- `DELETE /api/customers/:id` - 刪除客戶

### 訂單管理
- `POST /api/orders` - 創建訂單
- `GET /api/orders/history` - 獲取訂單歷史
- `GET /api/orders/:id` - 獲取單一訂單
- `PUT /api/orders/:id` - 更新訂單
- `DELETE /api/orders/:id` - 刪除訂單

### 廚房功能
- `GET /api/kitchen/production/:date` - 獲取製作清單
- `PUT /api/kitchen/production/:date/:productName/status` - 更新製作狀態

### 報表功能
- `GET /api/orders/customers/:date` - 獲取客戶訂單
- `GET /api/orders/weekly/:startDate` - 獲取週報表
- `GET /api/orders/export/:date` - 匯出日報表

## 🛠️ 開發指南

### 添加新功能
1. 在 `server.js` 添加 API 端點
2. 在 `client/src/components/` 添加 React 組件
3. 更新路由配置

### 資料結構
- **訂單**: 包含客戶資訊、產品項目、日期、贈送標記等
- **客戶**: 姓名、電話、地址等基本資訊
- **產品**: 名稱、價格、描述等

### 環境配置
- 開發環境: `env.local`
- 生產環境: 各平台自動設定

## 📊 系統特色

### 贈送商品功能
- 支援負價格商品
- 廚房和客戶端都會標註「🎁 贈送」
- 可編輯贈送商品的口味

### 智能搜尋
- 客戶搜尋支援姓名、電話、地址關鍵字
- 訂單歷史支援客戶篩選
- 即時搜尋結果

### 權限管理
- 管理員: 完整功能存取
- 廚房員工: 製作清單和客戶訂單查詢

## 🔒 安全性

- 用戶認證和授權
- 輸入資料驗證
- CORS 配置
- 環境變數保護敏感資訊

## 📈 效能優化

- React.memo 減少重渲染
- 虛擬滾動處理大量資料
- API 快取機制
- 壓縮靜態資源

## 📝 授權

MIT License

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

## 📋 更新日誌

### v1.0.0 (2024-01-XX)
- ✅ 初始版本發布
- ✅ 完整的訂單管理功能
- ✅ 廚房製作清單
- ✅ 客戶管理
- ✅ 贈送商品功能
- ✅ 客戶搜尋功能
- ✅ 訂單歷史查詢
- ✅ 多平台部署支援
- ✅ 響應式 UI 設計

---

**🎉 部署完成後，您的訂單管理系統將可以在雲端正常運行！**# Force redeploy Mon Sep 29 11:57:03 CST 2025
