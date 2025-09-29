#!/bin/bash

# 雲端資料備份腳本
echo "💾 開始備份雲端資料..."

# 設定雲端 API 網址
CLOUD_API_URL="https://order-system-production-6ef7.up.railway.app"

# 備份目錄
BACKUP_DIR="cloud_data_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 檢查備份目錄是否存在，如果不存在則創建
if [ ! -d "$BACKUP_DIR" ]; then
  mkdir -p "$BACKUP_DIR"
  echo "📁 創建備份目錄：$BACKUP_DIR"
fi

echo "📡 從雲端獲取資料..."

# 備份產品資料
echo "🔄 備份產品資料..."
curl -s "$CLOUD_API_URL/api/products" > "$BACKUP_DIR/products_${TIMESTAMP}.json"
if [ $? -eq 0 ]; then
    product_count=$(cat "$BACKUP_DIR/products_${TIMESTAMP}.json" | jq 'length')
    echo "  ✅ 產品資料已備份 ($product_count 個產品)"
else
    echo "  ❌ 產品資料備份失敗"
    exit 1
fi

# 備份客戶資料
echo "🔄 備份客戶資料..."
curl -s "$CLOUD_API_URL/api/customers" > "$BACKUP_DIR/customers_${TIMESTAMP}.json"
if [ $? -eq 0 ]; then
    customer_count=$(cat "$BACKUP_DIR/customers_${TIMESTAMP}.json" | jq 'length')
    echo "  ✅ 客戶資料已備份 ($customer_count 個客戶)"
else
    echo "  ❌ 客戶資料備份失敗"
    exit 1
fi

# 備份訂單資料
echo "🔄 備份訂單資料..."
curl -s "$CLOUD_API_URL/api/orders" > "$BACKUP_DIR/orders_${TIMESTAMP}.json"
if [ $? -eq 0 ]; then
    order_count=$(cat "$BACKUP_DIR/orders_${TIMESTAMP}.json" | jq 'length')
    echo "  ✅ 訂單資料已備份 ($order_count 個訂單)"
else
    echo "  ❌ 訂單資料備份失敗"
    exit 1
fi

# 創建完整備份檔案
echo "📦 創建完整備份檔案..."
cat > "$BACKUP_DIR/complete_backup_${TIMESTAMP}.json" << EOF
{
  "backup_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "products": $(cat "$BACKUP_DIR/products_${TIMESTAMP}.json"),
  "customers": $(cat "$BACKUP_DIR/customers_${TIMESTAMP}.json"),
  "orders": $(cat "$BACKUP_DIR/orders_${TIMESTAMP}.json")
}
EOF

echo "🎉 雲端資料備份完成！"
echo "📋 備份摘要："
echo "  - 產品：$product_count 個"
echo "  - 客戶：$customer_count 個"
echo "  - 訂單：$order_count 個"
echo "  - 備份檔案：$BACKUP_DIR/complete_backup_${TIMESTAMP}.json"
echo ""
echo "✅ 現在可以安全地部署新程式！"
