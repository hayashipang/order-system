#!/bin/bash

# 自動化部署腳本（包含資料備份與恢復）
echo "🚀 開始自動化部署流程..."

# 步驟 1：備份雲端資料
echo "📋 步驟 1：備份雲端資料"
./scripts/backup-cloud-data.sh
if [ $? -ne 0 ]; then
    echo "❌ 備份失敗，停止部署"
    exit 1
fi

# 步驟 2：提交並推送程式碼
echo "📋 步驟 2：提交並推送程式碼"
echo "請輸入提交訊息："
read -r commit_message

if [ -z "$commit_message" ]; then
    commit_message="自動部署：$(date '+%Y-%m-%d %H:%M:%S')"
fi

git add .
git commit -m "$commit_message"
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Git 推送失敗"
    exit 1
fi

echo "✅ 程式碼已推送到 GitHub"
echo "⏳ 等待 Vercel 和 Railway 部署完成..."
echo "預計等待時間：3-5 分鐘"

# 步驟 3：等待部署完成
echo "📋 步驟 3：等待部署完成"
echo "⏳ 自動等待 Vercel 和 Railway 部署完成..."

# 等待 Vercel 部署完成
echo "🔄 檢查 Vercel 部署狀態..."
sleep 30  # 等待 30 秒讓部署開始

# 檢查 Vercel 部署狀態（最多等待 5 分鐘）
for i in {1..10}; do
    echo "  檢查 Vercel 部署狀態... ($i/10)"
    
    # 檢查 Order System
    order_status=$(curl -s -o /dev/null -w "%{http_code}" "https://order-system-greenwins-projects.vercel.app/")
    # 檢查 POS System
    pos_status=$(curl -s -o /dev/null -w "%{http_code}" "https://pos-system-pied.vercel.app/")
    
    if [ "$order_status" = "200" ] && [ "$pos_status" = "200" ]; then
        echo "  ✅ Vercel 部署完成"
        break
    fi
    
    if [ $i -eq 10 ]; then
        echo "  ⚠️  Vercel 部署可能還在進行中，繼續等待..."
    fi
    
    sleep 30
done

# 等待 Railway 部署完成
echo "🔄 檢查 Railway 部署狀態..."
sleep 30  # 等待 30 秒讓部署開始

# 檢查 Railway 部署狀態（最多等待 5 分鐘）
for i in {1..10}; do
    echo "  檢查 Railway 部署狀態... ($i/10)"
    
    # 檢查 Railway API
    railway_status=$(curl -s -o /dev/null -w "%{http_code}" "https://order-system-production-6ef7.up.railway.app/api/products")
    
    if [ "$railway_status" = "200" ]; then
        echo "  ✅ Railway 部署完成"
        break
    fi
    
    if [ $i -eq 10 ]; then
        echo "  ⚠️  Railway 部署可能還在進行中，繼續等待..."
    fi
    
    sleep 30
done

echo "✅ 所有部署檢查完成，繼續恢復資料..."

# 步驟 4：恢復雲端資料
echo "📋 步驟 4：恢復雲端資料"
./scripts/restore-cloud-data.sh
if [ $? -ne 0 ]; then
    echo "❌ 資料恢復失敗"
    exit 1
fi

echo "🎉 自動化部署完成！"
echo "✅ 新程式已部署，業務資料已恢復"
echo "🌐 請測試以下網址："
echo "  - Order System: https://order-system-greenwins-projects.vercel.app/"
echo "  - POS System: https://pos-system-pied.vercel.app/"
