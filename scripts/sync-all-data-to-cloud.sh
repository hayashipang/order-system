#!/bin/bash

# 同步所有資料到雲端腳本
echo "🔄 開始同步所有資料到雲端..."

# 設定雲端 API 網址
CLOUD_API_URL="https://order-system-production-6ef7.up.railway.app"

# 檢查本地資料檔案
DATA_FILE="data.local.json"
if [ ! -f "$DATA_FILE" ]; then
    echo "❌ 錯誤：找不到本地資料檔案 $DATA_FILE"
    exit 1
fi

echo "📁 找到本地資料檔案：$DATA_FILE"

# 備份目錄
BACKUP_DIR="sync_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 檢查備份目錄是否存在，如果不存在則創建
if [ ! -d "$BACKUP_DIR" ]; then
  mkdir -p "$BACKUP_DIR"
  echo "📁 創建備份目錄：$BACKUP_DIR"
fi

# 備份雲端現有資料
echo "💾 備份雲端現有資料..."
curl -s "$CLOUD_API_URL/api/products" > "$BACKUP_DIR/cloud_products_${TIMESTAMP}.json"
curl -s "$CLOUD_API_URL/api/customers" > "$BACKUP_DIR/cloud_customers_${TIMESTAMP}.json"
curl -s "$CLOUD_API_URL/api/orders" > "$BACKUP_DIR/cloud_orders_${TIMESTAMP}.json"
echo "✅ 雲端資料已備份到 $BACKUP_DIR/"

# 讀取本地資料
echo "📖 讀取本地資料..."
LOCAL_DATA=$(cat "$DATA_FILE")
echo "✅ 本地資料讀取完成"

# 同步產品資料
echo "🔄 同步產品資料..."
PRODUCTS=$(echo "$LOCAL_DATA" | jq '.products')
if [ $? -eq 0 ]; then
    echo "✅ 產品資料解析成功"
    echo "📊 本地產品數量：$(echo "$PRODUCTS" | jq 'length')"
    
    # 同步每個產品
    echo "$PRODUCTS" | jq -c '.[]' | while read -r product; do
        product_id=$(echo "$product" | jq '.id')
        product_name=$(echo "$product" | jq -r '.name')
        product_price=$(echo "$product" | jq '.price')
        
        echo "  🔄 同步產品 ID $product_id: $product_name (價格: $product_price)"
        
        # 更新產品到雲端
        curl -s -X PUT "${CLOUD_API_URL}/api/products/${product_id}" \
             -H "Content-Type: application/json" \
             -d "$product" > /dev/null
        
        if [ $? -eq 0 ]; then
            echo "    ✅ 產品 '$product_name' 同步成功"
        else
            echo "    ❌ 產品 '$product_name' 同步失敗"
        fi
    done
else
    echo "❌ 產品資料解析失敗"
fi

# 同步客戶資料
echo "🔄 同步客戶資料..."
CUSTOMERS=$(echo "$LOCAL_DATA" | jq '.customers')
if [ $? -eq 0 ]; then
    echo "✅ 客戶資料解析成功"
    echo "📊 本地客戶數量：$(echo "$CUSTOMERS" | jq 'length')"
    
    # 同步每個客戶
    echo "$CUSTOMERS" | jq -c '.[]' | while read -r customer; do
        customer_id=$(echo "$customer" | jq '.id')
        customer_name=$(echo "$customer" | jq -r '.name')
        
        echo "  🔄 同步客戶 ID $customer_id: $customer_name"
        
        # 更新客戶到雲端
        curl -s -X PUT "${CLOUD_API_URL}/api/customers/${customer_id}" \
             -H "Content-Type: application/json" \
             -d "$customer" > /dev/null
        
        if [ $? -eq 0 ]; then
            echo "    ✅ 客戶 '$customer_name' 同步成功"
        else
            echo "    ❌ 客戶 '$customer_name' 同步失敗"
        fi
    done
else
    echo "❌ 客戶資料解析失敗"
fi

# 同步訂單資料
echo "🔄 同步訂單資料..."
ORDERS=$(echo "$LOCAL_DATA" | jq '.orders')
if [ $? -eq 0 ]; then
    echo "✅ 訂單資料解析成功"
    echo "📊 本地訂單數量：$(echo "$ORDERS" | jq 'length')"
    
    # 注意：訂單通常不應該直接覆蓋，而是新增
    # 這裡我們只顯示訂單數量，不進行同步
    echo "ℹ️  訂單資料通常不建議直接同步，建議手動處理"
else
    echo "❌ 訂單資料解析失敗"
fi

echo "🎉 資料同步完成！"
echo "📋 同步摘要："
echo "  - 產品資料：已同步到雲端"
echo "  - 客戶資料：已同步到雲端"
echo "  - 訂單資料：僅顯示數量，未同步（建議手動處理）"
echo "  - 備份檔案：已保存到 $BACKUP_DIR/"
echo ""
echo "✅ 現在您可以安心更新程式，資料不會丟失！"
