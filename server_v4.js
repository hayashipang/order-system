/*
 shipping_status 使用規則：
   pending   = 未出貨（預設狀態）
   packed    = 已包裝
   shipped   = 已寄出
   delivered = 已送達
   cancelled = 已取消（不算未完成訂單）
*/

import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';
import pkg from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中間件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS 設定
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 資料庫設定 - 支援雙模式
const DATABASE_URL = process.env.DATABASE_URL;
const DB_PATH = './order_system.db';

let usePostgres = false;
let pool = null;
let sqliteDb = null;

// 檢查是否使用 PostgreSQL
if (DATABASE_URL) {
  const { Pool } = pkg;
  // 根據環境決定 SSL 設定
  const sslConfig = process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false }
    : false;
    
  pool = new Pool({ 
    connectionString: DATABASE_URL, 
    ssl: sslConfig
  });
  usePostgres = true;
  console.log('✅ Using PostgreSQL (Cloud)');
} else {
  console.log('🗄️ Using SQLite (Local)');
}

// ✅ F. 全域新增：isUnfinishedOrder(order)
function isUnfinishedOrder(order) {
  return order.shipping_status === 'pending';
}

// 初始化資料庫
async function initDatabase() {
  if (usePostgres) {
    try {
      // 測試 PostgreSQL 連接
      await pool.query('SELECT 1');
      console.log('✅ PostgreSQL 資料庫連接成功');
      return;
    } catch (error) {
      console.error('❌ PostgreSQL 連接失敗:', error.message);
      throw error;
    }
  } else {
    // 初始化 SQLite
    return new Promise((resolve, reject) => {
      sqliteDb = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('❌ 無法創建 SQLite 資料庫:', err.message);
          reject(err);
          return;
        }
        console.log('✅ SQLite 資料庫連接成功');
        
        // ✅ G. SQLite 建表與欄位檢查
        checkAndCreateTables().then(resolve).catch(reject);
      });
    });
  }
}

// ✅ G. SQLite 建表與欄位檢查
async function checkAndCreateTables() {
  return new Promise((resolve, reject) => {
    const requiredColumns = [
      { name: 'shipping_status', sql: "TEXT DEFAULT 'pending'" },
      { name: 'production_date', sql: 'TEXT' },
      { name: 'delivery_date', sql: 'TEXT' },
      { name: 'status', sql: "TEXT DEFAULT 'pending'" },
      { name: 'linked_schedule_id', sql: 'TEXT' },
      { name: 'scheduled_at', sql: 'DATETIME' },
      { name: 'created_by', sql: "TEXT DEFAULT ''" } // ✅ 添加 created_by 欄位（用於POS系統）
    ];

    // ✅ 先檢查表是否存在，不存在則創建
    sqliteDb.all("SELECT name FROM sqlite_master WHERE type='table' AND name='orders';", (err, tables) => {
      if (err) {
        console.error('❌ 檢查表是否存在失敗:', err.message);
        reject(err);
        return;
      }

      // 如果 orders 表不存在，先創建它
      if (!tables || tables.length === 0) {
        console.log('🔧 創建 orders 表...');
        sqliteDb.run(`
          CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            customer_name TEXT,
            order_date TEXT NOT NULL,
            delivery_date TEXT,
            production_date TEXT,
            status TEXT DEFAULT 'pending',
            shipping_status TEXT DEFAULT 'pending',
            notes TEXT,
            items TEXT,
            shipping_type TEXT,
            shipping_fee REAL DEFAULT 0,
            credit_card_fee REAL DEFAULT 0,
            shopee_fee REAL DEFAULT 0,
            linked_schedule_id TEXT,
            scheduled_at TEXT,
            created_by TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
          )
        `, (err) => {
          if (err) {
            console.error('❌ 創建 orders 表失敗:', err.message);
            reject(err);
            return;
          }
          console.log('✅ orders 表創建成功');
          // 繼續檢查欄位（雖然是新表，但保留邏輯一致性）
          checkOrdersColumns();
        });
      } else {
        // 表已存在，檢查欄位
        checkOrdersColumns();
      }

      function checkOrdersColumns() {
        // 檢查 orders 表欄位
        sqliteDb.all("PRAGMA table_info(orders);", (err, columns) => {
          if (err) {
            console.error('❌ 檢查 orders 表結構失敗:', err.message);
            reject(err);
            return;
          }

          const existingColumns = columns.map(col => col.name);
          let columnsAdded = 0;

          // 檢查並新增缺失的欄位
          const addColumnPromises = requiredColumns.map(col => {
            if (!existingColumns.includes(col.name)) {
              console.log(`🔧 新增欄位 ${col.name}...`);
              return new Promise((resolveCol, rejectCol) => {
                sqliteDb.run(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.sql}`, (err) => {
                  if (err) {
                    console.error(`❌ 新增 ${col.name} 欄位失敗:`, err.message);
                    rejectCol(err);
                    return;
                  }
                  console.log(`✅ ${col.name} 欄位新增成功`);
                  columnsAdded++;
                  resolveCol();
                });
              });
            } else {
              console.log(`✅ ${col.name} 欄位已存在`);
              return Promise.resolve();
            }
          });

          Promise.all(addColumnPromises).then(() => {
            if (columnsAdded > 0) {
              console.log(`✅ 共新增 ${columnsAdded} 個欄位`);
            }

            // 檢查並創建 kitchen_production_status 表
            sqliteDb.run(`
              CREATE TABLE IF NOT EXISTS kitchen_production_status (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                production_date TEXT NOT NULL,
                product_name TEXT NOT NULL,
                completed_quantity INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'pending',
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                UNIQUE(production_date, product_name)
              )
            `, (err) => {
              if (err) {
                console.error('❌ 創建 kitchen_production_status 表失敗:', err.message);
                reject(err);
                return;
              }
              console.log('✅ kitchen_production_status 表檢查完成');

              // 創建 inventory_transactions 表
              sqliteDb.run(`
                CREATE TABLE IF NOT EXISTS inventory_transactions (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  product_id INTEGER NOT NULL,
                  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out')),
                  quantity INTEGER NOT NULL,
                  notes TEXT,
                  created_by TEXT NOT NULL DEFAULT 'system',
                  created_at TEXT NOT NULL DEFAULT (datetime('now')),
                  FOREIGN KEY (product_id) REFERENCES products (id)
                )
              `, (err) => {
                if (err) {
                  console.error('❌ 創建 inventory_transactions 表失敗:', err.message);
                  reject(err);
                  return;
                }
                console.log('✅ inventory_transactions 表檢查完成');

                // 創建 production_plan 表
                sqliteDb.run(`
                  CREATE TABLE IF NOT EXISTS production_plan (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    production_date TEXT,
                    product_name TEXT,
                    quantity INTEGER,
                    created_at TEXT DEFAULT (datetime('now'))
                  )
                `, (err) => {
                  if (err) {
                    console.error('❌ 創建 production_plan 表失敗:', err.message);
                    reject(err);
                    return;
                  }
                  console.log('✅ production_plan 表檢查完成');

                  // 創建 products 表
                  sqliteDb.run(`
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
                      return;
                    }
                    console.log('✅ products 表檢查完成');

                    // 創建 customers 表
                    sqliteDb.run(`
                      CREATE TABLE IF NOT EXISTS customers (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        phone TEXT,
                        address TEXT,
                        family_mart_address TEXT,
                        source TEXT,
                        payment_method TEXT,
                        order_number TEXT,
                        notes TEXT,
                        created_at TEXT DEFAULT (datetime('now')),
                        updated_at TEXT DEFAULT (datetime('now'))
                      )
                    `, (err) => {
                      if (err) {
                        console.error('❌ 創建 customers 表失敗:', err.message);
                        reject(err);
                        return;
                      }
                      console.log('✅ customers 表檢查完成');
                      resolve();
                    }); // ✅ 結束 customers run
                  }); // ✅ 結束 products run
                }); // ✅ 結束 production_plan run
              });   // ✅ 結束 inventory_transactions run
            });     // ✅ 結束 kitchen_production_status run
          }).catch(reject); // ✅ 結束 Promise.all.then
        }); // ✅ 結束 sqliteDb.all("PRAGMA table_info(orders);")
      } // ✅ 結束 checkOrdersColumns 函數
    }); // ✅ 結束 sqliteDb.all("SELECT name FROM sqlite_master...")
  });
}

// 統一的查詢函數
async function query(sql, params = []) {
  if (usePostgres) {
    const { rows } = await pool.query(sql, params);
    return rows;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
}

// 統一的執行函數
async function run(sql, params = []) {
  if (usePostgres) {
    await pool.query(sql, params);
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }
}

// ✅ B. /api/orders/unfinished（新增）
app.get('/api/orders/unfinished', async (req, res) => {
  try {
    const orders = await query(`
      SELECT o.*, c.name as customer_name, c.phone, c.address, c.family_mart_address, c.source, c.payment_method, c.order_number
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.shipping_status = 'pending'
      ORDER BY o.order_date DESC
    `);

    // 解析 items JSON
    const processedOrders = orders.map(order => {
      let items = [];
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      } catch (e) {
        items = [];
      }
      return { ...order, items };
    });

    res.json(processedOrders);
  } catch (error) {
    console.error('❌ 取得未完成訂單失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ C. /api/orders/history（全面重寫）
app.get('/api/orders/history', async (req, res) => {
  try {
    const { 
      shipping_status, 
      customer_id, 
      start_date, 
      end_date, 
      order_type,
      limit = 1000, 
      offset = 0 
    } = req.query;
    
    // 構建 WHERE 條件
    const whereConditions = [];
    const params = [];
    
    if (shipping_status && ['pending', 'shipped'].includes(shipping_status)) {
      whereConditions.push('o.shipping_status = ?');
      params.push(shipping_status);
    }
    
    if (customer_id) {
      whereConditions.push('o.customer_id = ?');
      params.push(customer_id);
    }
    
    if (start_date) {
      whereConditions.push('o.order_date >= ?');
      params.push(start_date);
    }
    
    if (end_date) {
      whereConditions.push('o.order_date <= ?');
      params.push(end_date);
    }
    
    // 訂單類型篩選（根據 customer.source 或 created_by）
    if (order_type) {
      if (order_type === 'online') {
        // 網路訂單：排除現場訂購和 POS 系統訂單
        // 必須同時滿足：不是現場訂購 AND 不是POS系統訂單
        whereConditions.push(`((c.source IS NULL OR c.source != '現場訂購') AND (o.created_by IS NULL OR o.created_by != 'pos-system'))`);
      } else if (order_type === 'walk-in') {
        // 現場銷售：現場訂購或 POS 系統訂單（任一條件即可）
        whereConditions.push(`(c.source = '現場訂購' OR o.created_by = 'pos-system')`);
      }
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';
    
    // 注意：limit 和 offset 需要放在最後
    // SQLite 的 LIMIT/OFFSET 語法不支援參數綁定，需要使用 parseInt
    const limitValue = parseInt(limit) || 1000;
    const offsetValue = parseInt(offset) || 0;

    const orders = await query(`
      SELECT o.*, c.name as customer_name, c.phone, c.address, c.family_mart_address, c.source, c.payment_method, c.order_number
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
      ORDER BY o.order_date DESC, o.id DESC
      LIMIT ${limitValue} OFFSET ${offsetValue}
    `, params);

    // 解析 items JSON
    const processedOrders = orders.map(order => {
      let items = [];
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      } catch (e) {
        items = [];
      }
      return { ...order, items };
    });

    res.json(processedOrders);
  } catch (error) {
    console.error('❌ 取得歷史訂單失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 批量刪除歷史訂單（根據篩選條件）
app.delete('/api/orders/history', async (req, res) => {
  try {
    const { 
      customer_id, 
      start_date, 
      end_date, 
      order_type,
      shipping_status
    } = req.query;
    
    // 構建 WHERE 條件
    const whereConditions = [];
    const params = [];
    
    if (shipping_status && ['pending', 'shipped'].includes(shipping_status)) {
      whereConditions.push('o.shipping_status = ?');
      params.push(shipping_status);
    }
    
    if (customer_id) {
      whereConditions.push('o.customer_id = ?');
      params.push(customer_id);
    }
    
    if (start_date) {
      whereConditions.push('o.order_date >= ?');
      params.push(start_date);
    }
    
    if (end_date) {
      whereConditions.push('o.order_date <= ?');
      params.push(end_date);
    }
    
    // 訂單類型篩選（根據 customer.source 或 created_by）
    if (order_type) {
      if (order_type === 'online') {
        whereConditions.push(`((c.source IS NULL OR c.source != '現場訂購') AND (o.created_by IS NULL OR o.created_by != 'pos-system'))`);
      } else if (order_type === 'walk-in') {
        whereConditions.push(`(c.source = '現場訂購' OR o.created_by = 'pos-system')`);
      }
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';
    
    // 先查詢要刪除的訂單ID
    const ordersToDelete = await query(`
      SELECT o.id, o.production_date, o.linked_schedule_id
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
    `, params);
    
    if (ordersToDelete.length === 0) {
      return res.json({ 
        success: true,
        message: '沒有找到符合條件的訂單',
        deleted_count: 0
      });
    }
    
    const orderIds = ordersToDelete.map(o => o.id);
    const deletedCount = orderIds.length;
    
    console.log(`🗑️ 準備刪除 ${deletedCount} 筆訂單:`, orderIds);
    
    // 收集所有 production_date 和 linked_schedule_id
    const productionDates = new Set();
    const linkedScheduleIds = new Set();
    
    ordersToDelete.forEach(order => {
      if (order.production_date) {
        productionDates.add(order.production_date);
      }
      if (order.linked_schedule_id) {
        linkedScheduleIds.add(order.linked_schedule_id);
      }
    });
    
    // 刪除訂單
    const placeholders = orderIds.map(() => '?').join(',');
    await run(`DELETE FROM orders WHERE id IN (${placeholders})`, orderIds);
    
    // 清理相關的排程計劃和生產狀態（對於每個 production_date）
    for (const productionDate of productionDates) {
      // 檢查該日期是否還有其他訂單
      const remainingOrders = await query(
        'SELECT COUNT(*) as count FROM orders WHERE production_date = ?',
        [productionDate]
      );
      
      if (remainingOrders[0].count === 0) {
        // 沒有其他訂單了，刪除該日期的排程計劃和生產狀態
        await run('DELETE FROM production_plan WHERE production_date = ?', [productionDate]);
        await run('DELETE FROM kitchen_production_status WHERE production_date = ?', [productionDate]);
        console.log(`🧹 已清理 ${productionDate} 的排程計劃和生產狀態`);
      }
    }
    
    // 處理 linked_schedule_id（如果有）
    for (const linkedScheduleId of linkedScheduleIds) {
      const masterSchedule = await query(
        'SELECT * FROM orders WHERE id = ? OR id = ?',
        [linkedScheduleId, `schedule_${linkedScheduleId}`]
      );
      
      if (masterSchedule.length > 0) {
        const master = masterSchedule[0];
        const mergedOrders = typeof master.merged_orders === 'string'
          ? JSON.parse(master.merged_orders || '[]')
          : (master.merged_orders || []);
        
        const updatedMergedOrders = mergedOrders.filter(oid => !orderIds.includes(String(oid)));
        
        if (updatedMergedOrders.length === 0) {
          await run('DELETE FROM orders WHERE id = ? OR id = ?', [linkedScheduleId, `schedule_${linkedScheduleId}`]);
          console.log(`🧹 已刪除空的主排程單 ${linkedScheduleId}`);
        } else {
          await run(
            'UPDATE orders SET merged_orders = ?, updated_at = datetime("now") WHERE id = ? OR id = ?',
            [JSON.stringify(updatedMergedOrders), linkedScheduleId, `schedule_${linkedScheduleId}`]
          );
        }
      }
    }
    
    console.log(`✅ 成功刪除 ${deletedCount} 筆訂單`);
    
    res.json({
      success: true,
      message: `成功刪除 ${deletedCount} 筆訂單`,
      deleted_count: deletedCount
    });
  } catch (error) {
    console.error('❌ 批量刪除歷史訂單失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 獲取單個訂單詳細信息
app.get('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const orders = await query(`
      SELECT o.*, c.name as customer_name, c.phone, c.address, c.family_mart_address, c.source, c.payment_method, c.order_number
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = ?
    `, [id]);

    if (orders.length === 0) {
      return res.status(404).json({ error: '訂單不存在' });
    }

    const order = orders[0];
    
    // 解析 items 如果它是字符串
    if (typeof order.items === 'string') {
      try {
        order.items = JSON.parse(order.items);
      } catch (e) {
        console.error('解析訂單項目失敗:', e);
        order.items = [];
      }
    }

    res.json(order);
  } catch (error) {
    console.error('❌ 取得訂單詳細信息失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3) 排程確認（建立生產計畫，不修改訂單）
app.post('/api/scheduling/confirm', async (req, res) => {
  try {
    // ✅ 支援兩種參數格式：production_date 或 manufacturingDate
    const { orderIds, production_date, manufacturingDate, deliveryDate, delivery_date, manufacturingQuantities } = req.body;
    
    // 統一參數名稱
    const prodDate = production_date || manufacturingDate;
    const delDate = delivery_date || deliveryDate;
    
    console.log('📋 [排程確認] 收到請求（建立生產計畫）:', {
      orderIds: orderIds ? orderIds.length + ' 筆訂單（僅作參考）' : '無',
      prodDate,
      delDate,
      manufacturingQuantities: manufacturingQuantities ? Object.keys(manufacturingQuantities).length + ' 個產品' : '無'
    });
    
    if (!prodDate) {
      return res.status(400).json({ error: '請提供製造日期' });
    }
    
    if (!manufacturingQuantities || typeof manufacturingQuantities !== "object") {
      return res.status(400).json({ error: '請提供製造數量' });
    }

    // ✅ 核心邏輯：排程 = 建立生產計畫，不修改任何訂單
    // 先清掉同一天的舊生產計畫
    await run(`DELETE FROM production_plan WHERE production_date = ?`, [prodDate]);
    // 也清掉同一天既有的廚房完成統計，避免沿用舊的「已完成」數量
    await run(`DELETE FROM kitchen_production_status WHERE production_date = ?`, [prodDate]);
    console.log(`🧹 [排程確認] 已清除 ${prodDate} 的舊生產計畫`);

    // ✅ 將製造數量寫入 production_plan（以產品為中心）
    let insertedCount = 0;
    const entries = Object.entries(manufacturingQuantities);
    for (const [product_name, quantity] of entries) {
      const qty = Number(quantity) || 0;
      if (qty > 0) {
        await run(`
          INSERT INTO production_plan (production_date, product_name, quantity)
          VALUES (?, ?, ?)
        `, [prodDate, product_name, qty]);
        insertedCount++;
        console.log(`  ✅ 寫入生產計畫: ${product_name} = ${qty}`);
      }
    }
    console.log(`📝 [排程確認] 已建立 ${insertedCount} 個產品的生產計畫`);

    // 驗證寫入是否成功
    const verify = await query('SELECT COUNT(*) as count FROM production_plan WHERE production_date = ?', [prodDate]);
    console.log(`🔍 [排程確認] 驗證 ${prodDate} 的生產計畫記錄數: ${verify[0]?.count || 0}`);

    res.json({
      success: true,
      production_date: prodDate,
      inserted_products: insertedCount,
      message: `已建立 ${insertedCount} 個產品的生產計畫`
    });

  } catch (e) {
    console.error('❌ 排程確認失敗:', e);
    res.status(500).json({ error: e.message });
  }
});

// ✅ E. Kitchen API（/api/kitchen/production/:date）重新定義
app.get('/api/kitchen/production/:date', async (req, res) => {
  try {
    const { date } = req.params;
    console.log(`🍳 [Kitchen] 查詢日期: ${date}`);
    
    // 1) 優先從 production_plan 表讀取排程後的數量
    const productionPlan = await query(
      'SELECT product_name, quantity FROM production_plan WHERE production_date = ?',
      [date]
    );
    console.log(`🍳 [Kitchen] ${date} 從 production_plan 讀取到 ${productionPlan.length} 筆記錄`);
    
    // 將排程計劃轉換為 Map
    const planMap = new Map();
    productionPlan.forEach(plan => {
      planMap.set(plan.product_name, Number(plan.quantity) || 0);
    });
    
    // 2) 如果有排程計劃，直接使用排程數量；否則從訂單中計算
    let scheduledMap = {}; // product_name -> total_quantity
    
    if (planMap.size > 0) {
      // ✅ 使用排程後的數量
      planMap.forEach((qty, name) => {
        if (name && qty > 0) {
          scheduledMap[name] = qty;
        }
      });
      console.log(`🍳 [Kitchen] ${date} 使用排程計劃數量:`, Object.keys(scheduledMap).length, '個產品');
    } else {
      // 3) 沒有排程計劃時，從訂單中計算（使用原始訂單數量作為後備）
      const orders = await query('SELECT * FROM orders WHERE production_date = ? AND shipping_status = ?', [date, 'pending']);

      // 正規化 items
      const parsed = orders.map(o => {
        let items = [];
        try {
          items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
        } catch { items = []; }
        return { ...o, items };
      });

      // 彙總「該生產日」所有產品的「應製作總數量」
      for (const o of parsed) {
        for (const it of o.items || []) {
          const name = it.product_name;
          const qty = Number(it.quantity) || 0;
          if (!name || qty <= 0) continue;
          scheduledMap[name] = (scheduledMap[name] || 0) + qty;
        }
      }
      console.log(`🍳 [Kitchen] ${date} 使用原始訂單數量:`, Object.keys(scheduledMap).length, '個產品');
    }

    // 4) 讀取 kitchen_production_status（該日各品項已完成數量）
    const kps = await query(
      'SELECT product_name, completed_quantity FROM kitchen_production_status WHERE production_date = ?',
      [date]
    );
    const completedMap = {}; // product_name -> completed_quantity
    for (const row of kps) {
      completedMap[row.product_name] = row.completed_quantity || 0;
    }

    // 5) 組裝回傳：每個產品 { product_name, total_quantity, pending_quantity, completed_quantity, is_gift, item_id }
    const result = Object.keys(scheduledMap).map(name => {
      const total = scheduledMap[name];
      const completed = Math.min(completedMap[name] || 0, total);
      const pending = Math.max(total - completed, 0);
      return {
        product_name: name,
        total_quantity: total,
        pending_quantity: pending,
        completed_quantity: completed,
        is_gift: false, // 若之後有需要可做更細節標記
        item_id: `${name}_${date}_${Date.now()}` // 必須唯一
      };
    });

    res.json(result);
  } catch (error) {
    console.error('查詢廚房生產失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ E-2 取得現場訂單列表（用於廚房訂單製作頁面）
app.get('/api/kitchen/walkin-orders-list', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('📋 請求現場訂單列表日期:', today);
    
    // 取得當天的現場銷售訂單（來源為「現場訂購」或 created_by 為 'pos-system'）
    const walkinOrders = await query(`
      SELECT o.*, c.name as customer_name, c.source
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.order_date = ? 
        AND (c.source = '現場訂購' OR o.created_by = 'pos-system')
      ORDER BY o.created_at DESC
    `, [today]);
    
    console.log(`✅ 找到 ${walkinOrders.length} 筆現場訂單`);
    
    // 為每個訂單解析 items 並格式化
    const result = walkinOrders.map(order => {
      let items = [];
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      } catch (e) {
        items = [];
      }
      
      return {
        id: order.id,
        order_time: order.created_at,
        customer_name: order.customer_name || '現場客戶',
        source: order.source || '現場訂購',
        items: items.map(item => ({
          product_name: item.product_name || item.name,
          quantity: Number(item.quantity) || 0,
          unit_price: Number(item.unit_price) || 0,
          is_gift: item.is_gift || false
        }))
      };
    });
    
    console.log('✅ 現場訂單列表結果:', result.length, '筆');
    return res.json(result);
  } catch (error) {
    console.error('❌ 取得現場訂單列表失敗:', error);
    return res.status(200).json([]); // 回傳空陣列避免前端中斷
  }
});

// ✅ E-1 Kitchen 狀態更新：/api/kitchen/production/:date/:productName/status
app.put('/api/kitchen/production/:date/:productName/status', async (req, res) => {
  try {
    const { date, productName } = req.params;
    const { status: newStatus } = req.body;
    const decodedProductName = decodeURIComponent(productName);

    console.log('📦 Kitchen 狀態更新請求:', { date, productName: decodedProductName, newStatus });

    // ✅ 優先從 production_plan 讀取排程後的數量
    const productionPlan = await query(
      'SELECT quantity FROM production_plan WHERE production_date = ? AND product_name = ?',
      [date, decodedProductName]
    );
    
    let totalQuantity = 0;
    
    if (productionPlan.length > 0 && productionPlan[0].quantity > 0) {
      // ✅ 使用排程後的數量
      totalQuantity = Number(productionPlan[0].quantity) || 0;
      console.log(`✅ 使用排程計劃數量: ${totalQuantity}`);
    } else {
      // 後備：從訂單中計算（使用原始訂單數量）
      const orders = await query('SELECT * FROM orders WHERE production_date = ? AND shipping_status = ?', [date, 'pending']);
      
      if (!orders.length) {
        console.warn(`⚠️ 找不到 ${date} 的生產訂單`);
        return res.status(400).json({ error: '找不到該生產日期的訂單' });
      }

      for (const order of orders) {
        let items = [];
        try {
          items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
        } catch (e) {
          items = [];
        }
        
        for (const item of items) {
          if (item.product_name === decodedProductName) {
            totalQuantity += Number(item.quantity) || 0;
          }
        }
      }
      console.log(`⚠️ 使用原始訂單數量: ${totalQuantity}`);
    }

    if (totalQuantity === 0) {
      return res.status(400).json({ error: '找不到指定的產品' });
    }

    if (newStatus === 'completed') {
      // 1) 更新 kitchen_production_status
    await run(`
        INSERT OR REPLACE INTO kitchen_production_status 
        (production_date, product_name, completed_quantity, status, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `, [date, decodedProductName, totalQuantity, 'completed']);

      // 2) completed_quantity = total_quantity, pending_quantity = 0
      // 3) 庫存自動增加 total_quantity
      const products = await query('SELECT * FROM products WHERE name = ?', [decodedProductName]);
      if (products.length > 0) {
        const product = products[0];
        const newStock = (product.current_stock || 0) + totalQuantity;
        await run('UPDATE products SET current_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStock, product.id]);
        console.log(`✅ 庫存更新: ${decodedProductName} ${product.current_stock} → ${newStock} (+${totalQuantity})`);
      }

      console.log(`✅ Kitchen 狀態更新成功: ${decodedProductName} -> completed`);
    } else if (newStatus === 'pending') {
      // 1) kitchen_production_status.completed_quantity = 0
      await run(`
        INSERT OR REPLACE INTO kitchen_production_status 
        (production_date, product_name, completed_quantity, status, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `, [date, decodedProductName, 0, 'pending']);

      // 2) pending_quantity = total_quantity
      // 3) 庫存不變
      console.log(`✅ Kitchen 狀態更新成功: ${decodedProductName} -> pending`);
    }

    // 回傳更新後的 production item
    res.json({ 
      success: true, 
      message: '生產狀態更新成功',
      updated_item: {
        product_name: decodedProductName,
        status: newStatus,
        scheduled_quantity: totalQuantity,
        completed_quantity: newStatus === 'completed' ? totalQuantity : 0,
        pending_quantity: newStatus === 'completed' ? 0 : totalQuantity
      }
    });
  } catch (error) {
    console.error('❌ Kitchen 狀態更新失敗:', error);
    res.status(500).json({ error: '更新生產狀態失敗' });
  }
});

// 其他現有 API 保持不變
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: usePostgres ? 'PostgreSQL (Cloud)' : 'SQLite (Local)',
    database: usePostgres ? 'PostgreSQL' : DB_PATH
  });
});

// 產品相關 API
app.get('/api/products', async (req, res) => {
  try {
    const products = await query('SELECT * FROM products ORDER BY name');
    res.json(products);
  } catch (error) {
    console.error('❌ 取得產品列表失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 新增產品 API
app.post('/api/products', async (req, res) => {
  try {
    const { name, price, description } = req.body || {};
    
    if (!name || String(name).trim() === '') {
      return res.status(400).json({ error: '請提供產品名稱' });
    }
    
    if (price === undefined || price === null) {
      return res.status(400).json({ error: '請提供產品價格' });
    }

    // 插入新產品
    await run(`
      INSERT INTO products (name, price, description, current_stock, min_stock, created_at, updated_at)
      VALUES (?, ?, ?, 0, 10, datetime('now'), datetime('now'))
    `, [
      String(name).trim(),
      Number(price) || 0,
      description || ''
    ]);

    // 取回剛新增的產品
    const rows = await query(`
      SELECT * FROM products WHERE name = ? ORDER BY id DESC LIMIT 1
    `, [String(name).trim()]);

    const newProduct = rows && rows[0];
    console.log(`✅ 新增產品: ${name} (ID: ${newProduct?.id})`);
    // ✅ 直接返回產品對象（與 GET /api/products 格式一致，方便下載/上傳功能）
    if (newProduct) {
      res.json(newProduct);
    } else {
      res.status(500).json({ error: '新增產品失敗：無法獲取新增的資料' });
    }
  } catch (error) {
    console.error('❌ 新增產品失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 一鍵歸零：將所有產品庫存設置為0（必須放在 /api/products/:id 之前）
app.put('/api/products/reset-stock', async (req, res) => {
  try {
    // 將所有產品的 current_stock 設置為 0
    const result = await run(
      'UPDATE products SET current_stock = 0, updated_at = datetime("now")'
    );
    
    const affectedRows = result?.changes || 0;
    console.log(`✅ 庫存歸零成功: ${affectedRows} 個產品`);
    
    // 取得所有產品以確認
    const products = await query('SELECT id, name, current_stock FROM products');
    
    res.json({
      success: true,
      message: `成功將 ${affectedRows} 個產品的庫存歸零`,
      affected_count: affectedRows,
      products: products
    });
  } catch (error) {
    console.error('❌ 庫存歸零失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新產品 API
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description } = req.body || {};
    
    // 檢查產品是否存在
    const existing = await query('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: '產品不存在' });
    }

    // 更新產品
    await run(`
      UPDATE products 
      SET name = ?, price = ?, description = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [
      name ? String(name).trim() : existing[0].name,
      price !== undefined ? Number(price) : existing[0].price,
      description !== undefined ? String(description) : (existing[0].description || ''),
      id
    ]);

    // 取回更新後的產品
    const updated = await query('SELECT * FROM products WHERE id = ?', [id]);
    const updatedProduct = updated && updated[0];
    console.log(`✅ 更新產品: ${id}`);
    // ✅ 直接返回產品對象（與 GET /api/products 格式一致）
    if (updatedProduct) {
      res.json(updatedProduct);
    } else {
      res.status(500).json({ error: '更新產品失敗：無法獲取更新後的資料' });
    }
  } catch (error) {
    console.error('❌ 更新產品失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 刪除產品 API
app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 檢查產品是否存在
    const existing = await query('SELECT * FROM products WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: '產品不存在' });
    }

    // 刪除產品
    await run('DELETE FROM products WHERE id = ?', [id]);
    console.log(`✅ 刪除產品: ${id}`);
    res.json({ success: true, message: '產品已刪除' });
  } catch (error) {
    console.error('❌ 刪除產品失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 同步產品優先順序 API（預留功能）
app.post('/api/products/sync-priority', async (req, res) => {
  try {
    // 目前 server_v4 使用 SQLite，暫無優先順序功能
    // 此端點用於兼容前端代碼，返回成功回應
    console.log('✅ 產品優先順序同步請求（功能預留）');
    res.json({ success: true, message: 'Product priority synced' });
  } catch (error) {
    console.error('❌ 同步產品優先順序失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 客戶相關 API
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await query('SELECT * FROM customers ORDER BY name');
    res.json(customers);
  } catch (error) {
    console.error('❌ 取得客戶列表失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 新增客戶 API
app.post('/api/customers', async (req, res) => {
  try {
    const { name, phone, address, family_mart_address, source, payment_method } = req.body || {};
    if (!name || String(name).trim() === '') {
      return res.status(400).json({ error: '請提供客戶名稱' });
    }

    // 寫入資料庫
    await run(`
      INSERT INTO customers (name, phone, address, family_mart_address, source, payment_method, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      String(name).trim(),
      phone || '',
      address || '',
      family_mart_address || '',
      source || '',
      payment_method || ''
    ]);

    // 取回剛新增的資料（用最後一筆）
    const rows = await query(`
      SELECT * FROM customers WHERE name = ? ORDER BY id DESC LIMIT 1
    `, [String(name).trim()]);

    const newCustomer = rows && rows[0];
    // ✅ 直接返回客戶對象（與 GET /api/customers 格式一致，方便下載/上傳功能）
    if (newCustomer) {
      res.json(newCustomer);
    } else {
      res.status(500).json({ error: '新增客戶失敗：無法獲取新增的資料' });
    }
  } catch (error) {
    console.error('❌ 新增客戶失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新客戶 API
app.put('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, address, family_mart_address, source, payment_method, order_number } = req.body || {};
    
    if (!name || String(name).trim() === '') {
      return res.status(400).json({ error: '請提供客戶名稱' });
    }

    // 檢查客戶是否存在
    const existing = await query('SELECT id FROM customers WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: '客戶不存在' });
    }

    // 更新資料庫
    await run(`
      UPDATE customers 
      SET name = ?, 
          phone = ?, 
          address = ?, 
          family_mart_address = ?, 
          source = ?, 
          payment_method = ?,
          order_number = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `, [
      String(name).trim(),
      phone || '',
      address || '',
      family_mart_address || '',
      source || '',
      payment_method || '',
      order_number || '',
      id
    ]);

    // 取回更新後的資料
    const rows = await query('SELECT * FROM customers WHERE id = ?', [id]);
    const updatedCustomer = rows && rows[0];
    
    // ✅ 直接返回客戶對象（與 GET /api/customers 格式一致）
    if (updatedCustomer) {
      res.json(updatedCustomer);
    } else {
      res.status(500).json({ error: '更新客戶失敗：無法獲取更新後的資料' });
    }
  } catch (error) {
    console.error('❌ 更新客戶失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 刪除客戶 API
app.delete('/api/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 檢查客戶是否存在
    const existing = await query('SELECT id, name FROM customers WHERE id = ?', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ error: '客戶不存在' });
    }

    const customerName = existing[0].name || `ID: ${id}`;

    // ✅ 刪除該客戶的所有訂單（先刪除訂單相關資料）
    // 1. 找出該客戶的所有訂單 ID
    const customerOrders = await query('SELECT id FROM orders WHERE customer_id = ?', [id]);
    const orderIds = customerOrders.map(o => o.id);

    // 2. 如果有訂單，需要先處理相關資料（例如庫存交易、排程等）
    if (orderIds.length > 0) {
      console.log(`⚠️ 將刪除客戶 ${customerName} 的 ${orderIds.length} 筆訂單`);
      // 注意：這裡可能需要根據業務邏輯決定是否保留訂單記錄
      // 目前先刪除訂單，但可以改為只標記為已刪除
    }

    // 3. 刪除該客戶的所有訂單
    await run('DELETE FROM orders WHERE customer_id = ?', [id]);

    // 4. 刪除客戶
    await run('DELETE FROM customers WHERE id = ?', [id]);

    console.log(`✅ 已刪除客戶: ${customerName} (ID: ${id})，並刪除了 ${orderIds.length} 筆相關訂單`);
    res.json({ 
      success: true, 
      message: `客戶「${customerName}」及 ${orderIds.length} 筆相關訂單已刪除`,
      deleted_orders: orderIds.length
    });
  } catch (error) {
    console.error('❌ 刪除客戶失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 新增訂單 API
app.post('/api/orders', async (req, res) => {
  try {
    const orderData = req.body;
    
    // 確保必要欄位
    const order = {
      customer_id: orderData.customer_id,
      order_date: orderData.order_date || new Date().toISOString().split('T')[0],
      delivery_date: orderData.delivery_date || '',
      production_date: orderData.production_date || '',
      status: 'pending',
      shipping_status: 'pending', // 預設未出貨
      notes: orderData.notes || '',
      items: JSON.stringify(orderData.items || []),
      shipping_type: orderData.shipping_type || 'none',
      shipping_fee: orderData.shipping_fee || 0,
      credit_card_fee: orderData.credit_card_fee || 0,
      shopee_fee: orderData.shopee_fee || 0
    };

    const result = await run(`
      INSERT INTO orders (
        customer_id, order_date, delivery_date, production_date, status, shipping_status,
        notes, items, shipping_type, shipping_fee, credit_card_fee, shopee_fee,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      order.customer_id, order.order_date, order.delivery_date, order.production_date,
      order.status, order.shipping_status, order.notes, order.items,
      order.shipping_type, order.shipping_fee, order.credit_card_fee, order.shopee_fee
    ]);

    res.json({ id: result.lastID, ...order });
  } catch (error) {
    console.error('❌ 建立訂單失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 庫存相關 API
app.get('/api/inventory/scheduling', async (req, res) => {
  try {
    const products = await query('SELECT * FROM products ORDER BY name');
    res.json(products);
  } catch (error) {
    console.error('❌ 取得庫存資料失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 週訂單 API
app.get('/api/orders/weekly/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const orders = await query(`
      SELECT * FROM orders 
      WHERE order_date BETWEEN ? AND ?
      ORDER BY order_date ASC
    `, [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]);

    // 按日期分組
    const weeklyData = {};
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      weeklyData[dateStr] = orders.filter(order => order.order_date === dateStr);
    }

    res.json(weeklyData);
  } catch (error) {
    console.error('❌ 取得週訂單失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 出貨日訂單（依 delivery_date）
app.get('/api/orders/delivery/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const rows = await query(`
      SELECT o.*, c.name as customer_name, c.phone, c.address, c.family_mart_address, c.source, c.payment_method, c.order_number
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.delivery_date = ?
      ORDER BY o.id DESC
    `, [date]);

    const orders = rows.map(o => {
      let items = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
      } catch {
        items = [];
      }
      
      // ✅ 計算訂單總金額（customer_total）
      let itemsTotal = items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const price = Number(item.unit_price) || 0;
        return sum + (qty * price);
      }, 0);
      
      // 扣除運費（如果是免運）
      const shippingAdjustment = (o.shipping_fee && o.shipping_fee < 0) ? o.shipping_fee : 0;
      
      // 扣除信用卡手續費
      const creditCardFee = Number(o.credit_card_fee) || 0;
      
      // 扣除蝦皮費用
      const shopeeFee = Number(o.shopee_fee) || 0;
      
      const customer_total = itemsTotal + shippingAdjustment - creditCardFee - shopeeFee;
      
      return { 
        ...o, 
        items,
        customer_total: customer_total,
        shipping_fee: Number(o.shipping_fee) || 0,
        credit_card_fee: creditCardFee,
        shopee_fee: shopeeFee
      };
    });

    res.json({ orders });
  } catch (error) {
    console.error('❌ 取得出貨日訂單失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 週出貨概覽（依 delivery_date）
app.get('/api/orders/shipping-weekly/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];

    const rows = await query(`
      SELECT o.*, c.name as customer_name, c.phone, c.address
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.delivery_date BETWEEN ? AND ?
      ORDER BY o.delivery_date ASC, o.id ASC
    `, [start, end]);

    // 分組並解析 items
    const weekly = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = d.toISOString().split('T')[0];
      weekly[key] = [];
    }

    rows.forEach(o => {
      let items = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
      } catch {
        items = [];
      }
      const day = o.delivery_date;
      if (weekly[day]) {
        weekly[day].push({ ...o, items });
      }
    });

    // 與前端期望對齊：計算統計數據
    const weeklyArray = Object.entries(weekly).map(([dateKey, orders]) => {
      const orderCount = orders.length;
      let itemCount = 0;
      let totalQuantity = 0;
      let totalAmount = 0;
      let pendingOrders = 0;
      let shippedOrders = 0;

      orders.forEach(order => {
        if (order.shipping_status === 'pending') {
          pendingOrders++;
        } else if (order.shipping_status === 'shipped') {
          shippedOrders++;
        }

        const items = order.items || [];
        items.forEach(item => {
          itemCount++;
          const qty = Number(item.quantity) || 0;
          const price = Number(item.unit_price) || 0;
          totalQuantity += qty;
          totalAmount += qty * price;
        });
      });

      return {
        date: dateKey,
        orders,
        order_count: orderCount,
        item_count: itemCount,
        total_quantity: totalQuantity,
        total_amount: totalAmount,
        pending_orders: pendingOrders,
        shipped_orders: shippedOrders
      };
    });
    
    res.json({ weekly_data: weeklyArray, weekly });
  } catch (error) {
    console.error('❌ 取得週出貨概覽失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 排程相關 API

// ✅ [新增] 取得所有 order_date 日期（排程左側列表）
app.get('/api/scheduling/dates', async (req, res) => {
  try {
    const rows = await query(`
      SELECT order_date AS date, COUNT(*) AS count
      FROM orders
      WHERE shipping_status = 'pending'
      GROUP BY order_date
      ORDER BY order_date DESC
    `);

    res.json({ dates: rows });
  } catch (err) {
    console.error("❌ /api/scheduling/dates 發生錯誤:", err);
    res.status(500).json({ error: err.message });
  }
});

// 2) 獲取某 order_date 的未排程訂單
app.get('/api/scheduling/dates/:date/orders', async (req, res) => {
  try {
    const { date } = req.params;

    const rows = await query(`
      SELECT o.*, c.name as customer_name, c.phone, c.address, c.family_mart_address, c.source, c.payment_method, c.order_number
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.order_date = ?
        AND (o.production_date IS NULL OR o.production_date = '')
        AND o.shipping_status = 'pending'
      ORDER BY o.id DESC
    `, [date]);

    // 解析 items
    const orders = rows.map(o => {
      let items = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
      } catch { items = []; }
      return { ...o, items };
    });

    res.json({ orders });
  } catch (error) {
    console.error('❌ 取得未排程訂單失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 取得指定日期的訂單（用於排程UI，顯示所有訂單，不論是否排程）
app.get('/api/scheduling/orders/:date', async (req, res) => {
  try {
    const { date } = req.params;

    // ✅ 核心邏輯：顯示所有訂單，不因排程狀態而過濾
    // 只過濾 shipping_status = 'pending'（已出貨的訂單不顯示）
    const rows = await query(`
      SELECT o.*, c.name as customer_name, c.phone, c.address, c.family_mart_address, c.source, c.payment_method, c.order_number
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.order_date = ?
        AND o.shipping_status = 'pending'
      ORDER BY o.id DESC
    `, [date]);

    // 解析 items
    const orders = rows.map(o => {
      let items = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
      } catch { items = []; }
      return { ...o, items };
    });

    console.log(`📋 [排程] ${date} 返回 ${orders.length} 個訂單（包含所有狀態，不論是否排程）`);
    res.json({ orders });
  } catch (error) {
    console.error('❌ 取得訂單失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 取得某 production_date 的生產計畫（產品為中心，不是訂單）
app.get('/api/scheduling/production/:date/orders', async (req, res) => {
  try {
    const { date } = req.params;

    // ✅ 返回該日期的生產計畫（從 production_plan 表）
    const planRows = await query(`
      SELECT product_name, quantity
      FROM production_plan
      WHERE production_date = ?
      ORDER BY product_name
    `, [date]);

    // 轉換為兼容格式（產品列表）
    const products = planRows.map(row => ({
      product_name: row.product_name,
      scheduled_quantity: row.quantity
    }));

    console.log(`📋 [生產計畫] ${date} 有 ${products.length} 個產品的生產計畫`);
    res.json({ orders: products, production_plan: products });
  } catch (err) {
    console.error("❌ 取得生產計畫失敗:", err);
    res.status(500).json({ error: err.message });
  }
});

// 1) 取得「未排程」訂單（依 order_date）
app.get('/api/scheduling/pending/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const rows = await query(`
      SELECT o.*, c.name AS customer_name, c.phone, c.address
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.order_date = ?
        AND (o.production_date IS NULL OR o.production_date = '')
        AND o.shipping_status = 'pending'
      ORDER BY o.order_date DESC, o.id DESC
    `, [date]);

    // 解析 items
    const normalized = rows.map(o => {
      let items = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
      } catch { items = []; }
      return { ...o, items };
    });

    res.json({ orders: normalized });
  } catch (err) {
    console.error('❌ 取得未排程訂單失敗:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2) 取得「已排程」訂單（依 production_date）
app.get('/api/scheduling/scheduled/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const rows = await query(`
      SELECT o.*, c.name AS customer_name, c.phone, c.address
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.production_date = ?
      ORDER BY o.scheduled_at ASC, o.id ASC
    `, [date]);

    // 獲取該日期的製作計劃
    const productionPlan = await query(`
      SELECT product_name, quantity
      FROM production_plan
      WHERE production_date = ?
    `, [date]);

    // 將製作計劃轉換為物件
    const planMap = {};
    productionPlan.forEach(plan => {
      planMap[plan.product_name] = plan.quantity;
    });

    const normalized = rows.map(o => {
      let items = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
      } catch { items = []; }
      
      // 添加製作計劃數量到訂單中
      return { 
        ...o, 
        items,
        production_plan: planMap
      };
    });

    res.json({ orders: normalized });
  } catch (err) {
    console.error('❌ 取得已排程訂單失敗:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4) 刪除某日期的所有排程（只刪除生產計畫，不修改訂單）
app.delete('/api/scheduling/delete/:date', async (req, res) => {
  try {
    const { date } = req.params;
    console.log(`🗑️ 刪除日期 ${date} 的生產計畫`);

    // ✅ 核心邏輯：只刪除生產計畫，不修改任何訂單
    await run('DELETE FROM production_plan WHERE production_date = ?', [date]);
    console.log(`🧹 已清除 ${date} 的生產計畫`);
    
    // ✅ 同步清理該日期的廚房完成統計，避免殘留顯示為已完成
    await run('DELETE FROM kitchen_production_status WHERE production_date = ?', [date]);
    console.log(`🧹 已清除 ${date} 的 kitchen_production_status`);

    res.json({ success: true, message: `已清除 ${date} 的生產計畫` });
  } catch (err) {
    console.error('❌ 刪除生產計畫失敗:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ 5) 刪除所有歷史排程（production_plan 和 kitchen_production_status）
app.delete('/api/scheduling/delete-all', async (req, res) => {
  try {
    // 刪除所有 production_plan 記錄
    const productionPlanResult = await run('DELETE FROM production_plan');
    const productionPlanCount = productionPlanResult?.changes || 0;
    console.log(`🧹 已清除 ${productionPlanCount} 筆 production_plan 記錄`);
    
    // 刪除所有 kitchen_production_status 記錄
    const kitchenStatusResult = await run('DELETE FROM kitchen_production_status');
    const kitchenStatusCount = kitchenStatusResult?.changes || 0;
    console.log(`🧹 已清除 ${kitchenStatusCount} 筆 kitchen_production_status 記錄`);
    
    const totalCount = productionPlanCount + kitchenStatusCount;
    console.log(`✅ 已刪除所有歷史排程，共 ${totalCount} 筆記錄`);
    
    res.json({ 
      success: true, 
      message: `已刪除所有歷史排程`,
      deleted_count: totalCount,
      details: {
        production_plan: productionPlanCount,
        kitchen_production_status: kitchenStatusCount
      }
    });
  } catch (error) {
    console.error('❌ 刪除所有歷史排程失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6) 取消「特定訂單」的排程（已廢棄：排程不綁定訂單）
// ✅ 此 API 已不需要，因為排程以產品為中心，不修改訂單狀態
// 保留此 API 僅為向後兼容，但實際上不做任何訂單修改
app.put('/api/scheduling/unassign/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    // ✅ 排程以產品為中心，訂單只作參考，不修改訂單狀態
    console.log(`⚠️ [已廢棄] 嘗試取消訂單 ${orderId} 的排程，但排程不綁定訂單，此操作無效`);
    res.json({ success: true, message: `排程以產品為中心，訂單狀態不受影響` });
  } catch (err) {
    console.error('❌ 操作失敗:', err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ 6) 撤銷「本次排程」（已廢棄：排程不綁定訂單，無法依 scheduleId 撤銷）
// ✅ 現在排程只建立生產計畫，沒有 scheduleId 綁定訂單
// 建議使用 /api/scheduling/delete/:date 來刪除特定日期的生產計畫
app.put('/api/scheduling/unassign-schedule/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    // ✅ 排程以產品為中心，不綁定訂單，無法依 scheduleId 撤銷
    console.log(`⚠️ [已廢棄] 嘗試撤銷排程 ${scheduleId}，但排程不綁定訂單，請使用 DELETE /api/scheduling/delete/:date`);
    res.status(404).json({ success: false, message: '排程以產品為中心，無法依 scheduleId 撤銷。請使用 DELETE /api/scheduling/delete/:date 刪除特定日期的生產計畫' });
  } catch (err) {
    console.error('❌ 操作失敗:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scheduling/complete', async (req, res) => {
  try {
    const { manufacturingDate } = req.body;
    
    if (!manufacturingDate) {
      return res.status(400).json({ error: '缺少 manufacturingDate' });
    }

    // 更新該日期的所有排程訂單狀態為 completed
    await run(
      'UPDATE orders SET status = ?, completed_at = datetime(\'now\') WHERE production_date = ?',
      ['completed', manufacturingDate]
    );

    res.json({ success: true, message: '排程完成' });
  } catch (error) {
    console.error('❌ 完成排程失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 注意：這個 API 是重複的，已在上方定義。保留此處僅作為後備
// 如果上方定義被刪除，這裡會作為備用

// 1. GET /api/shipping-fee - 回傳系統運費設定
app.get('/api/shipping-fee', async (req, res) => {
  try {
    // 如果沒有資料，就回傳預設值
    res.json({ 
      shippingFee: 120,  // 前端期望的字段名
      shipping_fee: 120,  // 保持兼容性
      free_shipping_threshold: 2590 
    });
  } catch (error) {
    console.error('❌ 取得運費設定失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/shipping-fee - 更新運費設定
app.put('/api/shipping-fee', async (req, res) => {
  try {
    const { shippingFee } = req.body;
    
    if (shippingFee === undefined || shippingFee === null) {
      return res.status(400).json({ error: '運費參數必填' });
    }

    // TODO: 如果需要持久化，可以存到資料庫
    // 目前先直接返回成功
    res.json({ 
      shippingFee: Number(shippingFee),
      shipping_fee: Number(shippingFee),  // 保持兼容性
      message: '運費設定更新成功'
    });
  } catch (error) {
    console.error('❌ 更新運費設定失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 庫存可用量概覽（已排程扣除已完成）
// GET /api/inventory/availability?as_of=YYYY-MM-DD
app.get('/api/inventory/availability', async (req, res) => {
  try {
    const asOf = (req.query.as_of || new Date().toISOString().split('T')[0]).trim();

    // 取出所有產品的現有庫存
    const products = await query(`SELECT id, name, COALESCE(current_stock,0) AS current_stock FROM products`);

    // 聚合「已排程但未完成」的承諾量（跨 >= asOf 的所有日）
    // SQLite 不支援在聚合函數內嵌套 MAX，改用子查詢計算未完成量
    const rows = await query(`
      SELECT 
        pp.product_name,
        SUM(
          CASE 
            WHEN (pp.quantity - COALESCE(kps.completed_quantity, 0)) > 0 
            THEN (pp.quantity - COALESCE(kps.completed_quantity, 0))
            ELSE 0
          END
        ) AS committed_outstanding
      FROM production_plan pp
      LEFT JOIN kitchen_production_status kps
        ON kps.production_date = pp.production_date
       AND kps.product_name = pp.product_name
      WHERE pp.production_date >= ?
      GROUP BY pp.product_name
    `, [asOf]);

    // 轉 map： product_name -> committed_outstanding
    const committedMap = new Map();
    for (const r of rows) {
      committedMap.set(r.product_name, Math.max(Number(r.committed_outstanding) || 0, 0));
    }

    // 組合輸出（不傳負值）
    const data = products.map(p => {
      const committed = committedMap.get(p.name) || 0;
      const available = Math.max((Number(p.current_stock) || 0) - committed, 0);
      return {
        product_name: p.name,
        current_stock: Number(p.current_stock) || 0,
        committed_outstanding: committed,
        available_for_scheduling: available,
      };
    });

    res.json({ as_of: asOf, availability: data });
  } catch (err) {
    console.error('❌ /api/inventory/availability 失敗:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /api/inventory/transactions - 回傳庫存異動記錄
app.get('/api/inventory/transactions', async (req, res) => {
  try {
    const transactions = await query(`
      SELECT 
        it.*,
        p.name as product_name,
        p.price as product_price
      FROM inventory_transactions it
      LEFT JOIN products p ON it.product_id = p.id
      ORDER BY it.created_at DESC
    `);
    res.json(transactions);
  } catch (error) {
    console.error('❌ 取得庫存交易記錄失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. GET /api/inventory/transaction - 回傳空 array（單數形式，防止前端拼錯）
app.get('/api/inventory/transaction', (req, res) => {
  res.json([]);
});

// 4. POST /api/inventory/transaction - 新增庫存異動記錄
app.post('/api/inventory/transaction', async (req, res) => {
  try {
    const { product_id, transaction_type, quantity, notes, created_by } = req.body;
    
    if (!product_id || !transaction_type || !quantity) {
      return res.status(400).json({ error: '缺少必要參數' });
    }

    // 插入庫存異動記錄
    const result = await query(`
      INSERT INTO inventory_transactions (product_id, transaction_type, quantity, notes, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `, [product_id, transaction_type, quantity, notes || '', created_by || 'system']);

    // 更新產品庫存
    const stockChange = transaction_type === 'in' ? quantity : -quantity;
    await query(`
      UPDATE products 
      SET current_stock = current_stock + ?, updated_at = datetime('now')
      WHERE id = ?
    `, [stockChange, product_id]);

    res.json({ 
      success: true, 
      message: '庫存異動記錄成功',
      transaction_id: result.lastID 
    });
  } catch (error) {
    console.error('❌ 新增庫存異動記錄失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. DELETE /api/inventory/transaction/:id - 刪除庫存異動記錄
app.delete('/api/inventory/transaction/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 先取得異動記錄詳情
    const transaction = await query('SELECT * FROM inventory_transactions WHERE id = ?', [id]);
    if (!transaction) {
      return res.status(404).json({ error: '異動記錄不存在' });
    }

    // 刪除記錄
    await query('DELETE FROM inventory_transactions WHERE id = ?', [id]);

    // 還原庫存
    const stockChange = transaction.transaction_type === 'in' ? -transaction.quantity : transaction.quantity;
    await query(`
      UPDATE products 
      SET current_stock = current_stock + ?, updated_at = datetime('now')
      WHERE id = ?
    `, [stockChange, transaction.product_id]);

    res.json({ success: true, message: '庫存異動記錄已刪除' });
  } catch (error) {
    console.error('❌ 刪除庫存異動記錄失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. DELETE /api/inventory/transactions/reset - 重置所有庫存異動記錄
app.delete('/api/inventory/transactions/reset', async (req, res) => {
  try {
    await query('DELETE FROM inventory_transactions');
    res.json({ success: true, message: '所有庫存異動記錄已重置' });
  } catch (error) {
    console.error('❌ 重置庫存異動記錄失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 1) 客戶訂單歷史（顯示所有狀態，不以出貨與否過濾）
app.get('/api/orders/customers/history', async (req, res) => {
  try {
    const {
      date,           // 可選：單日
      start_date,     // 可選：起日
      end_date,       // 可選：迄日（含）
      customer_id,    // 可選：客戶ID
      status,         // 可選：status 篩選，多值用逗號
      shipping_status // 可選：shipping_status 篩選，多值用逗號
    } = req.query;

    const where = [];
    const params = [];

    // 時間篩選（擇一）
    if (date) {
      where.push('order_date = ?');
      params.push(date);
    } else {
      if (start_date) { where.push('order_date >= ?'); params.push(start_date); }
      if (end_date)   { where.push('order_date <= ?'); params.push(end_date); }
    }

    if (customer_id) { where.push('customer_id = ?'); params.push(customer_id); }

    // 可選：狀態過濾（預設不過濾，= 顯示所有）
    if (status) {
      const list = status.split(',').map(s => s.trim()).filter(Boolean);
      if (list.length) {
        where.push(`status IN (${list.map(() => '?').join(',')})`);
        params.push(...list);
      }
    }
    if (shipping_status) {
      const list = shipping_status.split(',').map(s => s.trim()).filter(Boolean);
      if (list.length) {
        where.push(`shipping_status IN (${list.map(() => '?').join(',')})`);
        params.push(...list);
      }
    }

    const sql = `
      SELECT o.*, c.name as customer_name, c.phone, c.address, c.family_mart_address, c.source, c.payment_method, c.order_number
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY o.order_date DESC, o.id DESC
    `;
    const rows = await query(sql, params);

    // 解析 items JSON，補充統計
    const normalized = rows.map(o => {
      let items = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
      } catch (_) { items = []; }
      const total_items = items.reduce((n, it) => n + (Number(it.quantity) || 0), 0);
      const total_amount = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
      return {
        ...o,
        items,
        total_items,
        total_amount
      };
    });

    res.json({ orders: normalized, count: normalized.length });
  } catch (err) {
    console.error('查詢客戶訂單歷史失敗:', err);
    res.status(500).json({ error: '查詢客戶訂單歷史失敗: ' + err.message });
  }
});

// ✅ 2) 舊路由相容：依日期取單，但「不」用 shipping_status 過濾（= 顯示所有狀態）
app.get('/api/orders/customers/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const rows = await query(`
      SELECT o.*, c.name as customer_name, c.phone, c.address, c.family_mart_address, c.source, c.payment_method, c.order_number
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.order_date = ? 
      ORDER BY o.id DESC
    `, [date]);

    const normalized = rows.map(o => {
      let items = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
      } catch (_) { items = []; }
      const total_items = items.reduce((n, it) => n + (Number(it.quantity) || 0), 0);
      const total_amount = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
      return { ...o, items, total_items, total_amount };
    });

    res.json({ orders: normalized, count: normalized.length });
  } catch (err) {
    console.error('查詢客戶訂單(單日)失敗:', err);
    res.status(500).json({ error: '查詢客戶訂單(單日)失敗: ' + err.message });
  }
});

// ✅ 更新訂單出貨狀態 API
app.put('/api/orders/:id/shipping-status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('更新訂單出貨狀態:', { orderId: id, status });
    
    // 檢查訂單是否存在
    const orderRows = await query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orderRows.length === 0) {
      return res.status(404).json({ error: '訂單不存在' });
    }
    const order = orderRows[0];

    // 僅在狀態實際變更時執行庫存調整
    const prevStatus = order.shipping_status;
    if (prevStatus === status) {
      return res.json({ success: true, message: '狀態未變更', orderId: id, shipping_status: status });
    }

    // 解析訂單項目（更嚴謹）
    let items = [];
    try {
      if (!order.items) {
        items = [];
      } else if (Array.isArray(order.items)) {
        items = order.items;
      } else if (typeof order.items === 'string') {
        const s = order.items.trim();
        items = s && s !== '[]' ? JSON.parse(s) : [];
      } else {
        items = [];
      }
    } catch (_) { items = []; }
    console.log('[出貨] 訂單 items:', items);

    // 根據狀態變更方向決定庫存增減
    // pending -> shipped: 庫存遞減； shipped -> pending: 庫存加回
    const shouldDecrement = prevStatus !== 'shipped' && status === 'shipped';
    const shouldIncrement = prevStatus === 'shipped' && status !== 'shipped';

    // 名稱正規化
    const normalize = (str) => String(str || '')
      .trim()
      .replace(/\s+/g, '')
      .replace(/[–—]/g, '-')
      .toLowerCase();

    // 調整各商品庫存（以名稱對應）
    if (shouldDecrement || shouldIncrement) {
      for (const it of items) {
        const name = it.product_name || it.name;
        const qty = Number(it.quantity) || 0;
        if (!name || qty <= 0) continue;

        // 盡量寬鬆匹配：去空白、替換破折號、忽略大小寫
        const normName = normalize(name);
        let products = await query(
          `SELECT id, current_stock, name FROM products
           WHERE LOWER(REPLACE(REPLACE(REPLACE(TRIM(name), ' ', ''), '–', '-'), '—', '-'))
                 LIKE '%' || ? || '%'
           LIMIT 1`,
          [normName]
        );
        console.log(`[出貨] 查詢 product '${normName}'，查得:`, products);
        if (!products || products.length === 0) {
          console.warn(`[出貨] 找不到品名: ${normName}，無法調整庫存`);
          continue;
        }
        const product = products[0];
        const delta = shouldDecrement ? -qty : qty; // 出貨扣庫存；撤回加回庫存
        const newStock = (Number(product.current_stock) || 0) + delta;
        console.log(`[出貨][SQL-PRE] ${product.name} #${product.id} current_stock: ${product.current_stock} → ${newStock} (delta: ${delta})`);
        const res = await run('UPDATE products SET current_stock = ?, updated_at = datetime(\'now\') WHERE id = ?', [newStock, product.id]);
        console.log(`[出貨][UPDATE] 產品id=${product.id}，品名=${product.name}，受影響列數:`, res && res.changes);
        // 查出庫存最新值
        const after = await query('SELECT current_stock FROM products WHERE id = ?', [product.id]);
        console.log(`[出貨][SQL-AFTER] ${product.name} #${product.id} 最後庫存:`, after && after.length > 0 ? after[0].current_stock : '未查得');
      }
    }

    // ✅ 更新 shipping_status 欄位
    await run('UPDATE orders SET shipping_status = ? WHERE id = ?', [status, id]);

    console.log(`✅ 訂單 ${id} 出貨狀態已更新: ${prevStatus} -> ${status}`);
    res.json({ success: true, message: '出貨狀態更新成功', orderId: id, shipping_status: status });
  } catch (error) {
    console.error('❌ 更新出貨狀態失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 更新訂單（支援更新基礎欄位與 items JSON）
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    // 先確認訂單存在
    const rows = await query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: '訂單不存在' });
    }
    const oldOrder = rows[0];

    // 解析舊 items
    const parseItems = (val) => {
      try {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          const s = val.trim();
          return s && s !== '[]' ? JSON.parse(s) : [];
        }
        return [];
      } catch { return []; }
    };
    const oldItems = parseItems(oldOrder.items);

    // 正規化 items → JSON 字串
    let itemsJson = null;
    let newItemsArr = null;
    if (payload.items !== undefined) {
      try {
        if (Array.isArray(payload.items)) {
          newItemsArr = payload.items;
          itemsJson = JSON.stringify(payload.items);
        } else if (typeof payload.items === 'string') {
          // 驗證可解析
          newItemsArr = JSON.parse(payload.items || '[]');
          itemsJson = payload.items;
        } else {
          newItemsArr = [];
          itemsJson = '[]';
        }
      } catch (e) {
        return res.status(400).json({ error: 'items 不是有效的 JSON' });
      }
    }

    // 動態組 UPDATE 語句
    const fields = [];
    const params = [];

    const mappings = {
      customer_id: 'customer_id',
      order_date: 'order_date',
      delivery_date: 'delivery_date',
      production_date: 'production_date',
      notes: 'notes',
      shipping_type: 'shipping_type'
    };
    for (const [k, col] of Object.entries(mappings)) {
      if (payload[k] !== undefined) {
        fields.push(`${col} = ?`);
        params.push(payload[k]);
      }
    }
    if (itemsJson !== null) {
      fields.push('items = ?');
      params.push(itemsJson);
    }

    if (fields.length === 0) {
      return res.json({ success: true, message: '無需更新' });
    }

    fields.push('updated_at = datetime(\'now\')');
    const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;
    params.push(id);

    const result = await run(sql, params);
    console.log('✅ 訂單更新結果:', { id, changes: result && result.changes });

    // 若訂單已為 shipped，按新舊 items 差額調整庫存
    if (oldOrder.shipping_status === 'shipped' && newItemsArr !== null) {
      // 建立差異：new - old
      const normalize = (str) => String(str || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[–—]/g, '-');

      const diffMap = new Map(); // name -> delta(new-old)
      for (const it of oldItems) {
        const key = normalize(it.product_name || it.name);
        const qty = Number(it.quantity) || 0;
        if (!key || !qty) continue;
        diffMap.set(key, (diffMap.get(key) || 0) - qty);
      }
      for (const it of newItemsArr) {
        const key = normalize(it.product_name || it.name);
        const qty = Number(it.quantity) || 0;
        if (!key || !qty) continue;
        diffMap.set(key, (diffMap.get(key) || 0) + qty);
      }

      // 套用差異到庫存：current_stock = current_stock - delta
      for (const [key, delta] of diffMap.entries()) {
        if (!delta) continue;
        const rowsP = await query(
          `SELECT id, current_stock, name FROM products
           WHERE LOWER(REPLACE(REPLACE(REPLACE(TRIM(name), ' ', ''), '–', '-'), '—', '-'))
                 LIKE '%' || ? || '%'
           LIMIT 1`,
          [key]
        );
        if (!rowsP || rowsP.length === 0) {
          console.warn('⚠️ 訂單更新庫存調整找不到產品:', key);
          continue;
        }
        const p = rowsP[0];
        const newStock = (Number(p.current_stock) || 0) - delta; // 減去(new-old)
        await run('UPDATE products SET current_stock = ?, updated_at = datetime(\'now\') WHERE id = ?', [newStock, p.id]);
        console.log(`📦 庫存調整(更新訂單): ${p.name} -> ${p.current_stock} → ${newStock} (delta=${-delta})`);
      }
    }

    const updated = await query('SELECT * FROM orders WHERE id = ?', [id]);
    return res.json({ success: true, order: updated && updated[0] });
  } catch (error) {
    console.error('❌ 更新訂單失敗:', error);
    return res.status(500).json({ error: error.message });
  }
});

// 刪除訂單 API - 完全刪除所有相關數據
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 檢查訂單是否存在
    const order = await query('SELECT * FROM orders WHERE id = ?', [id]);
    if (order.length === 0) {
      return res.status(404).json({ error: '訂單不存在' });
    }
    
    const deletedOrder = order[0];
    const productionDate = deletedOrder.production_date;
    const linkedScheduleId = deletedOrder.linked_schedule_id;
    
    // 🔥 使用事務確保完整刪除（SQLite 不支持事務回滾，但我們可以用 try-catch 確保）
    try {
      // 1. 刪除訂單本身
      await run('DELETE FROM orders WHERE id = ?', [id]);
      console.log(`✅ 已刪除訂單 ${id}`);
      
      // 2. 清理 production_plan 和 kitchen_production_status
      // ✅ 由於排程系統已改為產品中心，production_plan 不以訂單為中心
      // ✅ 但刪除訂單後，需要檢查該日期的 production_plan 是否還有效
      // ✅ 重要：刪除訂單後，必須檢查該日期是否還有任何訂單，如果沒有，就清理所有相關資料
      
      if (productionDate) {
        // ✅ 先刪除訂單（已在上面完成），然後檢查該日期是否還有其他訂單
        const remainingOrders = await query(
          'SELECT COUNT(*) as count FROM orders WHERE production_date = ?',
          [productionDate]
        );
        
        // ✅ 如果該日期沒有任何訂單了，清理 production_plan 和 kitchen_production_status
        // ✅ 這樣可以確保刪除所有訂單後，廚房不會顯示過期資訊
        if (remainingOrders[0].count === 0) {
          await run('DELETE FROM production_plan WHERE production_date = ?', [productionDate]);
          await run('DELETE FROM kitchen_production_status WHERE production_date = ?', [productionDate]);
          console.log(`🧹 已清理 ${productionDate} 的排程計劃和生產狀態（該日期無其他訂單）`);
        } else {
          // ✅ 該日期還有其他訂單，由於 production_plan 以產品為中心，
          // ✅ 無法精確知道哪些記錄屬於已刪除的訂單
          // ✅ 但排程計劃是人工決定的，可能包含多個訂單的產品，所以保留排程計劃
          console.log(`⚠️ 日期 ${productionDate} 仍有 ${remainingOrders[0].count} 筆其他訂單，保留排程計劃`);
          console.log(`💡 提示：如需調整排程，請前往排程頁面重新建立`);
        }
      }
      
      // 3. 如果該訂單有關聯的主排程單（linked_schedule_id），檢查主排程單是否還需要
      if (linkedScheduleId) {
        // 查找主排程單（id 為 linked_schedule_id 的訂單）
        const masterSchedule = await query(
          'SELECT * FROM orders WHERE id = ? OR id = ?',
          [linkedScheduleId, `schedule_${linkedScheduleId}`]
        );
        
        if (masterSchedule.length > 0) {
          const master = masterSchedule[0];
          // 檢查主排程單的 merged_orders（如果有的話）
          // 注意：SQLite 可能將 merged_orders 存為 JSON 字符串
          const mergedOrders = typeof master.merged_orders === 'string'
            ? JSON.parse(master.merged_orders || '[]')
            : (master.merged_orders || []);
          
          // 從 merged_orders 中移除當前訂單
          const updatedMergedOrders = mergedOrders.filter(oid => String(oid) !== String(id));
          
          if (updatedMergedOrders.length === 0) {
            // 如果主排程單沒有其他合併的訂單了，也刪除主排程單
            await run('DELETE FROM orders WHERE id = ? OR id = ?', [linkedScheduleId, `schedule_${linkedScheduleId}`]);
            console.log(`🧹 已刪除空的主排程單 ${linkedScheduleId}`);
          } else {
            // 更新主排程單的 merged_orders
            await run(
              'UPDATE orders SET merged_orders = ?, updated_at = datetime("now") WHERE id = ? OR id = ?',
              [JSON.stringify(updatedMergedOrders), linkedScheduleId, `schedule_${linkedScheduleId}`]
            );
            console.log(`🔄 已更新主排程單 ${linkedScheduleId} 的合併訂單列表`);
          }
        }
      }
      
      // 4. 檢查是否有其他訂單引用此訂單作為主排程單（很少見，但需要處理）
      // 這種情況是：當前訂單是主排程單，有子訂單引用它
      const childOrders = await query(
        'SELECT id FROM orders WHERE linked_schedule_id = ? OR linked_schedule_id = ?',
        [id, `schedule_${id}`]
      );
      
      if (childOrders.length > 0) {
        // 將子訂單的 linked_schedule_id 清空，狀態改為未排程
        await run(
          `UPDATE orders 
           SET linked_schedule_id = NULL, 
               scheduling_status = 'unscheduled',
               production_date = NULL,
               updated_at = datetime('now')
           WHERE linked_schedule_id = ? OR linked_schedule_id = ?`,
          [id, `schedule_${id}`]
        );
        console.log(`🔄 已重置 ${childOrders.length} 個子訂單的排程關聯`);
      }
      
      console.log(`✅ 訂單 ${id} 及其所有相關數據已完全刪除`);
      res.json({ 
        success: true, 
        message: '訂單已完全刪除',
        deleted: {
          order: true,
          production_plan_cleaned: !!productionDate,
          master_schedule_updated: !!linkedScheduleId,
          child_orders_reset: childOrders.length
        }
      });
    } catch (deleteError) {
      console.error('❌ 刪除過程中發生錯誤:', deleteError);
      throw deleteError;
    }
  } catch (error) {
    console.error('❌ 刪除訂單失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// CSV 匯出 API
app.get('/api/orders/history/export/csv', async (req, res) => {
  try {
    const { start_date, end_date, customer_id, order_type } = req.query;
    
    const whereConditions = [];
    const params = [];

    if (start_date) {
      whereConditions.push('o.order_date >= ?');
      params.push(start_date);
    }
    if (end_date) {
      whereConditions.push('o.order_date <= ?');
      params.push(end_date);
    }
    if (customer_id) {
      whereConditions.push('o.customer_id = ?');
      params.push(customer_id);
    }
    
    // 訂單類型篩選（與 /api/orders/history 邏輯一致）
    if (order_type) {
      if (order_type === 'online') {
        // 網路訂單：排除現場訂購和 POS 系統訂單
        // 必須同時滿足：不是現場訂購 AND 不是POS系統訂單
        whereConditions.push(`((c.source IS NULL OR c.source != '現場訂購') AND (o.created_by IS NULL OR o.created_by != 'pos-system'))`);
      } else if (order_type === 'walk-in') {
        // 現場銷售：現場訂購或 POS 系統訂單（任一條件即可）
        whereConditions.push(`(c.source = '現場訂購' OR o.created_by = 'pos-system')`);
      }
    }
    
    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';
    
    let sql = `
      SELECT o.*, c.name as customer_name, c.phone, c.address, c.source, c.payment_method
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ${whereClause}
    `;

    sql += ' ORDER BY o.order_date DESC';

    const orders = await query(sql, params);

    // 轉換為 CSV 格式
    const csvHeader = 'ID,客戶名稱,訂單日期,出貨日期,生產日期,狀態,出貨狀態,備註,項目,總金額\n';
    const csvRows = orders.map(order => {
      let items = [];
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      } catch (e) {
        items = [];
      }
      
      const itemsStr = items.map(item => `${item.product_name} x${item.quantity}`).join('; ');
      const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      
      return [
        order.id,
        order.customer_name || '',
        order.order_date || '',
        order.delivery_date || '',
        order.production_date || '',
        order.status || '',
        order.shipping_status || '',
        order.notes || '',
        itemsStr,
        totalAmount
      ].map(field => `"${field}"`).join(',');
    });

    const csvContent = csvHeader + csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('❌ CSV 匯出失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== 共享 API 端點 (供 POS 系統使用) ====================

// ✅ 取得所有產品列表（共享給 POS 系統）
app.get('/api/shared/products', async (req, res) => {
  try {
    const products = await query('SELECT * FROM products ORDER BY name');
    res.json(products);
  } catch (error) {
    console.error('❌ 取得共享產品列表失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 取得所有客戶列表（共享給 POS 系統）
app.get('/api/shared/customers', async (req, res) => {
  try {
    const customers = await query('SELECT * FROM customers ORDER BY name');
    res.json(customers);
  } catch (error) {
    console.error('❌ 取得共享客戶列表失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 創建現場銷售訂單（POS 系統專用）
app.post('/api/shared/pos-orders', async (req, res) => {
  try {
    const { items, subtotal, customer_payment, change, payment_method, created_by } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: '請提供訂單項目' });
    }

    // 查找或創建「現場客戶」（來源為「現場訂購」）
    let walkInCustomer = await query(
      `SELECT id FROM customers WHERE source = '現場訂購' AND name = '現場客戶' LIMIT 1`
    );
    
    let customerId = null;
    if (walkInCustomer && walkInCustomer.length > 0) {
      customerId = walkInCustomer[0].id;
    } else {
      // 創建「現場客戶」
      const customerResult = await run(`
        INSERT INTO customers (
          name, phone, address, source, payment_method, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [
        '現場客戶',
        '',
        '',
        '現場訂購',
        payment_method === 'credit_card' ? '信用卡付款' : (payment_method === 'linepay' ? 'LinePay' : '面交付款')
      ]);
      customerId = customerResult?.lastID || customerResult?.lastInsertRowid;
      console.log(`✅ 創建現場客戶: ID ${customerId}`);
    }

    // 準備訂單資料
    const orderData = {
      customer_id: customerId, // 關聯到現場客戶
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: new Date().toISOString().split('T')[0],
      production_date: '',
      status: 'pending',
      shipping_status: 'pending',
      notes: `現場銷售 - 付款方式: ${payment_method || 'cash'}`,
      items: JSON.stringify(items),
      shipping_type: 'none',
      shipping_fee: 0,
      credit_card_fee: 0,
      shopee_fee: 0,
      created_by: created_by || 'pos-system'
    };

    // 插入訂單
    const result = await run(`
      INSERT INTO orders (
        customer_id, order_date, delivery_date, production_date, status, shipping_status,
        notes, items, shipping_type, shipping_fee, credit_card_fee, shopee_fee, created_by,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      orderData.customer_id,
      orderData.order_date,
      orderData.delivery_date,
      orderData.production_date,
      orderData.status,
      orderData.shipping_status,
      orderData.notes,
      orderData.items,
      orderData.shipping_type,
      orderData.shipping_fee,
      orderData.credit_card_fee,
      orderData.shopee_fee,
      orderData.created_by
    ]);

    // 獲取新訂單ID（SQLite 使用 last_insert_rowid()）
    const orderId = result?.lastID || result?.lastInsertRowid;
    
    console.log(`✅ POS訂單創建成功: ID ${orderId}`);

    // 減少庫存
    for (const item of items) {
      const productName = item.product_name || item.name;
      const quantity = Number(item.quantity) || 0;
      
      if (productName && quantity > 0) {
        // 查找產品（使用寬鬆匹配）
        const products = await query(
          `SELECT id, current_stock, name FROM products
           WHERE LOWER(REPLACE(REPLACE(REPLACE(TRIM(name), ' ', ''), '–', '-'), '—', '-'))
                 LIKE '%' || LOWER(REPLACE(REPLACE(REPLACE(TRIM(?), ' ', ''), '–', '-'), '—', '-')) || '%'
           LIMIT 1`,
          [productName]
        );
        
        if (products && products.length > 0) {
          const product = products[0];
          const newStock = Math.max(0, (Number(product.current_stock) || 0) - quantity);
          await run('UPDATE products SET current_stock = ?, updated_at = datetime(\'now\') WHERE id = ?', 
            [newStock, product.id]);
          console.log(`📦 庫存更新: ${product.name} ${product.current_stock} -> ${newStock}`);
        }
      }
    }

    res.json({ 
      success: true,
      id: orderId, 
      message: '現場銷售記錄成功',
      order: { id: orderId, ...orderData }
    });
  } catch (error) {
    console.error('❌ 創建POS訂單失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 取得歷史訂單（共享給 POS 系統）
app.get('/api/shared/orders/history', async (req, res) => {
  try {
    const { date, order_type } = req.query;
    
    let sql = `
      SELECT o.*, c.name as customer_name, c.phone, c.address
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (date) {
      sql += ' AND o.order_date = ?';
      params.push(date);
    }

    if (order_type === 'walk-in') {
      sql += ' AND (o.created_by = ? OR c.source = ?)';
      params.push('pos-system', '現場訂購');
    }

    sql += ' ORDER BY o.order_date DESC, o.id DESC';

    const orders = await query(sql, params);

    // 解析 items JSON
    const processedOrders = orders.map(order => {
      let items = [];
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      } catch (e) {
        items = [];
      }
      return { ...order, items };
    });

    res.json(processedOrders);
  } catch (error) {
    console.error('❌ 取得共享歷史訂單失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ 取得日報表（共享給 POS 系統）
app.get('/api/shared/reports/daily/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    const orders = await query(`
      SELECT o.*, c.name as customer_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.order_date = ?
      ORDER BY o.id DESC
    `, [date]);

    // 解析 items 並計算統計
    let totalAmount = 0;
    let walkInAmount = 0;
    let onlineAmount = 0;
    const productStats = {};

    orders.forEach(order => {
      let items = [];
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
      } catch (e) {
        items = [];
      }

      const orderTotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      totalAmount += orderTotal;

      if (order.created_by === 'pos-system' || order.customer_name === '現場客戶') {
        walkInAmount += orderTotal;
      } else {
        onlineAmount += orderTotal;
      }

      items.forEach(item => {
        const productName = item.product_name || item.name;
        if (!productStats[productName]) {
          productStats[productName] = { quantity: 0, amount: 0 };
        }
        productStats[productName].quantity += item.quantity;
        productStats[productName].amount += item.quantity * item.unit_price;
      });
    });

    res.json({
      date,
      summary: {
        total_orders: orders.length,
        total_amount: totalAmount,
        walk_in_amount: walkInAmount,
        online_amount: onlineAmount
      },
      products: productStats,
      orders: orders.map(order => {
        let items = [];
        try {
          items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []);
        } catch (e) {
          items = [];
        }
        return { ...order, items };
      })
    });
  } catch (error) {
    console.error('❌ 取得日報表失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 啟動服務器
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log('🗄️ Using SQLite database');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Shared API endpoints for POS system:`);
      console.log(`   GET  /api/shared/products`);
      console.log(`   GET  /api/shared/customers`);
      console.log(`   POST /api/shared/pos-orders`);
      console.log(`   GET  /api/shared/orders/history`);
      console.log(`   GET  /api/shared/reports/daily/:date`);
    });
  } catch (error) {
    console.error('❌ 服務器啟動失敗:', error);
    process.exit(1);
  }
}

startServer();