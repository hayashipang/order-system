#!/bin/bash

# 快速同步腳本 - 只同步產品和客戶資料
echo "🚀 快速同步到雲端..."

CLOUD_API_URL="https://order-system-production-6ef7.up.railway.app"
DATA_FILE="data.local.json"

if [ ! -f "$DATA_FILE" ]; then
    echo "❌ 找不到本地資料檔案"
    exit 1
fi

# 同步產品資料
echo "🔄 同步產品資料..."
LOCAL_DATA=$(cat "$DATA_FILE")
PRODUCTS=$(echo "$LOCAL_DATA" | jq '.products')

echo "$PRODUCTS" | jq -c '.[]' | while read -r product; do
    product_id=$(echo "$product" | jq '.id')
    product_name=$(echo "$product" | jq -r '.name')
    
    curl -s -X PUT "${CLOUD_API_URL}/api/products/${product_id}" \
         -H "Content-Type: application/json" \
         -d "$product" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "  ✅ $product_name"
    else
        echo "  ❌ $product_name"
    fi
done

# 同步客戶資料
echo "🔄 同步客戶資料..."
CUSTOMERS=$(echo "$LOCAL_DATA" | jq '.customers')

echo "$CUSTOMERS" | jq -c '.[]' | while read -r customer; do
    customer_id=$(echo "$customer" | jq '.id')
    customer_name=$(echo "$customer" | jq -r '.name')
    
    # 先嘗試更新現有客戶
    response=$(curl -s -X PUT "${CLOUD_API_URL}/api/customers/${customer_id}" \
         -H "Content-Type: application/json" \
         -d "$customer")
    
    # 檢查回應是否包含錯誤
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        # 如果更新失敗，嘗試創建新客戶
        echo "  🔄 $customer_name (更新失敗，嘗試創建...)"
        create_response=$(curl -s -X POST "${CLOUD_API_URL}/api/customers" \
             -H "Content-Type: application/json" \
             -d "$customer")
        
        if echo "$create_response" | jq -e '.error' > /dev/null 2>&1; then
            echo "    ❌ $customer_name (創建也失敗)"
        else
            echo "    ✅ $customer_name (創建成功)"
        fi
    else
        echo "  ✅ $customer_name (更新成功)"
    fi
done

echo "🎉 快速同步完成！"
