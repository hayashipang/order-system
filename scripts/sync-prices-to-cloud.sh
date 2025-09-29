#!/bin/bash

# 同步本地價格到雲端腳本
echo "🔄 開始同步價格到雲端..."

# 設定雲端 API 網址（需要您提供實際的雲端網址）
CLOUD_API_URL="https://your-railway-app.railway.app"  # 請替換為實際網址

# 價格設定（根據您的需求）
declare -A PRICES=(
    ["1"]="134"  # 蔬果73-元氣綠
    ["2"]="134"  # 蔬果73-活力紅
    ["3"]="134"  # 蔬果73-亮妍莓
    ["4"]="134"  # 蔬菜73-幸運果
    ["5"]="134"  # 蔬菜100-順暢綠
    ["6"]="134"  # 蔬菜100-養生黑
    ["7"]="139"  # 蔬菜100-養眼晶(有機枸杞)
    ["8"]="139"  # 蔬菜100-法國黑巧70
    ["9"]="0"    # 隨機送
)

echo "📡 開始更新雲端產品價格..."

for product_id in "${!PRICES[@]}"; do
    price="${PRICES[$product_id]}"
    echo "🔄 更新產品 ID $product_id 價格為 $price 元..."
    
    # 獲取產品名稱
    product_name=$(curl -s "${CLOUD_API_URL}/api/products" | jq -r ".[] | select(.id==$product_id) | .name")
    
    if [ "$product_name" != "null" ] && [ -n "$product_name" ]; then
        # 更新產品價格
        response=$(curl -s -X PUT "${CLOUD_API_URL}/api/products/$product_id" \
            -H "Content-Type: application/json" \
            -d "{\"name\": \"$product_name\", \"price\": $price}")
        
        if echo "$response" | jq -e '.message' > /dev/null 2>&1; then
            echo "✅ 產品 '$product_name' 價格已更新為 $price 元"
        else
            echo "❌ 產品 '$product_name' 更新失敗"
        fi
    else
        echo "⚠️  找不到產品 ID $product_id"
    fi
    
    # 避免請求過於頻繁
    sleep 1
done

echo "🎉 價格同步完成！"
echo "🔍 請檢查雲端系統確認價格是否正確"
