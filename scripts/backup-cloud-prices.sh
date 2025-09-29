#!/bin/bash

# 備份雲端產品價格腳本
echo "🔄 開始備份雲端產品價格..."

# 設定雲端 API 網址（需要您提供實際的雲端網址）
CLOUD_API_URL="https://your-railway-app.railway.app"  # 請替換為實際網址

# 備份目錄
BACKUP_DIR="cloud-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/cloud_prices_${TIMESTAMP}.json"

# 創建備份目錄
mkdir -p "$BACKUP_DIR"

echo "📡 從雲端獲取產品資料..."
curl -s "${CLOUD_API_URL}/api/products" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 雲端產品價格已備份到: $BACKUP_FILE"
    echo "📋 備份內容預覽:"
    jq '.[] | {id, name, price}' "$BACKUP_FILE"
else
    echo "❌ 備份失敗，請檢查雲端 API 網址"
    exit 1
fi

echo "💾 備份完成！"
