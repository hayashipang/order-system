#!/bin/bash

# 🚀 部署腳本
# 此腳本會建構並準備部署到各個平台

echo "🚀 開始部署準備..."

# 檢查環境
echo "📋 檢查部署環境..."
if [ "$NODE_ENV" = "production" ]; then
    echo "✅ 生產環境模式"
else
    echo "⚠️  開發環境模式，切換到生產模式..."
    export NODE_ENV=production
fi

# 清理舊的建構檔案
echo "🧹 清理舊的建構檔案..."
npm run clean

# 安裝依賴
echo "📦 安裝依賴..."
npm install
cd client && npm install && cd ..

# 建構前端
echo "🔨 建構前端..."
npm run build:prod

# 檢查建構結果
if [ -d "client/build" ]; then
    echo "✅ 前端建構成功"
    echo "📊 建構檔案大小:"
    du -sh client/build
else
    echo "❌ 前端建構失敗"
    exit 1
fi

# 測試本地部署
echo "🧪 測試本地部署..."
timeout 10s npm start &
SERVER_PID=$!
sleep 5

# 檢查伺服器是否正常啟動
if curl -s http://localhost:3000/api > /dev/null; then
    echo "✅ 本地部署測試成功"
    kill $SERVER_PID 2>/dev/null
else
    echo "❌ 本地部署測試失敗"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 部署準備完成！"
echo ""
echo "📋 部署選項："
echo "  1. Vercel: 推送到 GitHub，Vercel 會自動部署"
echo "  2. Railway: 推送到 GitHub，Railway 會自動部署"
echo "  3. Netlify: 推送到 GitHub，Netlify 會自動部署"
echo ""
echo "💡 提示："
echo "  - 確保 GitHub repository 已連接部署平台"
echo "  - 檢查各平台的環境變數設定"
echo "  - 部署後測試所有功能是否正常"
