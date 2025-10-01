#!/bin/bash

# 地端開發啟動腳本
echo "🚀 啟動地端開發環境..."

# 設置地端環境變數
export REACT_APP_ENV=local

# 啟動後端
echo "📡 啟動後端服務器..."
npm start &

# 等待後端啟動
sleep 3

# 啟動前端
echo "🖥️ 啟動前端開發服務器..."
cd client
npm start

echo "✅ 地端開發環境啟動完成！"
echo "🌐 前端: http://localhost:3000"
echo "🔗 後端: http://localhost:3001"