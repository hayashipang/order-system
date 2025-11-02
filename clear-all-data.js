#!/usr/bin/env node

/**
 * 一勞永逸的清空所有數據腳本
 * 使用方法: node clear-all-data.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'data.local.json');

console.log('🧹 開始清空所有數據...');

try {
  // 讀取當前數據
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  
  console.log('📊 清空前數據統計:');
  console.log(`  - 訂單數量: ${data.orders?.length || 0}`);
  console.log(`  - 產品數量: ${data.products?.length || 0}`);
  console.log(`  - 客戶數量: ${data.customers?.length || 0}`);
  console.log(`  - 訂單項目數量: ${data.order_items?.length || 0}`);
  console.log(`  - 庫存交易數量: ${data.inventory_transactions?.length || 0}`);
  
  // 清空所有數據
  const clearedData = {
    orders: [],
    products: data.products || [], // 保留產品數據
    customers: data.customers || [], // 保留客戶數據
    order_items: [],
    inventory_transactions: []
  };
  
  // 寫入清空後的數據
  fs.writeFileSync(DATA_FILE, JSON.stringify(clearedData, null, 2));
  
  console.log('✅ 數據清空完成!');
  console.log('📊 清空後數據統計:');
  console.log(`  - 訂單數量: ${clearedData.orders.length}`);
  console.log(`  - 產品數量: ${clearedData.products.length}`);
  console.log(`  - 客戶數量: ${clearedData.customers.length}`);
  console.log(`  - 訂單項目數量: ${clearedData.order_items.length}`);
  console.log(`  - 庫存交易數量: ${clearedData.inventory_transactions.length}`);
  
  console.log('🎉 所有訂單和交易記錄已清空，產品和客戶數據已保留');
  
} catch (error) {
  console.error('❌ 清空數據失敗:', error.message);
  process.exit(1);
}
