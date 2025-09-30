# Git 上傳流程備忘錄

## ⚠️ 重要提醒

**每次上傳到 Git 前，務必先備份雲端資料！**

## 🚀 標準流程

### 方法一：使用自動化腳本（推薦）
```bash
./scripts/git-upload-with-backup.sh
```

這個腳本會自動執行：
1. 備份雲端資料
2. 檢查 Git 狀態
3. 提交更改
4. 推送到遠端

### 方法二：手動流程
```bash
# 1. 備份雲端資料
./scripts/backup-cloud-data.sh

# 2. Git 提交和推送
git add .
git commit -m "您的提交訊息"
git push origin main
```

## 📋 備份內容

雲端備份包含：
- **產品資料** (`/api/products`)
- **客戶資料** (`/api/customers`) 
- **訂單資料** (`/api/orders`)

備份檔案位置：`cloud_data_backups/` 目錄

## 🔍 備份檔案格式

- `products_YYYYMMDD_HHMMSS.json` - 產品資料
- `customers_YYYYMMDD_HHMMSS.json` - 客戶資料
- `orders_YYYYMMDD_HHMMSS.json` - 訂單資料
- `complete_backup_YYYYMMDD_HHMMSS.json` - 完整備份

## ⚠️ 注意事項

1. **雲端 API 網址**: `https://order-system-production-6ef7.up.railway.app`
2. **備份時機**: 每次 Git 上傳前
3. **備份驗證**: 腳本會檢查備份是否成功
4. **失敗處理**: 如果備份失敗，會停止上傳流程

## 🆘 緊急恢復

如果需要恢復雲端資料：
```bash
./scripts/restore-cloud-data.sh
```

## 📞 聯絡資訊

如有問題，請檢查：
1. 雲端服務是否正常運行
2. 網路連線是否正常
3. 備份目錄權限是否正確
