#!/bin/bash

echo "🚂 部署到 Railway..."

# 確保所有依賴都已安裝
echo "📦 安裝依賴..."
npm install

# 構建客戶端（如果需要）
if [ -d "client" ]; then
    echo "🔨 構建客戶端..."
    cd client
    npm install
    npm run build
    cd ..
fi

# 檢查關鍵文件
echo "✅ 檢查關鍵文件..."
if [ ! -f "server.js" ]; then
    echo "❌ server.js 不存在"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ package.json 不存在"
    exit 1
fi

if [ ! -f "railway.json" ]; then
    echo "❌ railway.json 不存在"
    exit 1
fi

echo "✅ 所有文件檢查完成"
echo "🚀 準備部署到 Railway..."

# 顯示部署信息
echo "📋 部署信息："
echo "  - 服務器: server.js"
echo "  - 端口: \$PORT (Railway 自動設定)"
echo "  - 健康檢查: /health"
echo "  - 根路徑: /"

echo "🌐 部署完成後，您的應用將在以下網址運行："
echo "  https://your-app-name.railway.app"
