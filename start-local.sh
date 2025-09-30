#!/bin/bash

# 果然盈訂單系統 - 地端快速啟動腳本
# 確保地端就對地端，雲端就對雲端

echo "🚀 啟動果然盈訂單系統 (地端模式)"
echo "=================================="

# 檢查當前目錄
if [ ! -f "package.json" ]; then
    echo "❌ 錯誤：請在項目根目錄執行此腳本"
    exit 1
fi

# 檢查配置文件
echo "🔍 檢查地端配置..."

# 檢查 env.local
if grep -q "PORT=3001" env.local && grep -q "API_BASE_URL=http://localhost:3001" env.local; then
    echo "✅ env.local 配置正確"
else
    echo "❌ env.local 配置錯誤，請檢查 CONFIGURATION_GUIDE.md"
    exit 1
fi

# 檢查 client/package.json
if grep -q '"proxy": "http://localhost:3001"' client/package.json; then
    echo "✅ client/package.json 配置正確"
else
    echo "❌ client/package.json 配置錯誤，請檢查 CONFIGURATION_GUIDE.md"
    exit 1
fi

# 檢查 pos-system/package.json
if grep -q '"proxy": "http://localhost:3001"' pos-system/package.json; then
    echo "✅ pos-system/package.json 配置正確"
else
    echo "❌ pos-system/package.json 配置錯誤，請檢查 CONFIGURATION_GUIDE.md"
    exit 1
fi

# 檢查 pos-system/src/services/api.js
if grep -q "const API_BASE_URL = 'http://localhost:3001'" pos-system/src/services/api.js; then
    echo "✅ pos-system/src/services/api.js 配置正確"
else
    echo "❌ pos-system/src/services/api.js 配置錯誤，請檢查 CONFIGURATION_GUIDE.md"
    exit 1
fi

echo ""
echo "🎯 配置檢查完成，開始啟動服務..."
echo ""

# 停止現有服務
echo "🛑 停止現有服務..."
pkill -f "node server.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
sleep 2

# 啟動後端API服務 (端口3001)
echo "🔧 啟動後端API服務 (端口3001)..."
cd "$(dirname "$0")"
npm start > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   後端服務 PID: $BACKEND_PID"

# 等待後端啟動
echo "⏳ 等待後端服務啟動..."
sleep 5

# 檢查後端是否啟動成功
if curl -s http://localhost:3001/api/products > /dev/null; then
    echo "✅ 後端API服務啟動成功"
else
    echo "❌ 後端API服務啟動失敗"
    exit 1
fi

# 啟動前端管理系統 (端口3000)
echo "🖥️  啟動前端管理系統 (端口3000)..."
cd client
npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   前端服務 PID: $FRONTEND_PID"
cd ..

# 啟動POS收銀系統 (端口3002)
echo "💰 啟動POS收銀系統 (端口3002)..."
cd pos-system
npm start > ../logs/pos.log 2>&1 &
POS_PID=$!
echo "   POS服務 PID: $POS_PID"
cd ..

# 創建日誌目錄
mkdir -p logs

# 等待服務啟動
echo "⏳ 等待所有服務啟動..."
sleep 10

# 檢查所有服務狀態
echo ""
echo "🔍 檢查服務狀態..."
echo "=================="

# 檢查後端
if curl -s http://localhost:3001/api/products > /dev/null; then
    echo "✅ 後端API服務 (3001): 正常"
else
    echo "❌ 後端API服務 (3001): 異常"
fi

# 檢查前端
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ 前端管理系統 (3000): 正常"
else
    echo "❌ 前端管理系統 (3000): 異常"
fi

# 檢查POS
if curl -s http://localhost:3002 > /dev/null; then
    echo "✅ POS收銀系統 (3002): 正常"
else
    echo "❌ POS收銀系統 (3002): 異常"
fi

echo ""
echo "🎉 果然盈訂單系統啟動完成！"
echo "=========================="
echo ""
echo "🌐 訪問地址："
echo "   前端管理系統: http://localhost:3000"
echo "   後端API服務:  http://localhost:3001"
echo "   POS收銀系統:  http://localhost:3002"
echo ""
echo "📋 服務進程："
echo "   後端服務 PID: $BACKEND_PID"
echo "   前端服務 PID: $FRONTEND_PID"
echo "   POS服務 PID:  $POS_PID"
echo ""
echo "📝 日誌文件："
echo "   後端日誌: logs/backend.log"
echo "   前端日誌: logs/frontend.log"
echo "   POS日誌:  logs/pos.log"
echo ""
echo "🛑 停止服務："
echo "   kill $BACKEND_PID $FRONTEND_PID $POS_PID"
echo ""
echo "⚠️  記住：地端就對地端，雲端就對雲端，不要混亂！"
