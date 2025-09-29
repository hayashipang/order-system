#!/bin/bash

# 雲端資料恢復腳本
echo "🔄 開始恢復雲端資料..."

# 設定雲端 API 網址
CLOUD_API_URL="https://order-system-production-6ef7.up.railway.app"

# 備份目錄
BACKUP_DIR="cloud_data_backups"

# 檢查備份目錄是否存在
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ 錯誤：找不到備份目錄 $BACKUP_DIR"
    exit 1
fi

# 找到最新的完整備份檔案
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/complete_backup_*.json 2>/dev/null | head -n1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "❌ 錯誤：找不到備份檔案"
    exit 1
fi

echo "📁 使用備份檔案：$LATEST_BACKUP"

# 等待雲端服務啟動
echo "⏳ 等待雲端服務啟動..."
sleep 10

# 恢復產品資料
echo "🔄 恢復產品資料..."
PRODUCTS=$(cat "$LATEST_BACKUP" | jq '.products')
echo "$PRODUCTS" | jq -c '.[]' | while read -r product; do
    product_id=$(echo "$product" | jq '.id')
    product_name=$(echo "$product" | jq -r '.name')
    
    # 先嘗試更新現有產品
    response=$(curl -s -X PUT "${CLOUD_API_URL}/api/products/${product_id}" \
         -H "Content-Type: application/json" \
         -d "$product")
    
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        echo "  🔄 $product_name (更新失敗，嘗試創建...)"
        create_response=$(curl -s -X POST "${CLOUD_API_URL}/api/products" \
             -H "Content-Type: application/json" \
             -d "$product")
        
        if echo "$create_response" | jq -e '.error' > /dev/null 2>&1; then
            echo "    ❌ $product_name (創建也失敗)"
        else
            echo "    ✅ $product_name (創建成功)"
        fi
    else
        echo "  ✅ $product_name (更新成功)"
    fi
done

# 恢復客戶資料
echo "🔄 恢復客戶資料..."
CUSTOMERS=$(cat "$LATEST_BACKUP" | jq '.customers')
echo "$CUSTOMERS" | jq -c '.[]' | while read -r customer; do
    customer_id=$(echo "$customer" | jq '.id')
    customer_name=$(echo "$customer" | jq -r '.name')
    
    # 先嘗試更新現有客戶
    response=$(curl -s -X PUT "${CLOUD_API_URL}/api/customers/${customer_id}" \
         -H "Content-Type: application/json" \
         -d "$customer")
    
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
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

# 恢復訂單資料
echo "🔄 恢復訂單資料..."
ORDERS=$(cat "$LATEST_BACKUP" | jq '.orders')
echo "$ORDERS" | jq -c '.[]' | while read -r order; do
    order_id=$(echo "$order" | jq '.id')
    order_customer=$(echo "$order" | jq -r '.customer_name // "未知客戶"')
    
    # 先嘗試更新現有訂單
    response=$(curl -s -X PUT "${CLOUD_API_URL}/api/orders/${order_id}" \
         -H "Content-Type: application/json" \
         -d "$order")
    
    if echo "$response" | jq -e '.error' > /dev/null 2>&1; then
        echo "  🔄 訂單 $order_id ($order_customer) (更新失敗，嘗試創建...)"
        create_response=$(curl -s -X POST "${CLOUD_API_URL}/api/orders" \
             -H "Content-Type: application/json" \
             -d "$order")
        
        if echo "$create_response" | jq -e '.error' > /dev/null 2>&1; then
            echo "    ❌ 訂單 $order_id (創建也失敗)"
        else
            echo "    ✅ 訂單 $order_id (創建成功)"
        fi
    else
        echo "  ✅ 訂單 $order_id ($order_customer) (更新成功)"
    fi
done

echo "🎉 雲端資料恢復完成！"
echo "✅ 所有業務資料已恢復到雲端"
