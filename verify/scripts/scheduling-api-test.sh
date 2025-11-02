#!/usr/bin/env bash
set -euo pipefail

API=http://localhost:3001
JQ=/Users/james/opt/anaconda3/bin/jq

echo "🧪 Scheduling API 測試"

DATE=2025-11-01

# 1) 查詢該日排程清單
echo "🔎 1) GET /api/scheduling/dates/$DATE/orders"
RES=$(curl -fsS "$API/api/scheduling/dates/$DATE/orders")
echo "$RES" | $JQ . >/dev/null

# 2) 建立一筆測試訂單（若沒有）
echo "🧰 建立測試訂單"
NEW_ID=$(curl -fsS -X POST "$API/api/orders" -H 'Content-Type: application/json' -d '{
  "customer_id": null,
  "order_date": "'$DATE'",
  "delivery_date": "'$DATE'",
  "order_type": "online",
  "status": "pending",
  "items": [ { "product_name": "即飲瓶-元氣綠", "quantity": 1, "unit_price": 100 } ]
}' | $JQ -r '.id')

# 3) 確認排程
echo "✅ 2) POST /api/scheduling/confirm"
CONFIRM=$(curl -fsS -X POST "$API/api/scheduling/confirm" -H 'Content-Type: application/json' -d '{
  "orderIds": ['"$NEW_ID"'],
  "manufacturingDate": "'$DATE'",
  "manufacturingQuantities": { "即飲瓶-元氣綠": 1 }
}')
echo "$CONFIRM" | $JQ . >/dev/null

# 4) 再次查詢清單
echo "🔁 3) GET /api/scheduling/dates/$DATE/orders"
RES2=$(curl -fsS "$API/api/scheduling/dates/$DATE/orders")
CNT=$(echo "$RES2" | $JQ -r '.orders | length')
echo "清單數量: $CNT"

# 5) 完成排程
echo "🏁 4) POST /api/scheduling/complete"
COMP=$(curl -fsS -X POST "$API/api/scheduling/complete" -H 'Content-Type: application/json' -d '{
  "orderIds": ['"$NEW_ID"'],
  "selectedDate": "'$DATE'"
}')
echo "$COMP" | $JQ . >/dev/null

# 6) 刪除排程（將狀態恢復）
echo "🧹 5) DELETE /api/scheduling/delete/$DATE"
DEL=$(curl -fsS -X DELETE "$API/api/scheduling/delete/$DATE")
echo "$DEL" | $JQ . >/dev/null

echo "🎉 Scheduling API 測試完成"
