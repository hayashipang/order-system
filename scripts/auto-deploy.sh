#!/bin/bash

# 一鍵自動化部署腳本
echo "🚀 一鍵自動化部署開始..."

# 檢查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo "📋 發現未提交的更改，開始自動化部署流程..."
    
    # 執行完整部署流程
    ./scripts/deploy-with-backup.sh
else
    echo "ℹ️  沒有未提交的更改，跳過部署"
    echo "💡 提示：如果您想強制部署，請先修改檔案或使用 git commit --allow-empty"
fi

echo "🎉 一鍵自動化部署完成！"
