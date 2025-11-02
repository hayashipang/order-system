# GreenWin Backend v3 部署指南

## 🚀 快速部署

### 本地開發
```bash
# 1. 安裝依賴
npm install

# 2. 啟動開發伺服器
npm run dev

# 3. 檢查狀態
curl http://localhost:3000/api/health
```

### Vercel 部署
```bash
# 1. 安裝 Vercel CLI
npm i -g vercel

# 2. 登入 Vercel
vercel login

# 3. 部署
vercel --prod

# 4. 設定環境變數
vercel env add DATABASE_URL
```

### Railway 部署
```bash
# 1. 安裝 Railway CLI
npm i -g @railway/cli

# 2. 登入 Railway
railway login

# 3. 初始化專案
railway init

# 4. 部署
railway up

# 5. 設定環境變數
railway variables set DATABASE_URL=postgresql://...
```

## 📋 部署檢查清單

### 本地開發
- [ ] Node.js >= 18.0.0
- [ ] npm 或 yarn 已安裝
- [ ] 專案依賴已安裝
- [ ] 伺服器成功啟動
- [ ] API 端點正常回應

### 生產部署
- [ ] PostgreSQL 資料庫已建立
- [ ] DATABASE_URL 環境變數已設定
- [ ] 所有依賴已安裝
- [ ] 環境變數正確設定
- [ ] 資料庫表格已初始化
- [ ] API 端點正常回應

## 🔧 環境變數設定

### 必要變數
```bash
# 資料庫連接
DATABASE_URL=postgresql://user:password@host:port/database

# 伺服器設定
PORT=3000
NODE_ENV=production
```

### 可選變數
```bash
# 日誌設定
LOG_LEVEL=info
DEBUG=false

# 安全設定
JWT_SECRET=your-secret-key
API_KEY=your-api-key
```

## 🗄️ 資料庫設定

### PostgreSQL 設定
```sql
-- 建立資料庫
CREATE DATABASE greenwin;

-- 建立使用者
CREATE USER greenwin_user WITH PASSWORD 'your_password';

-- 授權
GRANT ALL PRIVILEGES ON DATABASE greenwin TO greenwin_user;
```

### 自動表格建立
後端會自動建立以下表格：
- `customers` - 客戶資料
- `products` - 產品資料
- `orders` - 訂單資料
- `order_items` - 訂單項目

## 📊 監控與除錯

### 健康檢查
```bash
curl https://your-domain.com/api/health
```

### 日誌查看
```bash
# Vercel
vercel logs

# Railway
railway logs
```

### 常見問題

#### 1. 資料庫連接失敗
```bash
# 檢查 DATABASE_URL 格式
echo $DATABASE_URL

# 測試連接
psql $DATABASE_URL -c "SELECT 1;"
```

#### 2. 端口衝突
```bash
# 檢查端口使用
lsof -i :3000

# 更改端口
PORT=3001 npm start
```

#### 3. 依賴安裝失敗
```bash
# 清除快取
npm cache clean --force

# 重新安裝
rm -rf node_modules package-lock.json
npm install
```

## 🔄 資料遷移

### 從 JSON 到 PostgreSQL
```bash
# 1. 備份 JSON 資料
cp data.local.json data.backup.json

# 2. 設定 DATABASE_URL
export DATABASE_URL=postgresql://...

# 3. 啟動伺服器（會自動遷移）
npm start
```

### 從 PostgreSQL 到 JSON
```bash
# 1. 移除 DATABASE_URL
unset DATABASE_URL

# 2. 啟動伺服器（會使用 JSON）
npm start
```

## 🛡️ 安全建議

### 生產環境
- [ ] 使用 HTTPS
- [ ] 設定 CORS 政策
- [ ] 啟用 API 限制
- [ ] 定期備份資料庫
- [ ] 監控 API 使用量

### 環境變數安全
- [ ] 不要在程式碼中硬編碼敏感資訊
- [ ] 使用環境變數管理工具
- [ ] 定期輪換密碼和金鑰
- [ ] 限制資料庫存取權限

## 📈 效能優化

### 資料庫優化
```sql
-- 建立索引
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_product ON order_items(product_name);
```

### 應用程式優化
- [ ] 啟用 gzip 壓縮
- [ ] 設定適當的連線池大小
- [ ] 使用快取機制
- [ ] 監控記憶體使用量

## 🔍 故障排除

### 常見錯誤

#### 1. "Cannot find module"
```bash
# 解決方案
npm install
# 或
yarn install
```

#### 2. "Database connection failed"
```bash
# 檢查環境變數
echo $DATABASE_URL

# 檢查資料庫狀態
pg_isready -d $DATABASE_URL
```

#### 3. "Port already in use"
```bash
# 找到佔用端口的程序
lsof -i :3000

# 終止程序
kill -9 <PID>
```

### 聯絡支援
如果遇到無法解決的問題，請提供：
- 錯誤訊息
- 環境設定
- 日誌檔案
- 重現步驟
