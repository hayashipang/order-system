# 訂單狀態管理系統設計

## 🎯 訂單狀態層級

### 基本狀態
- `pending` - 待排程（新訂單，未安排生產）
- `scheduled` - 已排程（已安排到特定日期）
- `completed` - 已完成（完全完成）
- `cancelled` - 已取消

### 擴展狀態（新增）
- `partial_completed` - 部分完成（產能不足，部分完成）
- `auto_moved` - 自動挪移（因產能不足自動挪到隔天）
- `in_production` - 生產中（正在製作）

## 📊 數據結構擴展

### 訂單排程數據
```javascript
{
  "id": 1,
  "customer_id": 1,
  "order_date": "2025-10-25",
  "delivery_date": "2025-10-25",
  "status": "pending", // 基本狀態
  "scheduling_status": "pending", // 排程狀態
  "production_date": null, // 排程生產日期
  "scheduled_items": [], // 排程項目
  "capacity_used": 0, // 已使用產能
  "capacity_remaining": 0, // 剩餘產能
  "cross_day_transfers": [], // 跨日挪單記錄
  "completion_status": {
    "total_quantity": 20,
    "completed_quantity": 0,
    "remaining_quantity": 20,
    "completion_percentage": 0
  }
}
```

### 排程項目結構
```javascript
{
  "order_id": 1,
  "product_name": "即飲瓶-元氣綠",
  "scheduled_quantity": 20,
  "original_quantity": 20,
  "completed_quantity": 0,
  "remaining_quantity": 20,
  "production_date": "2025-10-25",
  "status": "scheduled"
}
```

### 跨日挪單記錄
```javascript
{
  "order_id": 1,
  "from_date": "2025-10-25",
  "to_date": "2025-10-26",
  "transferred_quantity": 10,
  "reason": "capacity_insufficient",
  "created_at": "2025-10-25T10:00:00Z"
}
```

## 🔄 狀態轉換流程

### 正常流程
1. `pending` → `scheduled` (排程時)
2. `scheduled` → `in_production` (開始生產)
3. `in_production` → `completed` (完成生產)

### 跨日挪單流程
1. `pending` → `scheduled` (部分排程)
2. `scheduled` → `partial_completed` (產能不足)
3. `partial_completed` → `auto_moved` (自動挪移剩餘)
4. `auto_moved` → `scheduled` (隔天重新排程)

## 🧮 產能計算邏輯

### 每日產能設定
```javascript
const DAILY_CAPACITY = {
  "2025-10-25": 100, // 瓶數
  "2025-10-26": 80,
  "2025-10-27": 120
};
```

### 智能排程算法
1. 按優先級排序（蝦皮訂單、緊急訂單）
2. 計算產能分配
3. 自動挪單計算
4. 生成排程建議

## 📅 多層級導航結構

### 年份層級
```javascript
{
  "2025": {
    "total_orders": 150,
    "pending_orders": 20,
    "scheduled_orders": 100,
    "completed_orders": 30
  }
}
```

### 月份層級
```javascript
{
  "10": {
    "total_orders": 50,
    "pending_orders": 5,
    "scheduled_orders": 35,
    "completed_orders": 10
  }
}
```

### 日期層級
```javascript
{
  "25": {
    "orders": [order1, order2],
    "production_capacity": 100,
    "scheduled_orders": [order1],
    "completed_orders": [],
    "capacity_used": 20,
    "capacity_remaining": 80
  }
}
```

