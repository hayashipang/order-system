# GreenWin Backend v3 API 文件

本後端支援 **PostgreSQL + JSON fallback** 模式，可無縫切換資料庫。

## 🚀 快速開始

```bash
# 本地開發（使用 JSON）
npm run dev

# 生產環境（使用 PostgreSQL）
DATABASE_URL=postgresql://... npm start
```

## 🔧 環境設定

### 本地開發
- 不需要設定 `DATABASE_URL`
- 自動使用 `data.local.json` 作為資料庫

### 生產部署
- 設定 `DATABASE_URL` 環境變數
- 自動切換到 PostgreSQL 模式
- 支援 Vercel、Railway 等平台

## 📡 API 端點

### 系統狀態
| Method | Route | Description |
|--------|--------|-------------|
| GET | `/api/health` | 回傳伺服器狀態與模式 |

### 訂單管理
| Method | Route | Description |
|--------|--------|-------------|
| GET | `/api/orders` | 取得所有訂單 |
| POST | `/api/orders` | 新增訂單 |
| GET | `/api/orders/uncompleted` | 取得未完成訂單 |

### 排程管理
| Method | Route | Description |
|--------|--------|-------------|
| POST | `/api/scheduling/confirm` | 建立主排程單 |

**請求格式：**
```json
{
  "orderIds": [1, 2, 3],
  "selectedDate": "2025-10-26",
  "manufacturingQuantities": {
    "即飲瓶-元氣綠": 30,
    "即飲瓶-活力紅": 15
  }
}
```

### 廚房管理
| Method | Route | Description |
|--------|--------|-------------|
| GET | `/api/kitchen/production/:date` | 查詢當日生產清單 |
| PUT | `/api/kitchen/production/:date/:productName/status` | 標記產品完成狀態 |

**標記完成請求：**
```json
{
  "status": "completed"
}
```

### 庫存管理
| Method | Route | Description |
|--------|--------|-------------|
| GET | `/api/inventory/scheduling` | 查詢排程庫存影響 |

### 產品管理
| Method | Route | Description |
|--------|--------|-------------|
| GET | `/api/products` | 取得所有產品 |

### 客戶管理
| Method | Route | Description |
|--------|--------|-------------|
| GET | `/api/customers` | 取得所有客戶 |

### 訂單項目
| Method | Route | Description |
|--------|--------|-------------|
| GET | `/api/order-items` | 取得所有訂單項目 |

## 🔄 資料流程

### 排程流程
1. 客戶下單 → `POST /api/orders`
2. 建立排程 → `POST /api/scheduling/confirm`
3. 廚房查看 → `GET /api/kitchen/production/:date`
4. 標記完成 → `PUT /api/kitchen/production/:date/:productName/status`
5. 庫存更新 → 自動處理

### 主排程架構
- **主排程單**：包含 `merged_orders` 陣列，`linked_schedule_id` 為空
- **子訂單**：包含 `linked_schedule_id` 指向主排程單
- **庫存計算**：只計算主排程單的數量，避免重複計算

## 🗄️ 資料庫結構

### PostgreSQL 表格
- `customers` - 客戶資料
- `products` - 產品資料
- `orders` - 訂單資料
- `order_items` - 訂單項目

### JSON 結構
```json
{
  "customers": [...],
  "products": [...],
  "orders": [...],
  "order_items": [...]
}
```

## 🚀 部署

### Vercel
```bash
# 設定環境變數
DATABASE_URL=postgresql://...

# 部署
vercel --prod
```

### Railway
```bash
# 設定環境變數
railway variables set DATABASE_URL=postgresql://...

# 部署
railway up
```

## 🔍 除錯

### 檢查模式
```bash
curl http://localhost:3000/api/health
```

### 日誌輸出
- `✅` - 成功操作
- `⚠️` - 警告訊息
- `❌` - 錯誤訊息
- `📊` - 資料統計
- `🔄` - 處理中

## 📝 注意事項

1. **資料一致性**：所有 API 都使用 `getLatestData()` 和 `saveData()` 確保資料同步
2. **庫存計算**：廚房標記完成時只會加一次庫存，避免重複計算
3. **主排程識別**：使用 `merged_orders` 和 `linked_schedule_id` 來區分主排程和子訂單
4. **日期格式**：統一使用 `YYYY-MM-DD` 格式
5. **錯誤處理**：所有 API 都有完整的錯誤處理和日誌記錄
