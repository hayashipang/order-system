#!/usr/bin/env node
/**
 * 清理 production_plan 表中的孤立數據
 * 刪除那些沒有對應訂單的排程計劃
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'order_system.db');

// Promise 包裝
function query(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function run(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

async function cleanup() {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ 無法連接資料庫:', err.message);
      process.exit(1);
    }
  });

  try {
    console.log('✅ 已連接 SQLite 資料庫');
    console.log('🧹 開始清理 production_plan 表中的孤立數據...\n');

    // 1. 查詢所有 production_plan 記錄
    const plans = await query(db, 'SELECT DISTINCT production_date FROM production_plan');

    console.log(`📊 找到 ${plans.length} 個不同的排程日期`);

    let cleanedCount = 0;

    for (const plan of plans) {
      const date = plan.production_date;

      // 2. 檢查該日期是否還有對應的訂單
      const orders = await query(
        db,
        'SELECT COUNT(*) as count FROM orders WHERE production_date = ? AND shipping_status = ?',
        [date, 'pending']
      );

      const orderCount = orders[0].count;

      if (orderCount === 0) {
        // 3. 沒有對應訂單，刪除該日期的 production_plan
        await run(db, 'DELETE FROM production_plan WHERE production_date = ?', [date]);

        console.log(`  ✅ 已清理 ${date} 的排程計劃（無對應訂單）`);
        cleanedCount++;
      } else {
        console.log(`  ✓ ${date} 有 ${orderCount} 個訂單，保留`);
      }
    }

    console.log(`\n✨ 清理完成！共清理了 ${cleanedCount} 個日期的排程計劃`);

    // 4. 顯示清理後的狀態
    const remainingPlans = await query(db, 'SELECT DISTINCT production_date FROM production_plan');

    console.log(`📊 剩餘 ${remainingPlans.length} 個有對應訂單的排程日期`);

    db.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ 清理失敗:', error);
    db.close();
    process.exit(1);
  }
}

cleanup();

