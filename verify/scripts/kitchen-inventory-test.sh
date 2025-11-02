#!/bin/bash

# Kitchen API 庫存更新測試
# 測試 Kitchen 狀態更新 API 是否正確更新庫存

echo "🧪 === Kitchen API 庫存更新測試 ==="

# 設定測試參數
TEST_DATE="2025-11-01"
TEST_PRODUCT="即飲瓶-元氣綠"
TEST_PRODUCT_ENCODED="%E5%8D%B3%E9%A3%B2%E7%93%B6-%E5%85%83%E6%B0%A3%E7%B6%A0"
API_URL="http://localhost:3001"
JQ_CMD="/Users/james/opt/anaconda3/bin/jq"

# 檢查服務器是否運行
if ! curl -s "$API_URL/api/health" > /dev/null; then
    echo "❌ 服務器未運行，請先啟動服務器"
    exit 1
fi

echo "📋 測試參數："
echo "  - 日期: $TEST_DATE"
echo "  - 產品: $TEST_PRODUCT"
echo "  - API: PUT $API_URL/api/kitchen/production/$TEST_DATE/$TEST_PRODUCT_ENCODED/status"

# 1. 記錄 before 庫存
echo "📊 步驟 1: 記錄 before 庫存"
BEFORE_STOCK=$(curl -s "$API_URL/api/products" | $JQ_CMD -r ".[] | select(.name == \"$TEST_PRODUCT\") | .current_stock // 0")
echo "  Before 庫存: $BEFORE_STOCK"

# 2. 呼叫 API 設定 status: 'completed'
echo "📦 步驟 2: 呼叫 API 設定 status: 'completed'"
API_RESPONSE=$(curl -s -X PUT \
  -H "Content-Type: application/json" \
  -d '{"status":"completed"}' \
  "$API_URL/api/kitchen/production/$TEST_DATE/$TEST_PRODUCT_ENCODED/status")

echo "  API 回應: $API_RESPONSE"

# 檢查 API 回應格式
SUCCESS=$(echo "$API_RESPONSE" | $JQ_CMD -r '.success // false')
ADDED=$(echo "$API_RESPONSE" | $JQ_CMD -r '.added // 0')
MESSAGE=$(echo "$API_RESPONSE" | $JQ_CMD -r '.message // ""')

if [ "$SUCCESS" != "true" ]; then
    echo "❌ API 回應 success 不為 true"
    exit 1
fi

if [ -z "$MESSAGE" ]; then
    echo "❌ API 回應缺少 message 欄位"
    exit 1
fi

echo "  ✅ API 回應格式正確"

# 3. 記錄 after 庫存
echo "📊 步驟 3: 記錄 after 庫存"
AFTER_STOCK=$(curl -s "$API_URL/api/products" | $JQ_CMD -r ".[] | select(.name == \"$TEST_PRODUCT\") | .current_stock // 0")
echo "  After 庫存: $AFTER_STOCK"

# 4. 驗證庫存更新
echo "🔍 步驟 4: 驗證庫存更新"
STOCK_DIFF=$((AFTER_STOCK - BEFORE_STOCK))
echo "  庫存變化: $BEFORE_STOCK → $AFTER_STOCK (差異: +$STOCK_DIFF)"
echo "  API 回傳 added: $ADDED"

if [ "$STOCK_DIFF" -ne "$ADDED" ]; then
    echo "❌ 庫存變化量 ($STOCK_DIFF) 與 API 回傳 added ($ADDED) 不符"
    exit 1
fi

if [ "$STOCK_DIFF" -le 0 ]; then
    echo "❌ 標記完成後庫存沒有增加 (變化: +$STOCK_DIFF)"
    exit 1
fi

echo "✅ Kitchen API 庫存更新測試通過"
echo "  - Before: $BEFORE_STOCK"
echo "  - After: $AFTER_STOCK"
echo "  - Added: $ADDED"
echo "  - 庫存正確增加 $STOCK_DIFF"

# 5. 測試 pending 狀態（庫存不應變化）
echo "📦 步驟 5: 測試 pending 狀態"
BEFORE_PENDING=$AFTER_STOCK

curl -s -X PUT \
  -H "Content-Type: application/json" \
  -d '{"status":"pending"}' \
  "$API_URL/api/kitchen/production/$TEST_DATE/$TEST_PRODUCT_ENCODED/status" > /dev/null

AFTER_PENDING=$(curl -s "$API_URL/api/products" | $JQ_CMD -r ".[] | select(.name == \"$TEST_PRODUCT\") | .current_stock // 0")

if [ "$BEFORE_PENDING" -ne "$AFTER_PENDING" ]; then
    echo "❌ 設定 pending 後庫存不應變化 ($BEFORE_PENDING → $AFTER_PENDING)"
    exit 1
fi

echo "✅ Pending 狀態測試通過 (庫存無變化)"

echo "🎉 === Kitchen API 庫存更新測試全部通過 ==="
