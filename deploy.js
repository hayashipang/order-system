#!/usr/bin/env node

/**
 * 一鍵部署腳本
 * 自動部署到 Vercel (前端) 和 Railway (後端)
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 開始一鍵部署...');
console.log('');

// 檢查必要的工具
function checkTools() {
  console.log('🔍 檢查部署工具...');
  
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    console.log('✅ Vercel CLI 已安裝');
  } catch (error) {
    console.log('❌ Vercel CLI 未安裝');
    console.log('請執行: npm install -g vercel');
    process.exit(1);
  }
  
  try {
    execSync('railway --version', { stdio: 'pipe' });
    console.log('✅ Railway CLI 已安裝');
  } catch (error) {
    console.log('❌ Railway CLI 未安裝');
    console.log('請執行: npm install -g @railway/cli');
    process.exit(1);
  }
}

// 建構前端
function buildFrontend() {
  console.log('');
  console.log('🏗️ 建構前端...');
  
  try {
    execSync('cd client && npm run build', { stdio: 'inherit' });
    console.log('✅ 前端建構完成');
  } catch (error) {
    console.error('❌ 前端建構失敗:', error.message);
    process.exit(1);
  }
}

// 部署到 Vercel
function deployToVercel() {
  console.log('');
  console.log('🌐 部署到 Vercel...');
  
  try {
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('✅ Vercel 部署完成');
  } catch (error) {
    console.error('❌ Vercel 部署失敗:', error.message);
    console.log('請手動執行: vercel --prod');
  }
}

// 部署到 Railway
function deployToRailway() {
  console.log('');
  console.log('🚂 部署到 Railway...');
  
  try {
    execSync('railway up', { stdio: 'inherit' });
    console.log('✅ Railway 部署完成');
  } catch (error) {
    console.error('❌ Railway 部署失敗:', error.message);
    console.log('請手動執行: railway up');
  }
}

// 主函數
async function main() {
  console.log('🎯 一鍵部署腳本');
  console.log('這個腳本會自動：');
  console.log('1. 檢查部署工具');
  console.log('2. 建構前端');
  console.log('3. 部署到 Vercel (前端)');
  console.log('4. 部署到 Railway (後端)');
  console.log('');
  
  // 檢查工具
  checkTools();
  
  // 建構前端
  buildFrontend();
  
  // 部署到 Vercel
  deployToVercel();
  
  // 部署到 Railway
  deployToRailway();
  
  console.log('');
  console.log('🎉 部署完成！');
  console.log('');
  console.log('📋 後續步驟：');
  console.log('1. 在 Railway 專案中設定 DATABASE_URL 環境變數');
  console.log('2. 在 Vercel 專案中設定 REACT_APP_API_URL 環境變數');
  console.log('3. 重新部署以應用環境變數');
  console.log('');
  console.log('🔗 有用的連結：');
  console.log('- Railway: https://railway.app');
  console.log('- Vercel: https://vercel.com');
}

main().catch(console.error);





















