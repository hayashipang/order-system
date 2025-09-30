#!/bin/bash

# Git 上傳前雲端備份腳本
# 確保每次上傳到 git 前都會先備份雲端資料

echo "🚀 開始 Git 上傳流程（含雲端備份）"
echo "=================================="

# 檢查當前目錄
if [ ! -f "package.json" ]; then
    echo "❌ 錯誤：請在項目根目錄執行此腳本"
    exit 1
fi

# 第一步：備份雲端資料
echo ""
echo "📋 第一步：備份雲端資料"
echo "======================"
./scripts/backup-cloud-data.sh

if [ $? -ne 0 ]; then
    echo "❌ 雲端備份失敗，停止上傳流程"
    exit 1
fi

echo ""
echo "📋 第二步：檢查 Git 狀態"
echo "======================"

# 檢查是否有未提交的更改
if [ -z "$(git status --porcelain)" ]; then
    echo "ℹ️  沒有未提交的更改"
    echo "✅ Git 狀態正常，無需上傳"
    exit 0
fi

# 顯示將要提交的文件
echo "📝 將要提交的文件："
git status --short

echo ""
echo "📋 第三步：Git 提交和推送"
echo "========================"

# 添加所有更改
echo "🔄 添加文件到暫存區..."
git add .

# 提交更改
echo "💾 提交更改..."
read -p "請輸入提交訊息 (或按 Enter 使用預設訊息): " commit_message

if [ -z "$commit_message" ]; then
    commit_message="feat: 更新系統功能和配置"
fi

git commit -m "$commit_message"

if [ $? -ne 0 ]; then
    echo "❌ Git 提交失敗"
    exit 1
fi

# 推送到遠端
echo "🚀 推送到遠端倉庫..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Git 上傳完成！"
    echo "=================="
    echo "✅ 雲端資料已備份"
    echo "✅ 程式碼已上傳到 Git"
    echo "✅ 可以安全地部署到雲端"
    echo ""
    echo "📋 備份檔案位置："
    echo "  - cloud_data_backups/ 目錄"
    echo "  - 最新備份：$(ls -t cloud_data_backups/complete_backup_*.json | head -1)"
else
    echo "❌ Git 推送失敗"
    exit 1
fi
