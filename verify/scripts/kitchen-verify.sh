#!/usr/bin/env bash
set -euo pipefail

echo "🍳 開始 Kitchen 資料驗證..."

BASE="http://localhost:3001"
JQ_CMD="/Users/james/opt/anaconda3/bin/jq"

# 測試日期
TEST_DATE="2025-10-28"

echo "1) 呼叫 GET /api/kitchen/production/:date"
RESPONSE=$(curl -fsS "$BASE/api/kitchen/production/$TEST_DATE")

if [ $? -ne 0 ]; then
    echo "   ❌ Kitchen API 呼叫失敗"
    exit 1
fi

echo "   ✅ Kitchen API 回應正常"

echo "2) 檢查資料結構完整性"
ITEM_COUNT=$(echo "$RESPONSE" | $JQ_CMD '[.[] | select(.items != null) | .items[]] | length')
echo "   📊 總共檢查了 $ITEM_COUNT 個 items"

echo "3) 驗證 Kitchen API 回應格式"
# 檢查回應是否為陣列
IS_ARRAY=$(echo "$RESPONSE" | $JQ_CMD -r 'if type == "array" then "true" else "false" end')
if [ "$IS_ARRAY" = "true" ]; then
    echo "   ✅ API 回應格式正確 (陣列)"
else
    echo "   ❌ API 回應格式錯誤 (非陣列)"
    exit 1
fi

echo "4) 檢查訂單項目結構"
# 檢查每個訂單是否有 items（可以是陣列或字串）
INVALID_ORDERS=$(echo "$RESPONSE" | $JQ_CMD -r '
  .[] | 
  select(.items == null) | 
  .id
')

if [ -n "$INVALID_ORDERS" ]; then
    echo "   ❌ 發現無效的訂單結構:"
    echo "$INVALID_ORDERS" | while read -r order_id; do
        echo "     - 訂單 ID: $order_id"
    done
    exit 1
else
    echo "   ✅ 所有訂單都有 items 欄位"
fi

echo ""
echo "🎉 Kitchen 資料驗證完成！"
echo "   - API 回應: ✅"
echo "   - 資料結構: ✅"
echo "   - JSON 格式: ✅"
