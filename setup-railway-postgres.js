#!/usr/bin/env node

/**
 * Railway PostgreSQL 設定指南
 * 免費的雲端 PostgreSQL 資料庫
 */

console.log('🚀 Railway PostgreSQL 設定指南');
console.log('');
console.log('📋 步驟 1: 創建 Railway 帳號');
console.log('1. 前往 https://railway.app');
console.log('2. 點擊 "Login" 使用 GitHub 登入');
console.log('3. 完成帳號設定');
console.log('');
console.log('📋 步驟 2: 創建 PostgreSQL 資料庫');
console.log('1. 點擊 "New Project"');
console.log('2. 選擇 "Provision PostgreSQL"');
console.log('3. 等待資料庫創建完成');
console.log('');
console.log('📋 步驟 3: 獲取連接字串');
console.log('1. 點擊 PostgreSQL 服務');
console.log('2. 切換到 "Variables" 頁籤');
console.log('3. 複製 "DATABASE_URL" 的值');
console.log('');
console.log('💡 連接字串格式：');
console.log('postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway');
console.log('');
console.log('📋 步驟 4: 設定環境變數');
console.log('1. 在專案根目錄創建 .env.production 文件');
console.log('2. 添加以下內容：');
console.log('   DATABASE_URL=你的連接字串');
console.log('   NODE_ENV=production');
console.log('');
console.log('📋 步驟 5: 部署到 Railway');
console.log('1. 在 Railway 專案中點擊 "Deploy from GitHub repo"');
console.log('2. 選擇你的 GitHub 專案');
console.log('3. Railway 會自動部署');
console.log('');
console.log('🎯 免費方案限制：');
console.log('- 資料庫大小: 1GB');
console.log('- 每月請求: 500,000 次');
console.log('- 足夠小型專案使用');
console.log('');
console.log('✅ 完成後，你的系統就會使用雲端 PostgreSQL！');





















