# 🔗 **API 對應檢查表** (API Mapping Check)

> **生成時間**: 2025-01-28  
> **主要後端**: server_v4.js (SQLite 模式)  
> **主要前端**: client/src/ (React 應用)

---

## 📊 **API 端點對應表**

### ✅ **已對應的 API**

| 前端調用 | 後端端點 | 方法 | 狀態 | 備註 |
|---------|---------|------|------|------|
| `/api/health` | `/api/health` | GET | ✅ | 健康檢查 |
| `/api/orders` | `/api/orders` | GET | ✅ | 訂單列表 |
| `/api/orders/history` | `/api/orders/history` | GET | ✅ | 訂單歷史 |
| `/api/orders/:id` | `/api/orders/:id` | GET | ✅ | 單一訂單 |
| `/api/orders` | `/api/orders` | POST | ✅ | 建立訂單 |
| `/api/orders/:id` | `/api/orders/:id` | PUT | ✅ | 更新訂單 |
| `/api/orders/:id/status` | `/api/orders/:id/status` | PUT | ✅ | 更新訂單狀態 |
| `/api/orders/:id/shipping-status` | `/api/orders/:id/shipping-status` | PUT | ✅ | 更新出貨狀態 |
| `/api/orders/:id` | `/api/orders/:id` | DELETE | ✅ | 刪除訂單 |
| `/api/customers` | `/api/customers` | GET | ✅ | 客戶列表 |
| `/api/customers` | `/api/customers` | POST | ✅ | 建立客戶 |
| `/api/customers/:id` | `/api/customers/:id` | GET | ✅ | 單一客戶 |
| `/api/customers/:id` | `/api/customers/:id` | PUT | ✅ | 更新客戶 |
| `/api/customers/:id` | `/api/customers/:id` | DELETE | ✅ | 刪除客戶 |
| `/api/products` | `/api/products` | GET | ✅ | 產品列表 |
| `/api/products` | `/api/products` | POST | ✅ | 建立產品 |
| `/api/products/:id` | `/api/products/:id` | PUT | ✅ | 更新產品 |
| `/api/products/:id` | `/api/products/:id` | DELETE | ✅ | 刪除產品 |
| `/api/shipping-fee` | `/api/shipping-fee` | GET | ✅ | 運費查詢 |
| `/api/shipping-fee` | `/api/shipping-fee` | PUT | ✅ | 更新運費 |
| `/api/orders/customers/:date` | `/api/orders/customers/:date` | GET | ✅ | 客戶訂單 |
| `/api/orders/delivery/:date` | `/api/orders/delivery/:date` | GET | ✅ | 出貨訂單 |
| `/api/orders/shipping-weekly/:date` | `/api/orders/shipping-weekly/:date` | GET | ✅ | 週出貨概覽 |
| `/api/orders/weekly/:date` | `/api/orders/weekly/:date` | GET | ✅ | 週訂單概覽 |
| `/api/orders/export/:date` | `/api/orders/export/:date` | GET | ✅ | 訂單匯出 |
| `/api/kitchen/production/:date` | `/api/kitchen/production/:date` | GET | ✅ | 廚房生產 |
| `/api/kitchen/walkin-orders-list` | `/api/kitchen/walkin-orders-list` | GET | ✅ | 現場訂單 |
| `/api/kitchen/production/:date/:productName/status` | `/api/kitchen/production/:date/:productName/status` | PUT | ✅ | 廚房狀態更新 |
| `/api/inventory/scheduling` | `/api/inventory/scheduling` | GET | ✅ | 庫存排程 |
| `/api/inventory/transactions` | `/api/inventory/transactions` | GET | ✅ | 庫存異動 |
| `/api/inventory/transaction` | `/api/inventory/transaction` | POST | ✅ | 新增庫存異動 |
| `/api/inventory/transaction/:id` | `/api/inventory/transaction/:id` | DELETE | ✅ | 刪除庫存異動 |
| `/api/inventory/transactions/reset` | `/api/inventory/transactions/reset` | DELETE | ✅ | 重置庫存異動 |
| `/api/shared/pos-orders` | `/api/shared/pos-orders` | POST | ✅ | POS 訂單 |

---

## ❌ **缺失的 API**

### 🚨 **前端調用但後端缺失**

| 前端調用 | 預期方法 | 狀態 | 影響 |
|---------|---------|------|------|
| `/api/scheduling/dates/:date/orders` | GET | ❌ 缺失 | OrderScheduling 無法載入排程清單 |
| `/api/scheduling/complete` | POST | ❌ 缺失 | OrderScheduling 無法完成排程 |
| `/api/scheduling/delete/:date` | DELETE | ❌ 缺失 | OrderScheduling 無法刪除排程 |
| `/api/scheduling/confirm` | POST | ❌ 缺失 | OrderScheduling 無法確認排程 |
| `/api/scheduling/config` | PUT | ❌ 缺失 | OrderScheduling 無法更新配置 |
| `/api/scheduling/parameter-test` | POST | ❌ 缺失 | OrderScheduling 無法測試參數 |
| `/api/products/sync-priority` | POST | ❌ 缺失 | AdminPanel 無法同步優先級 |
| `/api/orders/history/export/csv` | GET | ❌ 缺失 | AdminPanel 無法匯出 CSV |

### 🚨 **後端存在但前端未使用**

| 後端端點 | 方法 | 狀態 | 建議 |
|---------|------|------|------|
| `/api/scheduling/parameter-test` | POST | ⚠️ 未使用 | 可移除或前端整合 |
| `/api/scheduling/config` | PUT | ⚠️ 未使用 | 可移除或前端整合 |

---

## 🔧 **API 不一致問題**

### 📝 **欄位格式不一致**

| API | 前端期望 | 後端回傳 | 狀態 | 修復建議 |
|-----|---------|---------|------|---------|
| `/api/orders/customers/:date` | `response.data.orders` | `orders` | ❌ 不一致 | 後端應包裝為 `{orders: [], totalAmount: 0}` |
| `/api/orders/shipping-weekly/:date` | `response.data.weekly_data` | `orders` | ❌ 不一致 | 後端應包裝為 `{weekly_data: []}` |
| `/api/orders/weekly/:date` | `response.data.range` | `orders` | ❌ 不一致 | 後端應包裝為 `{range: {}, orders: []}` |

### 🔗 **URL 編碼問題**

| 問題 | 影響 | 修復建議 |
|-----|------|---------|
| Kitchen API 產品名稱編碼 | 中文產品名稱無法正確傳遞 | 前端使用 `encodeURIComponent()` |

### 📊 **資料結構問題**

| API | 問題 | 影響 | 修復建議 |
|-----|------|------|---------|
| `/api/kitchen/production/:date` | 缺少 `item_id` 欄位 | Kitchen 無法正確識別項目 | 後端自動生成 UUID |
| `/api/kitchen/production/:date/:productName/status` | 缺少庫存更新邏輯 | 標註完成不影響庫存 | 後端整合庫存更新 |
| `/api/orders/weekly/:date` | 缺少 7 天範圍計算 | 週概覽不完整 | 後端計算 7 天範圍 |

---

## 🧪 **測試覆蓋率**

### ✅ **已測試的 API**
- `/api/health` - 健康檢查
- `/api/orders` - 基本 CRUD
- `/api/customers` - 基本 CRUD  
- `/api/products` - 基本 CRUD
- `/api/kitchen/production/:date` - 廚房生產
- `/api/kitchen/production/:date/:productName/status` - 廚房狀態更新

### ❌ **未測試的 API**
- `/api/scheduling/*` - 排程相關 (全部缺失)
- `/api/orders/weekly/:date` - 週訂單概覽
- `/api/orders/shipping-weekly/:date` - 週出貨概覽
- `/api/inventory/transactions` - 庫存異動

---

## 🚀 **修復優先級**

### 🔥 **高優先級 (Critical)**
1. **排程 API 缺失** - 影響核心功能
2. **Kitchen 狀態更新庫存邏輯** - 影響庫存管理
3. **API 回傳格式不一致** - 影響前端顯示

### ⚠️ **中優先級 (Important)**
1. **週訂單概覽 API** - 影響統計功能
2. **CSV 匯出功能** - 影響資料匯出
3. **產品同步優先級** - 影響產品管理

### 📝 **低優先級 (Nice to have)**
1. **未使用的 API 清理** - 程式碼整理
2. **測試覆蓋率提升** - 品質保證

---

## 📋 **修復檢查清單**

- [ ] 新增缺失的排程 API
- [ ] 修正 API 回傳格式
- [ ] 整合 Kitchen 庫存更新邏輯
- [ ] 新增週訂單概覽 API
- [ ] 新增 CSV 匯出功能
- [ ] 修正 URL 編碼問題
- [ ] 新增 `item_id` 自動生成
- [ ] 提升測試覆蓋率
- [ ] 清理未使用的 API
- [ ] 更新 API 文件

---

**最後更新**: 2025-01-28  
**檢查狀態**: 🔍 掃描完成，等待修復