#!/bin/bash

# 🚀 整合部署腳本
# 用於快速部署到 Git、Vercel 和 Railway

echo "🚀 開始整合部署流程..."

# 檢查 Git 狀態
echo "📋 檢查 Git 狀態..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  發現未提交的變更，請先提交變更："
    git status
    read -p "是否要繼續部署？(y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 部署已取消"
        exit 1
    fi
fi

# 安裝依賴
echo "📦 安裝所有依賴..."
npm run install-all

# 構建專案
echo "🔨 構建專案..."
npm run build

# 檢查構建結果
if [ ! -d "client/build" ] || [ ! -d "pos-system/build" ]; then
    echo "❌ 構建失敗，請檢查錯誤訊息"
    exit 1
fi

echo "✅ 構建成功！"

# 提交到 Git
echo "📝 提交到 Git..."
git add .
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main

echo "🎉 部署完成！"
echo ""
echo "📊 部署狀態："
echo "  ✅ Git: 已推送到 GitHub"
echo "  ✅ Vercel: 自動部署中..."
echo "  ✅ Railway: 自動部署中..."
echo ""
echo "🌐 訪問地址："
echo "  📱 Order System: https://your-project.vercel.app"
echo "  💰 POS System: https://your-project.vercel.app/pos"
echo "  🔧 API: https://your-app-name.railway.app"
echo ""
echo "⏰ 部署通常需要 2-5 分鐘完成"