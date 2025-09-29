#!/bin/bash

# 快速部署腳本（無需備份，適用於小更新）
echo "⚡ 快速部署開始..."

# 檢查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "📋 發現未提交的更改，開始快速部署..."
    
    # 提交並推送程式碼
    echo "🔄 提交並推送程式碼..."
    git add .
    git commit -m "快速更新：$(date '+%Y-%m-%d %H:%M:%S')"
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ 程式碼已推送到 GitHub"
        echo "⏳ 等待部署完成..."
        echo "🌐 請稍後測試以下網址："
        echo "  - Order System: https://order-system-greenwins-projects.vercel.app/"
        echo "  - POS System: https://pos-system-pied.vercel.app/"
    else
        echo "❌ Git 推送失敗"
        exit 1
    fi
else
    echo "ℹ️  沒有未提交的更改，跳過部署"
fi

echo "🎉 快速部署完成！"
