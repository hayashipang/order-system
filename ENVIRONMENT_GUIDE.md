# 環境分離使用指南

## 🎯 **概述**
現在地端和雲端已經完全分離，不會再互相干擾！

## 🖥️ **地端開發**

### 啟動地端開發環境：
```bash
./start-local.sh
```

### 地端配置：
- **前端**: http://localhost:3000
- **後端**: http://localhost:3001
- **API**: 連接到本地後端
- **資料**: 使用本地 data.local.json

## ☁️ **雲端部署**

### 部署到雲端：
```bash
./deploy-cloud.sh
```

### 雲端配置：
- **網址**: https://order-system-production-6ef7.up.railway.app
- **API**: 連接到雲端後端
- **資料**: 使用雲端資料庫

## 🔧 **配置檔案說明**

- `config.local.js` - 地端開發配置
- `config.cloud.js` - 雲端生產配置
- `config.js` - 自動選擇配置（根據環境變數）

## 🚀 **使用流程**

### 開發新功能：
1. 使用 `./start-local.sh` 啟動地端開發
2. 在 localhost:3000 測試功能
3. 完成後使用 `./deploy-cloud.sh` 部署到雲端

### 測試雲端功能：
1. 直接訪問 https://order-system-production-6ef7.up.railway.app
2. 或使用 `./deploy-cloud.sh` 部署最新版本

## ⚠️ **注意事項**

- 地端和雲端現在完全獨立
- 地端修改不會影響雲端
- 雲端部署不會影響地端開發
- 每次部署後等待2-3分鐘讓Railway完成部署
