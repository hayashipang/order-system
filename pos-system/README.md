# 果然盈 POS 收銀系統

專為現場收銀設計的簡潔 POS 系統，與網路訂單系統分離但共享數據。

## 🌟 功能特色

- 🛒 **簡潔收銀介面** - 點選產品、計算總額、收銀找零
- 💰 **多種付款方式** - 現金、信用卡、行動支付
- 📊 **銷售歷史查詢** - 查看現場銷售記錄
- 🔄 **數據共享** - 與網路訂單系統共享產品和歷史數據
- 📱 **響應式設計** - 支援各種螢幕尺寸

## 🏗️ 系統架構

```
order-system (網路訂單)     pos-system (現場收銀)
├── 後端 API (port 3000)   ├── 前端 (port 3002)
├── 前端 (port 3001)       └── 調用 order-system API
└── 共享 API 端點
```

## 🚀 本地開發

### 環境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 啟動步驟

1. **啟動 order-system 後端**
   ```bash
   cd order-system
   npm run dev:server
   ```

2. **啟動 order-system 前端** (可選)
   ```bash
   cd order-system
   npm run dev:client
   ```

3. **啟動 pos-system**
   ```bash
   cd pos-system
   npm install
   npm start
   ```

### 訪問地址
- **POS 收銀系統**: http://localhost:3002
- **網路訂單系統**: http://localhost:3001
- **後端 API**: http://localhost:3000

## 📋 使用說明

### 收銀流程
1. **選擇產品** - 點擊產品卡片加入購物車
2. **調整數量** - 在購物車中調整商品數量
3. **選擇付款方式** - 現金/信用卡/行動支付
4. **輸入付款金額** - 系統自動計算找零
5. **完成交易** - 記錄銷售並清空購物車

### 銷售歷史
- 查看指定日期的銷售記錄
- 篩選現場銷售或網路訂單
- 顯示交易詳情和統計

## 🔌 API 端點

POS 系統使用 order-system 提供的共享 API：

- `GET /api/shared/products` - 取得產品列表
- `POST /api/shared/pos-orders` - 創建現場銷售訂單
- `GET /api/shared/orders/history` - 取得歷史訂單
- `GET /api/shared/reports/daily/:date` - 取得日報表

## 🛠️ 技術架構

- **前端**: React.js 18
- **API 調用**: Axios
- **樣式**: CSS3 + 響應式設計
- **數據來源**: order-system 後端 API

## 📊 數據流程

```
POS 系統 → order-system API → JSON 資料庫
    ↓
現場銷售記錄 → 與網路訂單合併 → 統一報表
```

## 🔧 開發說明

### 專案結構
```
pos-system/
├── src/
│   ├── components/
│   │   ├── ProductGrid.js      # 產品選擇網格
│   │   ├── CashierPanel.js     # 收銀面板
│   │   └── SalesHistory.js     # 銷售歷史
│   ├── services/
│   │   └── api.js              # API 服務
│   ├── App.js                  # 主應用
│   ├── index.js                # 入口
│   └── index.css               # 樣式
├── public/
│   └── index.html
└── package.json
```

### 新增功能
1. 在 `src/components/` 添加新組件
2. 在 `src/services/api.js` 添加 API 調用
3. 在 `App.js` 中整合新功能

## 🚀 部署

### 本地測試
```bash
# 確保 order-system 後端運行在 port 3000
npm start
```

### 生產部署
1. 構建專案: `npm run build`
2. 部署到靜態託管服務
3. 配置 API 端點指向生產環境

## 📝 注意事項

- POS 系統依賴 order-system 的後端 API
- 確保 order-system 後端正常運行
- 現場銷售會自動標記為 `order_type: 'walk-in'`
- 所有交易記錄都會保存到 order-system 的資料庫

## 🤝 與 order-system 的整合

- **產品數據**: 共享同一產品列表
- **歷史記錄**: 現場銷售與網路訂單統一管理
- **報表統計**: 可分別查看或合併統計
- **數據一致性**: 所有數據統一存儲在 order-system

---

**🎉 POS 收銀系統已準備就緒！**
