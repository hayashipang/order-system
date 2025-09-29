#!/bin/bash

# 📦 資料備份腳本
# 用於備份重要的業務資料

echo "🔄 開始備份資料..."

# 創建備份目錄
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# 備份主要資料文件
echo "📋 備份 data.local.json..."
cp data.local.json "$BACKUP_DIR/"

# 備份其他重要文件
echo "📋 備份其他配置..."
cp -r client/build "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  client/build 不存在"
cp -r pos-system/build "$BACKUP_DIR/" 2>/dev/null || echo "⚠️  pos-system/build 不存在"

# 創建備份清單
echo "📝 創建備份清單..."
ls -la "$BACKUP_DIR" > "$BACKUP_DIR/backup_list.txt"

echo "✅ 備份完成！"
echo "📁 備份位置: $BACKUP_DIR"
echo "📊 備份內容:"
cat "$BACKUP_DIR/backup_list.txt"

# 顯示資料統計
echo ""
echo "📈 資料統計:"
echo "客戶數量: $(jq '.customers | length' data.local.json)"
echo "產品數量: $(jq '.products | length' data.local.json)"
echo "訂單數量: $(jq '.orders | length' data.local.json)"
echo "POS 銷售: $(jq '[.orders[] | select(.order_type == "walk-in")] | length' data.local.json)"
