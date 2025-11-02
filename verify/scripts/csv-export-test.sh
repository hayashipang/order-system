#!/usr/bin/env bash
set -euo pipefail

API=http://localhost:3001

echo "🧪 CSV 匯出 API 測試"

# 1) 直接呼叫匯出（不帶條件）
echo "🔎 1) GET /api/orders/history/export/csv"
RES=$(curl -fsS -H 'Accept: text/csv' "$API/api/orders/history/export/csv")
# 簡單檢查 CSV 表頭是否存在
echo "$RES" | head -n 1 | grep -q "id,customer_id,order_date,delivery_date,status,total_amount"

echo "🎉 CSV 匯出 API 測試完成"
