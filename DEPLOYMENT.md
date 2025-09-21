# 🚀 部署指南

本指南將協助您將訂單管理系統部署到生產環境。

## 📋 部署架構

```
Frontend (React)     → GitHub Pages
Backend (Node.js)    → Vercel
Database (SQLite)    → Supabase PostgreSQL
```

## 🛠️ 部署步驟

### 1. 準備 GitHub Repository

1. **建立新的 GitHub Repository**
   ```bash
   # 在 GitHub 上建立新 repository
   # 名稱建議：order-system
   ```

2. **上傳程式碼**
   ```bash
   # 初始化 git
   git init
   git add .
   git commit -m "Initial commit"
   
   # 連接到 GitHub
   git remote add origin https://github.com/yourusername/order-system.git
   git push -u origin main
   ```

### 2. 前端部署 (GitHub Pages)

1. **啟用 GitHub Pages**
   - 進入 repository 的 Settings
   - 找到 Pages 選項
   - Source 選擇 "Deploy from a branch"
   - Branch 選擇 "main"
   - Folder 選擇 "/ (root)"

2. **設定前端建構**
   - GitHub Pages 會自動部署 `client/build` 資料夾
   - 確保 `client/package.json` 中有正確的 build 腳本

3. **自訂網域 (可選)**
   - 在 Pages 設定中添加自訂網域
   - 設定 DNS 記錄指向 GitHub Pages

### 3. 後端部署 (Vercel)

1. **註冊 Vercel 帳號**
   - 前往 [vercel.com](https://vercel.com)
   - 使用 GitHub 帳號登入

2. **連接 Repository**
   - 點擊 "New Project"
   - 選擇您的 order-system repository
   - 選擇 "Import"

3. **設定專案**
   - **Framework Preset**: Other
   - **Root Directory**: 保持空白 (根目錄)
   - **Build Command**: 留空
   - **Output Directory**: 留空
   - **Install Command**: `npm install`

4. **設定環境變數**
   ```bash
   # 在 Vercel 專案設定中添加環境變數
   NODE_ENV=production
   PORT=3000
   ```

5. **部署**
   - 點擊 "Deploy"
   - 等待部署完成
   - 記住部署的 URL (例如: https://order-system-xxx.vercel.app)

### 4. 資料庫部署 (Supabase)

1. **建立 Supabase 專案**
   - 前往 [supabase.com](https://supabase.com)
   - 建立新專案
   - 記住專案的 URL 和 API Key

2. **設定資料庫結構**
   ```sql
   -- 在 Supabase SQL Editor 中執行以下 SQL
   
   -- 建立 customers 表
   CREATE TABLE customers (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     phone TEXT,
     address TEXT,
     source TEXT DEFAULT '一般客戶',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   
   -- 建立 products 表
   CREATE TABLE products (
     id SERIAL PRIMARY KEY,
     name TEXT NOT NULL,
     price DECIMAL(10,2) NOT NULL,
     description TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   
   -- 建立 orders 表
   CREATE TABLE orders (
     id SERIAL PRIMARY KEY,
     customer_id INTEGER REFERENCES customers(id),
     order_date DATE NOT NULL,
     delivery_date DATE NOT NULL,
     status TEXT DEFAULT 'pending',
     notes TEXT,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );
   
   -- 建立 order_items 表
   CREATE TABLE order_items (
     id SERIAL PRIMARY KEY,
     order_id INTEGER REFERENCES orders(id),
     product_name TEXT NOT NULL,
     quantity INTEGER NOT NULL,
     unit_price DECIMAL(10,2) NOT NULL,
     special_notes TEXT,
     status TEXT DEFAULT 'pending'
   );
   
   -- 建立 users 表
   CREATE TABLE users (
     id SERIAL PRIMARY KEY,
     username TEXT UNIQUE NOT NULL,
     password TEXT NOT NULL,
     role TEXT NOT NULL
   );
   
   -- 插入預設使用者
   INSERT INTO users (username, password, role) VALUES 
   ('admin', 'admin123', 'admin'),
   ('kitchen', 'kitchen123', 'kitchen');
   
   -- 插入預設產品
   INSERT INTO products (name, price, description) VALUES 
   ('蔬果73-元氣綠', 120, '綠色蔬果系列，富含維生素'),
   ('蔬果73-活力紅', 120, '紅色蔬果系列，抗氧化'),
   ('蔬果73-亮妍莓', 130, '莓果系列，美容養顏'),
   ('蔬菜73-幸運果', 120, '黃橘色蔬果系列，提升免疫力'),
   ('蔬菜100-順暢綠', 150, '100% 綠色蔬菜，促進消化'),
   ('蔬菜100-養生黑', 160, '100% 黑色養生，滋補強身'),
   ('蔬菜100-養眼晶(有機枸杞)', 180, '100% 有機枸杞，護眼明目'),
   ('蔬菜100-法國黑巧70', 200, '100% 法國黑巧克力，濃郁香醇');
   ```

3. **更新後端連線設定**
   - 在 Vercel 環境變數中添加：
   ```bash
   DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
   ```

### 5. 更新前端 API 連線

1. **修改前端 API 基礎 URL**
   ```javascript
   // 在 client/src 中建立 config.js
   const config = {
     apiUrl: process.env.NODE_ENV === 'production' 
       ? 'https://your-vercel-app.vercel.app' 
       : 'http://localhost:3000'
   };
   export default config;
   ```

2. **更新所有 API 調用**
   ```javascript
   // 使用 config.apiUrl 替代硬編碼的 URL
   import config from './config';
   axios.get(`${config.apiUrl}/api/products`)
   ```

### 6. 最終設定

1. **測試部署**
   - 訪問 GitHub Pages URL
   - 測試登入功能
   - 測試所有主要功能

2. **設定自訂網域 (可選)**
   - 在 Vercel 中設定自訂網域
   - 在 GitHub Pages 中設定自訂網域
   - 更新 DNS 記錄

## 🔧 環境變數設定

### Vercel 環境變數
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
```

### 前端環境變數
```bash
REACT_APP_API_URL=https://your-vercel-app.vercel.app
```

## 📊 監控和維護

### 1. 監控服務狀態
- **Vercel**: 在 Vercel Dashboard 監控 API 狀態
- **Supabase**: 在 Supabase Dashboard 監控資料庫狀態
- **GitHub Pages**: 在 GitHub 監控部署狀態

### 2. 備份策略
- **程式碼**: GitHub 自動備份
- **資料庫**: Supabase 自動備份
- **手動備份**: 定期匯出資料庫

### 3. 更新部署
```bash
# 更新程式碼後
git add .
git commit -m "Update features"
git push origin main

# Vercel 和 GitHub Pages 會自動重新部署
```

## 🚨 故障排除

### 常見問題

1. **API 連線失敗**
   - 檢查 Vercel 部署狀態
   - 確認環境變數設定
   - 檢查 CORS 設定

2. **資料庫連線失敗**
   - 檢查 Supabase 專案狀態
   - 確認 DATABASE_URL 格式
   - 檢查資料庫權限

3. **前端載入失敗**
   - 檢查 GitHub Pages 部署狀態
   - 確認 API URL 設定
   - 檢查瀏覽器控制台錯誤

### 聯絡支援
- **Vercel**: [vercel.com/support](https://vercel.com/support)
- **Supabase**: [supabase.com/support](https://supabase.com/support)
- **GitHub**: [github.com/support](https://github.com/support)

## 💰 成本預估

### 免費方案
- **GitHub Pages**: 免費
- **Vercel**: 免費 (100GB 頻寬/月)
- **Supabase**: 免費 (500MB 資料庫)
- **總計**: $0/月

### 付費方案 (如需要)
- **Vercel Pro**: $20/月
- **Supabase Pro**: $25/月
- **總計**: $45/月

---

**部署完成後，您就可以在任何地方訪問您的訂單管理系統了！** 🎉
