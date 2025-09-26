#!/bin/bash

# 🚀 本地開發環境設置腳本
# 此腳本會設置與雲端完全一致的本地開發環境

echo "🔧 設置本地開發環境..."

# 檢查 Node.js 版本
echo "📋 檢查 Node.js 版本..."
node_version=$(node -v)
echo "Node.js 版本: $node_version"

# 安裝後端依賴
echo "📦 安裝後端依賴..."
npm install

# 安裝前端依賴
echo "📦 安裝前端依賴..."
cd client
npm install
cd ..

# 創建環境變數檔案（如果不存在）
if [ ! -f ".env.local" ]; then
    echo "📝 創建本地環境變數檔案..."
    cp env.local .env.local
    echo "✅ 已創建 .env.local 檔案"
else
    echo "✅ .env.local 檔案已存在"
fi

# 檢查資料檔案
if [ ! -f "data.json" ]; then
    echo "📊 初始化資料檔案..."
    echo '{"users":[{"id":1,"username":"admin","password":"admin123","role":"admin"},{"id":2,"username":"kitchen","password":"kitchen123","role":"kitchen"}],"customers":[],"products":[{"id":1,"name":"蔬果73-元氣綠","price":120.00,"description":"綠色蔬果系列，富含維生素"},{"id":2,"name":"蔬果73-活力紅","price":120.00,"description":"紅色蔬果系列，抗氧化"}],"orders":[],"order_items":[]}' > data.json
    echo "✅ 已創建 data.json 檔案"
else
    echo "✅ data.json 檔案已存在"
fi

echo ""
echo "🎉 本地開發環境設置完成！"
echo ""
echo "📋 可用的指令："
echo "  npm run dev:full    - 同時啟動前後端開發伺服器"
echo "  npm run dev:server  - 只啟動後端開發伺服器"
echo "  npm run dev:client  - 只啟動前端開發伺服器"
echo "  npm run test:local  - 建構並測試本地部署"
echo "  npm run build       - 建構生產版本"
echo ""
echo "🌐 訪問地址："
echo "  前端: http://localhost:3000"
echo "  後端 API: http://localhost:3000/api"
echo ""
echo "🔑 測試帳號："
echo "  管理員: admin / admin123"
echo "  廚房員工: kitchen / kitchen123"
