# 🚀 果然盈系統 - 常用指令指南

## 📱 地端開發環境

### 1. 啟動地端服務
```bash
# 快速啟動所有服務（推薦）
./start-local.sh

# 或分別啟動（需要三個終端）
npm run dev:server    # 後端 API (端口 3001)
npm run dev:client    # 訂單管理系統 (端口 3000)  
npm run dev:pos       # POS 收銀系統 (端口 3002)
```

### 2. 訪問地端系統
- 訂單管理系統: http://localhost:3000
- POS 收銀系統: http://localhost:3002

## ☁️ 雲端生產環境

### 直接訪問（無需指令）
- 訂單管理系統: https://order-system-production-6ef7.up.railway.app/
- POS 收銀系統: https://pos-system-pied.vercel.app/

## 🔄 環境切換

```bash
# 切換到地端開發環境
npm run config:local

# 切換到雲端生產環境  
npm run config:production
```

## 📦 安裝與建置

```bash
# 安裝所有依賴
npm run install-all

# 建置所有系統
npm run build

# 清理專案
npm run clean
```

## 💾 資料備份與恢復

```bash
# 備份雲端資料
npm run backup

# 恢復雲端資料
npm run restore
```

## 🚀 Git 上傳（含自動備份）

```bash
# 安全上傳（推薦 - 會自動備份雲端資料）
./scripts/git-upload-with-backup.sh

# 或手動執行
npm run backup
git add .
git commit -m "您的提交訊息"
git push origin main
```

## 🛠️ 部署

```bash
# 完整部署（含備份）
npm run deploy:full

# 快速部署
npm run deploy:quick
```

## 📋 常用指令速查

| 功能 | 指令 | 說明 |
|------|------|------|
| 啟動地端 | `./start-local.sh` | 啟動所有地端服務 |
| 環境切換 | `npm run config:local` | 切換到地端配置 |
| 環境切換 | `npm run config:production` | 切換到雲端配置 |
| 安裝依賴 | `npm run install-all` | 安裝所有依賴 |
| 建置專案 | `npm run build` | 建置所有系統 |
| 備份資料 | `npm run backup` | 備份雲端資料 |
| Git 上傳 | `./scripts/git-upload-with-backup.sh` | 安全上傳到 Git |
| 清理專案 | `npm run clean` | 清理建置檔案 |

## ⚠️ 重要提醒

1. **地端開發**: 使用 `./start-local.sh` 啟動所有服務
2. **雲端部署**: 推送代碼到 Git 後自動部署
3. **資料安全**: 每次 Git 上傳前都會自動備份雲端資料
4. **環境切換**: 切換環境後需要重新啟動服務

## 🆘 故障排除

```bash
# 檢查端口使用
lsof -i :3000
lsof -i :3001  
lsof -i :3002

# 重新安裝依賴
npm run clean
npm run install-all

# 檢查配置
cat .env
```
