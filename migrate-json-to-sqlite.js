#!/usr/bin/env node

/**
 * 將 data.local.json 中的產品數據遷移到 SQLite 數據庫
 */

import fs from 'fs';
import sqlite3 from 'sqlite3';

const DB_PATH = './order_system.db';
const DATA_FILE = './data.local.json';

// 打開 SQLite 數據庫
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ 無法連接到 SQLite 數據庫:', err.message);
    process.exit(1);
  }
  console.log('✅ SQLite 數據庫連接成功');
});

// 讀取 JSON 數據
function readJsonData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      console.error(`❌ 找不到數據文件: ${DATA_FILE}`);
      return null;
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ 讀取 JSON 數據失敗:', error.message);
    return null;
  }
}

// 確保 products 表存在
function ensureProductsTable() {
  return new Promise((resolve, reject) => {
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        price REAL NOT NULL DEFAULT 0,
        current_stock INTEGER DEFAULT 0,
        min_stock INTEGER DEFAULT 0,
        max_stock INTEGER DEFAULT 1000,
        category TEXT,
        description TEXT,
        unit TEXT DEFAULT '個',
        note TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `, (err) => {
      if (err) {
        console.error('❌ 創建 products 表失敗:', err.message);
        reject(err);
      } else {
        console.log('✅ products 表已準備就緒');
        resolve();
      }
    });
  });
}

// 遷移產品數據
async function migrateProducts() {
  const jsonData = readJsonData();
  if (!jsonData || !jsonData.products) {
    console.log('⚠️  沒有找到產品數據');
    return;
  }

  const products = jsonData.products;
  console.log(`📦 找到 ${products.length} 個產品，開始遷移...`);

  // 先確保表存在
  await ensureProductsTable();

  // 檢查現有產品數量
  const existingCount = await new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row.count);
      }
    });
  });

  if (existingCount > 0) {
    console.log(`⚠️  數據庫中已有 ${existingCount} 個產品`);
    console.log('   將更新現有產品並添加新產品...');
  }

  let successCount = 0;
  let errorCount = 0;

  for (const product of products) {
    try {
      // 檢查產品是否存在
      const exists = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM products WHERE id = ? OR name = ?', [product.id, product.name], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(!!row);
          }
        });
      });

      const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;

      if (exists) {
        // 更新現有產品
        await new Promise((resolve, reject) => {
          db.run(`
            UPDATE products 
            SET name = ?, 
                price = ?, 
                description = ?, 
                current_stock = ?,
                min_stock = ?,
                updated_at = datetime('now')
            WHERE id = ? OR name = ?
          `, [
            product.name,
            price || 0,
            product.description || '',
            product.current_stock || 0,
            product.min_stock || 10,
            product.id,
            product.name
          ], (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        console.log(`  ✅ 更新產品: ${product.name}`);
      } else {
        // 插入新產品
        await new Promise((resolve, reject) => {
          db.run(`
            INSERT INTO products (id, name, price, description, current_stock, min_stock, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            product.id,
            product.name,
            price || 0,
            product.description || '',
            product.current_stock || 0,
            product.min_stock || 10,
            product.created_at || new Date().toISOString(),
            product.updated_at || new Date().toISOString()
          ], (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
        console.log(`  ✅ 添加產品: ${product.name}`);
      }
      successCount++;
    } catch (error) {
      console.error(`  ❌ 處理產品 "${product.name}" 失敗:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 遷移結果:');
  console.log(`   ✅ 成功: ${successCount} 個產品`);
  if (errorCount > 0) {
    console.log(`   ❌ 失敗: ${errorCount} 個產品`);
  }
}

// 驗證遷移結果
function verifyMigration() {
  return new Promise((resolve) => {
    db.get('SELECT COUNT(*) as count FROM products', (err, row) => {
      if (err) {
        console.error('❌ 驗證失敗:', err.message);
        resolve(false);
      } else {
        console.log(`\n✅ 數據庫中現有 ${row.count} 個產品`);
        if (row.count > 0) {
          console.log('\n產品列表:');
          db.all('SELECT id, name, price FROM products ORDER BY id', (err, rows) => {
            if (err) {
              console.error('❌ 查詢產品列表失敗:', err.message);
            } else {
              rows.forEach(product => {
                console.log(`   - ${product.name} (ID: ${product.id}, 價格: $${product.price})`);
              });
            }
            resolve(true);
          });
        } else {
          resolve(false);
        }
      }
    });
  });
}

// 主函數
async function main() {
  console.log('🚀 開始遷移產品數據從 JSON 到 SQLite...\n');
  
  try {
    await migrateProducts();
    await verifyMigration();
    console.log('\n✅ 遷移完成！');
  } catch (error) {
    console.error('\n❌ 遷移過程中發生錯誤:', error);
    process.exit(1);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ 關閉數據庫失敗:', err.message);
      } else {
        console.log('✅ 數據庫連接已關閉');
      }
      process.exit(0);
    });
  }
}

// 執行遷移
main();

