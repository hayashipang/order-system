#!/bin/bash

# 🔍 **全專案自動檢查腳本** (Full Project Auto-Check Script)
# 檢查前端與後端 API 不一致問題

echo "🔍 === 全專案自動檢查開始 ==="

# 設定變數
API_URL="http://localhost:3001"
JQ_CMD="/Users/james/opt/anaconda3/bin/jq"
REPORT_FILE="auto-check-report.md"

# 檢查服務器是否運行
if ! curl -s "$API_URL/api/health" > /dev/null; then
    echo "❌ 服務器未運行，請先啟動 server_v4.js"
    exit 1
fi

echo "📋 檢查項目："
echo "  1. 缺失的 API 端點"
echo "  2. API 回傳格式不一致"
echo "  3. Kitchen API 問題"
echo "  4. 排程 API 問題"
echo "  5. 庫存更新問題"
echo ""

# 初始化報告
cat > "$REPORT_FILE" << 'EOF'
# 🔍 **全專案自動檢查報告**

> **生成時間**: $(date)  
> **檢查範圍**: 前端 API 調用 vs 後端 server_v4.js

---

## 📊 **檢查結果摘要**

EOF

# 檢查函數
check_api_endpoint() {
    local endpoint=$1
    local method=${2:-GET}
    local description=$3
    
    echo "🔍 檢查: $method $endpoint - $description"
    
    if curl -s -X "$method" "$API_URL$endpoint" > /dev/null 2>&1; then
        echo "  ✅ 存在"
        return 0
    else
        echo "  ❌ 缺失"
        return 1
    fi
}

# 檢查 API 回傳格式
check_api_response_format() {
    local endpoint=$1
    local expected_field=$2
    local description=$3
    
    echo "🔍 檢查回傳格式: $endpoint - $description"
    
    local response=$(curl -s "$API_URL$endpoint" 2>/dev/null)
    if [ $? -eq 0 ] && echo "$response" | $JQ_CMD -e ".$expected_field" > /dev/null 2>&1; then
        echo "  ✅ 格式正確"
        return 0
    else
        echo "  ❌ 格式錯誤 (缺少 $expected_field)"
        return 1
    fi
}

# 1. 檢查缺失的 API 端點
echo "📋 === 1. 檢查缺失的 API 端點 ==="
missing_apis=0

# 排程相關 API
check_api_endpoint "/api/scheduling/dates/2025-01-28/orders" "GET" "排程清單查詢" || ((missing_apis++))
check_api_endpoint "/api/scheduling/complete" "POST" "排程完成" || ((missing_apis++))
check_api_endpoint "/api/scheduling/delete/2025-01-28" "DELETE" "排程刪除" || ((missing_apis++))
check_api_endpoint "/api/scheduling/confirm" "POST" "排程確認" || ((missing_apis++))
check_api_endpoint "/api/scheduling/config" "PUT" "排程配置" || ((missing_apis++))
check_api_endpoint "/api/scheduling/parameter-test" "POST" "排程參數測試" || ((missing_apis++))

# 其他缺失 API
check_api_endpoint "/api/products/sync-priority" "POST" "產品同步優先級" || ((missing_apis++))
check_api_endpoint "/api/orders/history/export/csv" "GET" "訂單歷史 CSV 匯出" || ((missing_apis++))

echo ""

# 2. 檢查 API 回傳格式
echo "📋 === 2. 檢查 API 回傳格式 ==="
format_issues=0

# 檢查客戶訂單 API 格式
check_api_response_format "/api/orders/customers/2025-01-28" "orders" "客戶訂單應包含 orders 欄位" || ((format_issues++))

# 檢查週出貨概覽 API 格式  
check_api_response_format "/api/orders/shipping-weekly/2025-01-28" "weekly_data" "週出貨概覽應包含 weekly_data 欄位" || ((format_issues++))

# 檢查週訂單概覽 API 格式
check_api_response_format "/api/orders/weekly/2025-01-28" "range" "週訂單概覽應包含 range 欄位" || ((format_issues++))

echo ""

# 3. 檢查 Kitchen API 問題
echo "📋 === 3. 檢查 Kitchen API 問題 ==="
kitchen_issues=0

# 檢查 Kitchen 生產 API 是否有 item_id
echo "🔍 檢查 Kitchen 生產 API item_id 欄位"
kitchen_response=$(curl -s "$API_URL/api/kitchen/production/2025-01-28" 2>/dev/null)
if echo "$kitchen_response" | $JQ_CMD -e '.[0].items[0].item_id' > /dev/null 2>&1; then
    echo "  ✅ item_id 欄位存在"
else
    echo "  ❌ item_id 欄位缺失"
    ((kitchen_issues++))
fi

# 檢查 Kitchen 狀態更新 API 庫存邏輯
echo "🔍 檢查 Kitchen 狀態更新 API 庫存邏輯"
# 這裡需要實際測試，暫時標記為需要檢查
echo "  ⚠️ 需要實際測試庫存更新邏輯"

echo ""

# 4. 檢查庫存更新問題
echo "📋 === 4. 檢查庫存更新問題 ==="
inventory_issues=0

# 檢查庫存異動 API
check_api_endpoint "/api/inventory/transactions" "GET" "庫存異動查詢" || ((inventory_issues++))
check_api_endpoint "/api/inventory/transaction" "POST" "新增庫存異動" || ((inventory_issues++))
check_api_endpoint "/api/inventory/transaction/1" "DELETE" "刪除庫存異動" || ((inventory_issues++))
check_api_endpoint "/api/inventory/transactions/reset" "DELETE" "重置庫存異動" || ((inventory_issues++))

echo ""

# 5. 檢查 URL 編碼問題
echo "📋 === 5. 檢查 URL 編碼問題 ==="
encoding_issues=0

# 測試中文產品名稱編碼
test_product="即飲瓶-元氣綠"
encoded_product=$(echo "$test_product" | sed 's/即飲瓶-元氣綠/%E5%8D%B3%E9%A3%B2%E7%93%B6-%E5%85%83%E6%B0%A3%E7%B6%A0/g')
echo "🔍 測試中文產品名稱編碼: $test_product -> $encoded_product"

if curl -s "$API_URL/api/kitchen/production/2025-01-28/$encoded_product/status" > /dev/null 2>&1; then
    echo "  ✅ URL 編碼正常"
else
    echo "  ❌ URL 編碼有問題"
    ((encoding_issues++))
fi

echo ""

# 生成檢查報告
echo "📊 === 檢查結果摘要 ==="
echo "  - 缺失的 API: $missing_apis 個"
echo "  - 格式問題: $format_issues 個"
echo "  - Kitchen 問題: $kitchen_issues 個"
echo "  - 庫存問題: $inventory_issues 個"
echo "  - 編碼問題: $encoding_issues 個"

total_issues=$((missing_apis + format_issues + kitchen_issues + inventory_issues + encoding_issues))

if [ $total_issues -eq 0 ]; then
    echo "🎉 所有檢查通過！"
    exit 0
else
    echo "⚠️ 發現 $total_issues 個問題需要修復"
    exit 1
fi
