#!/usr/bin/env bash
set -euo pipefail
BASE=${1:-http://localhost:3001}
echo "🔎 Smoke Test against $BASE"

# 使用系統的 jq
JQ_CMD="/Users/james/opt/anaconda3/bin/jq"

echo "1) /api/health"
curl -fsS "$BASE/api/health" | $JQ_CMD . >/dev/null

echo "2) /api/orders/history"
curl -fsS "$BASE/api/orders/history" | $JQ_CMD 'arrays' >/dev/null

echo "3) 建立測試訂單"
NEW='{"customer_name":"測試客戶","customer_phone":"0912345678","order_date":"2025-10-28","delivery_date":"2025-10-28","items":[{"product_name":"即飲瓶-元氣綠","quantity":2,"unit_price":134}],"customer_total":268,"payment_method":"現金","order_notes":"SMOKE TEST"}'
RESPONSE=$(curl -fsS -X POST "$BASE/api/orders" -H "Content-Type: application/json" -d "$NEW")
NEW_ID=$(echo "$RESPONSE" | $JQ_CMD -r '.id // empty')
if [ -n "$NEW_ID" ] && [ "$NEW_ID" != "null" ]; then
    echo "   ✅ 成功創建測試訂單"
else
    echo "   ❌ 創建訂單失敗"
    echo "   回應: $RESPONSE"
    exit 1
fi

echo "4) 查驗訂單是否存在"
ORDERS_COUNT=$(curl -fsS "$BASE/api/orders" | $JQ_CMD 'length')
if [ "$ORDERS_COUNT" -gt 0 ]; then
    echo "   ✅ 訂單數據正常 (共 $ORDERS_COUNT 筆訂單)"
else
    echo "   ❌ 沒有訂單數據"
    exit 1
fi

echo "5) /api/products"
PRODUCTS_COUNT=$(curl -fsS "$BASE/api/products" | $JQ_CMD 'length')
if [ "$PRODUCTS_COUNT" -gt 0 ]; then
    echo "   ✅ 產品數據正常 (共 $PRODUCTS_COUNT 個產品)"
else
    echo "   ❌ 沒有產品數據"
    exit 1
fi

echo "6) /api/customers"
CUSTOMERS_COUNT=$(curl -fsS "$BASE/api/customers" | $JQ_CMD 'length')
if [ "$CUSTOMERS_COUNT" -gt 0 ]; then
    echo "   ✅ 客戶數據正常 (共 $CUSTOMERS_COUNT 個客戶)"
else
    echo "   ❌ 沒有客戶數據"
    exit 1
fi

echo "7) 測試 /api/orders/weekly/:date"
curl -fsS "$BASE/api/orders/weekly/2025-10-28" | $JQ_CMD . >/dev/null
echo "   ✅ 每週訂單API正常"

echo ""
echo "🎉 Smoke Test 全部通過！"