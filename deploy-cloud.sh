#!/bin/bash

# 雲端部署腳本
echo "☁️ 準備雲端部署..."

# 設置雲端環境變數
export REACT_APP_ENV=cloud

# 編譯前端
echo "🔨 編譯前端..."
cd client
npm run build

# 返回根目錄
cd ..

# 提交到Git
echo "📤 上傳到Git..."
git add .
git commit -m "Deploy: 雲端部署更新"
git push origin main

echo "✅ 雲端部署完成！"
echo "🌐 雲端系統: https://order-system-production-6ef7.up.railway.app"
echo "⏳ 請等待2-3分鐘讓Railway完成部署..."
