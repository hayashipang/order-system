# Railway 部署指南

## 為什麼選擇 Railway？

1. **完整後端支援**：可以運行您的 Node.js 後端和 JSON 資料庫
2. **無容量限制**：不像瀏覽器本地存儲有 5-10MB 限制
3. **數據持久化**：數據保存在伺服器上，不會因為清除瀏覽器而消失
4. **多設備同步**：任何設備都可以訪問相同的數據

## 部署步驟：

### 1. 註冊 Railway 帳號
- 訪問 https://railway.app
- 使用 GitHub 帳號登入

### 2. 連接 GitHub Repository
- 點擊 "New Project"
- 選擇 "Deploy from GitHub repo"
- 選擇您的 `hayashipang/order-system` repository

### 3. 配置部署設定
Railway 會自動檢測到您的 `package.json` 和 `railway.json` 配置

### 4. 設置環境變數（可選）
在 Railway Dashboard 中設置：
- `NODE_ENV=production`
- `PORT=3000`

### 5. 部署完成
Railway 會自動：
- 安裝依賴 (`npm install`)
- 建構前端 (`npm run build`)
- 啟動後端伺服器 (`npm start`)

## 部署後的優勢：

✅ **真正的 JSON 資料庫**：使用您現有的 `data.json` 檔案
✅ **無容量限制**：可以處理大量客戶和訂單數據
✅ **數據持久化**：數據永久保存在伺服器上
✅ **API 功能完整**：所有 CRUD 操作都正常工作
✅ **多用戶支援**：多個用戶可以同時使用系統

## 成本：
- Railway 提供免費額度
- 個人使用通常不會超過免費限制
- 如果需要更多資源，付費方案也很便宜

## 與 Vercel 的比較：

| 功能 | Vercel (目前) | Railway (推薦) |
|------|---------------|----------------|
| 前端部署 | ✅ | ✅ |
| 後端 API | ❌ | ✅ |
| JSON 資料庫 | ❌ | ✅ |
| 數據容量 | 5-10MB | 無限制 |
| 數據持久化 | ❌ | ✅ |
| 多設備同步 | ❌ | ✅ |

## 建議：
**立即部署到 Railway**，這樣您就可以使用完整的 JSON 資料庫功能，而不需要擔心瀏覽器存儲限制！
