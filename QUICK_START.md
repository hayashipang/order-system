# 🚀 快速開始指南

## ✅ 本地開發環境已設置完成！

您的本地開發環境現在與雲端部署環境完全一致。

## 🎯 立即開始開發

### 1. 啟動開發伺服器

```bash
# 方法一：分別啟動（推薦）
# 終端 1 - 啟動後端
npm run dev:server

# 終端 2 - 啟動前端
npm run dev:client
```

### 2. 訪問應用程式

- **前端應用**: http://localhost:3000
- **後端 API**: http://localhost:3000/api
- **API 文檔**: http://localhost:3000/api

### 3. 測試帳號

- **管理員**: `admin` / `admin123`
- **廚房員工**: `kitchen` / `kitchen123`

## 🔧 開發指令

```bash
# 開發模式
npm run dev:server    # 後端開發伺服器
npm run dev:client    # 前端開發伺服器

# 建構和部署
npm run build         # 建構前端
npm run test:local    # 測試本地部署
npm start            # 啟動生產模式

# 清理
npm run clean        # 清理所有檔案
```

## 📊 功能測試

### ✅ 已測試功能

- [x] 後端 API 正常運行
- [x] 前端建構成功
- [x] 本地部署正常
- [x] 環境變數配置正確
- [x] 資料檔案正常

### 🧪 手動測試

1. **登入測試**
   - 訪問 http://localhost:3000
   - 使用測試帳號登入
   - 檢查不同角色的權限

2. **功能測試**
   - 廚房製作清單
   - 客戶訂單管理
   - 產品管理
   - 後台管理

3. **API 測試**
   ```bash
   # 測試產品 API
   curl http://localhost:3000/api/products
   
   # 測試客戶 API
   curl http://localhost:3000/api/customers
   ```

## 🌐 部署到雲端

### 準備部署

```bash
# 1. 測試本地部署
npm run test:local

# 2. 推送到 GitHub
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 自動部署

- **Vercel**: 自動部署後端 API
- **Railway**: 自動部署後端 API  
- **Netlify**: 自動部署前端

## 📁 專案結構

```
order-system/
├── client/                 # React 前端
│   ├── src/
│   │   ├── components/     # React 組件
│   │   ├── config.js      # 環境配置
│   │   └── App.js         # 主應用程式
│   └── build/             # 建構輸出
├── scripts/               # 開發腳本
├── server.js              # Node.js 後端
├── data.json              # 資料檔案
├── env.local              # 本地環境變數
└── package.json           # 專案配置
```

## 🔍 除錯

### 常見問題

1. **端口被佔用**
   ```bash
   lsof -i :3000
   kill -9 <PID>
   ```

2. **依賴問題**
   ```bash
   npm run clean
   npm install --registry https://registry.npmjs.org/
   ```

3. **建構失敗**
   ```bash
   cd client
   rm -rf node_modules build
   npm install
   npm run build
   ```

## 🎉 完成！

您的本地開發環境現在完全準備就緒！

- ✅ 與雲端環境完全一致
- ✅ 所有功能正常運行
- ✅ 可以開始開發新功能
- ✅ 隨時可以部署到雲端

**開始您的開發之旅吧！** 🚀
