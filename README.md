# 果然盈訂單管理系統

一個專為蔬果飲品店設計的完整訂單管理系統，包含現場收銀 POS 系統和後台管理系統。

## 🌐 系統架構

### 地端開發環境
- **後端 API**: `http://localhost:3001`
- **訂單管理系統**: `http://localhost:3000`
- **POS 收銀系統**: `http://localhost:3002`

### 雲端生產環境
- **後端 API**: `https://order-system-production-6ef7.up.railway.app`
- **訂單管理系統**: `https://order-system-production-6ef7.up.railway.app`
- **POS 收銀系統**: `https://pos-system-pied.vercel.app`

## 🚀 快速開始

### 地端開發環境

1. **安裝依賴**
   ```bash
   npm run install-all
   ```

2. **啟動地端服務**
   ```bash
   # 方法一：使用快速啟動腳本
   ./start-local.sh
   
   # 方法二：分別啟動（需要三個終端）
   npm run dev:server    # 後端 API (端口 3001)
   npm run dev:client    # 訂單管理系統 (端口 3000)
   npm run dev:pos       # POS 收銀系統 (端口 3002)
   ```

3. **訪問系統**
   - 訂單管理系統: http://localhost:3000
   - POS 收銀系統: http://localhost:3002

### 雲端生產環境

系統已部署到雲端，可直接訪問：
- 訂單管理系統: [https://order-system-production-6ef7.up.railway.app/](https://order-system-production-6ef7.up.railway.app/)
- POS 收銀系統: [https://pos-system-pied.vercel.app/](https://pos-system-pied.vercel.app/)

## 📁 專案結構

```
order-system/
├── client/                 # 訂單管理系統前端
│   ├── src/
│   │   ├── components/     # React 組件
│   │   │   ├── AdminPanel.js      # 管理面板
│   │   │   ├── CustomerOrders.js  # 客戶訂單管理
│   │   │   ├── InventoryOverview.js # 庫存概覽
│   │   │   ├── KitchenDashboard.js # 廚房製作面板
│   │   │   ├── Login.js           # 登入組件
│   │   │   └── ProductManagement.js # 產品管理
│   │   ├── config.js       # 地端配置
│   │   └── config.production.js  # 雲端配置
│   └── package.json
├── pos-system/            # POS 收銀系統前端
│   ├── src/
│   │   ├── components/     # React 組件
│   │   │   ├── CashierPanel.js    # 收銀面板
│   │   │   ├── ProductGrid.js     # 產品網格
│   │   │   ├── SalesHistory.js    # 銷售歷史
│   │   │   └── VirtualKeypad.js   # 虛擬鍵盤
│   │   └── services/
│   │       ├── api.js      # 地端 API 配置
│   │       └── api.production.js  # 雲端 API 配置
│   └── package.json
├── server.js              # 後端 API 服務器
├── data.json              # 範本資料庫文件
├── data.local.json        # 本地資料庫文件
├── scripts/               # 部署和備份腳本
├── env.local              # 地端環境配置
├── env.production         # 雲端環境配置
└── README.md
```

## 🔧 環境配置

### 地端開發環境
- 所有 API 請求指向 `http://localhost:3001`
- 使用 `data.local.json` 本地資料庫
- 支援熱重載和除錯模式

### 雲端生產環境
- 訂單管理系統 API 指向 `https://order-system-production-6ef7.up.railway.app`
- POS 系統 API 指向 `https://order-system-production-6ef7.up.railway.app`
- 使用 `data.json` 雲端資料庫

## 📋 主要功能

### 訂單管理系統
- **產品管理**: 新增、編輯、刪除產品
- **客戶管理**: 客戶資料管理
- **訂單管理**: 預訂訂單和現場訂單分離顯示
- **廚房製作**: 雙標籤頁面（預訂訂單 / 現場訂單）
- **庫存管理**: 即時庫存狀態監控和異動記錄
- **報表分析**: 銷售報表和統計
- **分離式數據管理**: 支援客戶、產品、訂單、POS訂單的分離下載/上傳
- **蝦皮費用計算**: 自動計算蝦皮訂單手續費
- **信用卡費用計算**: 自動計算信用卡手續費

### POS 收銀系統
- **現場收銀**: 快速結帳功能
- **產品選擇**: 直觀的產品網格界面
- **虛擬鍵盤**: 支援觸控操作
- **銷售歷史**: 即時銷售記錄
- **庫存同步**: 與訂單系統即時同步
- **環境自動配置**: 根據部署環境自動選擇API配置

## 🆕 最新功能

### 分離式數據管理
- **分離下載**: 可單獨下載客戶、產品、訂單、POS訂單數據
- **分離上傳**: 支援單獨上傳各類數據
- **ID映射**: 自動處理數據上傳時的ID映射問題
- **依賴驗證**: 確保數據上傳的完整性

### 費用計算系統
- **蝦皮費用**: 成交手續費(5.5%) + 金流與系統處理費(2%)
- **信用卡費用**: 根據付款方式自動計算
- **POS訂單**: 現場銷售無手續費

### 環境配置優化
- **自動環境檢測**: 根據 `NODE_ENV` 自動選擇配置
- **API配置分離**: 地端和雲端使用不同的API配置
- **數據庫同步**: 支援地端和雲端數據同步

## 🛠️ 開發指令

```bash
# 安裝所有依賴
npm run install-all

# 啟動開發服務器
npm run dev:server    # 後端 API
npm run dev:client    # 訂單管理系統
npm run dev:pos       # POS 收銀系統

# 建置專案
npm run build         # 建置所有系統
npm run build:client  # 建置訂單管理系統
npm run build:pos     # 建置 POS 系統

# 清理專案
npm run clean         # 清理所有建置檔案和依賴

# 環境切換
npm run config:local      # 切換到地端配置
npm run config:production # 切換到雲端配置
```

## 📦 部署

### 自動部署
```bash
# 完整部署（含備份）
npm run deploy:full

# 快速部署
npm run deploy:quick

# 自動部署
npm run deploy
```

### 手動部署
1. **訂單管理系統** (Railway)
   - 推送代碼到 main 分支
   - Railway 自動部署

2. **POS 收銀系統** (Vercel)
   - 推送代碼到 main 分支
   - Vercel 自動部署

## 💾 資料備份與恢復

### 分離式數據管理
```bash
# 在訂單管理系統的客戶管理頁面中：
# 1. 選擇要下載的數據類型（客戶、產品、訂單、POS訂單）
# 2. 點擊「分離下載」或「批次下載」
# 3. 選擇要上傳的JSON文件
# 4. 點擊「分離上傳」或「批次上傳」
```

### 傳統備份方式
```bash
# 備份雲端資料
npm run backup

# 恢復雲端資料
npm run restore

# 手動備份腳本
./scripts/backup-cloud-data.sh
```

## 🔄 Git 上傳流程

**⚠️ 重要**: 每次上傳到 Git 前，系統會自動備份雲端資料

```bash
# 使用安全上傳腳本（推薦）
./scripts/git-upload-with-backup.sh

# 或手動執行
npm run backup
git add .
git commit -m "您的提交訊息"
git push origin main
```

## 🐛 故障排除

### 常見問題

1. **端口被佔用**
   ```bash
   # 檢查端口使用情況
   lsof -i :3000
   lsof -i :3001
   lsof -i :3002
   ```

2. **依賴安裝失敗**
   ```bash
   # 清理並重新安裝
   npm run clean
   npm run install-all
   ```

3. **API 連接問題**
   - 檢查 `env.local` 和 `env.production` 配置
   - 確認後端服務器是否正常運行
   - 檢查網路連接

4. **庫存數據不同步**
   - 確認地端和雲端使用相同的數據庫文件
   - 檢查庫存異動記錄是否正確
   - 使用分離式數據管理功能同步數據

5. **POS系統庫存不更新**
   - 確認POS系統使用正確的API配置
   - 檢查環境變數 `NODE_ENV` 是否正確
   - 重新部署POS系統

### 日誌檔案
- 後端日誌: `logs/backend.log`
- 前端日誌: 瀏覽器開發者工具 Console

## 🔧 技術架構

### 前端技術
- **React 18**: 用戶界面框架
- **Axios**: HTTP 客戶端
- **CSS Grid**: 響應式布局

### 後端技術
- **Node.js**: 運行環境
- **Express.js**: Web 框架
- **JSON 文件**: 數據存儲

### 部署平台
- **Railway**: 後端 API 和訂單管理系統
- **Vercel**: POS 收銀系統

### 數據管理
- **分離式架構**: 客戶、產品、訂單、POS訂單獨立管理
- **ID映射系統**: 處理數據遷移時的ID一致性
- **環境配置**: 自動根據部署環境選擇配置

## 📞 技術支援

如有問題，請檢查：
1. 系統日誌檔案
2. 瀏覽器開發者工具
3. 網路連接狀態
4. 環境配置檔案
5. 數據庫文件完整性

## 📄 授權

MIT License

---

**版本**: 2.0.0  
**最後更新**: 2025-10-01  
**主要更新**: 
- 新增分離式數據管理功能
- 新增蝦皮費用計算
- 優化環境配置系統
- 修復POS系統API配置問題