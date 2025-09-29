#!/bin/bash

# 地端開發環境設置腳本
echo "🏠 設置地端開發環境..."

# 切換到地端API配置
echo "🔧 切換到地端API配置..."
sed -i '' 's|https://order-system-production-6ef7.up.railway.app|http://localhost:3000|g' pos-system/src/services/api.js
sed -i '' 's|"proxy": "https://order-system-production-6ef7.up.railway.app"|"proxy": "http://localhost:3000"|g' pos-system/package.json

echo "✅ 地端API配置已設置"
echo "📋 現在可以啟動地端開發環境："
echo "  1. 啟動後端: npm run dev:server"
echo "  2. 啟動Order System: npm run dev:client"
echo "  3. 啟動POS System: npm run dev:pos"
echo ""
echo "🌐 地端網址："
echo "  - Order System: http://localhost:3001"
echo "  - POS System: http://localhost:3002"
echo "  - Backend API: http://localhost:3000"
