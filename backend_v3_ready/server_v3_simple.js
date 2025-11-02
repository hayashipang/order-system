import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pkg from 'pg';

// 載入環境變數
dotenv.config();

const { Pool } = pkg;
const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;

// 環境設定
console.log('🌍 環境設定:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('  PORT:', PORT);
console.log('  DATABASE_URL:', DATABASE_URL ? '已設定' : '未設定');

// PostgreSQL 設定
let usePostgres = false;
let pool = null;
if (DATABASE_URL) {
  try {
    pool = new Pool({ 
      connectionString: DATABASE_URL, 
      ssl: { rejectUnauthorized: false } 
    });
    usePostgres = true;
    console.log('✅ 使用 PostgreSQL 資料庫');
  } catch (error) {
    console.error('❌ PostgreSQL 連接失敗，切換到 JSON 模式:', error.message);
    usePostgres = false;
  }
} else {
  console.log('🗂 使用本地 JSON 儲存');
}

// JSON 檔案路徑
const DATA_PATH = './data.local.json';

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    if (origin.includes('vercel.app') || origin.includes('railway.app')) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// ===========================================
// 資料存取層 (Data Access Layer)
// ===========================================

// JSON 資料操作
function readLocalData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const data = fs.readFileSync(DATA_PATH, 'utf8');
      return JSON.parse(data);
    }
    return { orders: [], products: [], order_items: [], customers: [] };
  } catch (error) {
    console.error('讀取本地資料失敗:', error);
    return { orders: [], products: [], order_items: [], customers: [] };
  }
}

function writeLocalData(data) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ 資料已儲存到本地檔案 (data.local.json)');
  } catch (error) {
    console.error('寫入本地資料失敗:', error);
  }
}

// PostgreSQL 資料操作
async function readPostgresData() {
  try {
    const ordersResult = await pool.query('SELECT * FROM orders ORDER BY id DESC');
    const productsResult = await pool.query('SELECT * FROM products ORDER BY id');
    const orderItemsResult = await pool.query('SELECT * FROM order_items ORDER BY id');
    const customersResult = await pool.query('SELECT * FROM customers ORDER BY id');
    
    return {
      orders: ordersResult.rows,
      products: productsResult.rows,
      order_items: orderItemsResult.rows,
      customers: customersResult.rows
    };
  } catch (error) {
    console.error('讀取 PostgreSQL 資料失敗:', error);
    return { orders: [], products: [], order_items: [], customers: [] };
  }
}

async function writePostgresData(data) {
  try {
    // 清空現有資料
    await pool.query('DELETE FROM order_items');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM products');
    await pool.query('DELETE FROM customers');
    
    // 插入新資料
    for (const customer of data.customers || []) {
      await pool.query(
        'INSERT INTO customers (id, name, phone, address, notes) VALUES ($1, $2, $3, $4, $5)',
        [customer.id, customer.name, customer.phone, customer.address, customer.notes]
      );
    }
    
    for (const product of data.products || []) {
      await pool.query(
        'INSERT INTO products (id, name, price, current_stock, original_stock, category) VALUES ($1, $2, $3, $4, $5, $6)',
        [product.id, product.name, product.price, product.current_stock, product.original_stock, product.category]
      );
    }
    
    for (const order of data.orders || []) {
      await pool.query(
        'INSERT INTO orders (id, customer_id, customer_name, order_date, delivery_date, status, notes, shipping_type, shipping_fee, credit_card_fee, shopee_fee, scheduling_status, production_date, linked_schedule_id, scheduled_at, merged_orders, scheduled_items) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)',
        [
          order.id, order.customer_id, order.customer_name, order.order_date, order.delivery_date,
          order.status, order.notes, order.shipping_type, order.shipping_fee, order.credit_card_fee,
          order.shopee_fee, order.scheduling_status, order.production_date, order.linked_schedule_id,
          order.scheduled_at, JSON.stringify(order.merged_orders), JSON.stringify(order.scheduled_items)
        ]
      );
    }
    
    for (const item of data.order_items || []) {
      await pool.query(
        'INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, special_notes, status, is_gift) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [item.id, item.order_id, item.product_id, item.product_name, item.quantity, item.unit_price, item.special_notes, item.status, item.is_gift]
      );
    }
    
    console.log('✅ 資料已儲存到 PostgreSQL');
  } catch (error) {
    console.error('寫入 PostgreSQL 資料失敗:', error);
  }
}

// 統一的資料存取介面
async function getLatestData() {
  if (usePostgres) {
    return await readPostgresData();
  } else {
    return readLocalData();
  }
}

async function saveData(data) {
  if (usePostgres) {
    await writePostgresData(data);
  } else {
    writeLocalData(data);
  }
}

// ===========================================
// API 路由
// ===========================================

// 健康檢查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mode: usePostgres ? 'PostgreSQL' : 'JSON',
    timestamp: new Date().toISOString()
  });
});

// 訂單 API
app.get('/api/orders', async (req, res) => {
  try {
    const db = await getLatestData();
    res.json(db.orders || []);
  } catch (error) {
    console.error('取得訂單失敗:', error);
    res.status(500).json({ error: '取得訂單失敗' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const newOrder = req.body;
    const db = await getLatestData();
    
    // 生成新 ID
    const maxId = Math.max(...db.orders.map(o => o.id || 0), 0);
    newOrder.id = maxId + 1;
    newOrder.created_at = new Date().toISOString();
    
    db.orders.push(newOrder);
    await saveData(db);
    
    res.json({ success: true, order: newOrder });
  } catch (error) {
    console.error('新增訂單失敗:', error);
    res.status(500).json({ error: '新增訂單失敗' });
  }
});

// 排程 API
app.post('/api/scheduling/confirm', async (req, res) => {
  try {
    const { orderIds, selectedDate, manufacturingQuantities } = req.body;
    console.log('🚀 [Confirm] 開始排程:', { orderIds, selectedDate, manufacturingQuantities });

    if (!orderIds?.length) {
      return res.status(400).json({ success: false, message: '請選擇要排程的訂單' });
    }
    if (!selectedDate) {
      return res.status(400).json({ success: false, message: '請選擇生產日期' });
    }

    // 載入最新資料
    const db = await getLatestData();
    if (!db.orders) db.orders = [];

    // 清除同日期舊主排程單
    const oldSchedules = db.orders.filter(
      o =>
        o.production_date === selectedDate &&
        Array.isArray(o.merged_orders) &&
        o.merged_orders.length > 0 &&
        !o.linked_schedule_id
    );

    if (oldSchedules.length > 0) {
      console.log(`🧹 [Confirm] 清除 ${oldSchedules.length} 筆舊主排程 (${selectedDate})`);
      const oldIds = oldSchedules.map(o => o.id);
      db.orders = db.orders.filter(o => !oldIds.includes(o.id));
    }

    // 找出要排程的訂單
    const ordersToSchedule = db.orders.filter(o => orderIds.includes(o.id));
    if (!ordersToSchedule.length) {
      return res.status(400).json({ success: false, message: '找不到要排程的訂單' });
    }

    // 建立合併後的排程項目
    const mergedScheduledItems = Object.entries(manufacturingQuantities).map(([productName, qty]) => ({
      product_name: productName,
      scheduled_quantity: Number(qty) || 0,
      completed_quantity: 0,
      status: 'scheduled'
    }));

    // 建立主排程單
    const masterSchedule = {
      id: `schedule_${Date.now()}`,
      production_date: selectedDate,
      scheduled_items: mergedScheduledItems,
      merged_orders: orderIds,
      status: 'scheduled',
      scheduling_status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 寫入資料庫
    db.orders.push(masterSchedule);

    // 更新子訂單狀態
    ordersToSchedule.forEach(o => {
      o.status = 'scheduled';
      o.scheduling_status = 'merged';
      o.linked_schedule_id = masterSchedule.id;
      o.production_date = selectedDate;
      o.scheduled_at = new Date().toISOString();
    });

    // 實際保存
    await saveData(db);

    res.json({
      success: true,
      message: `已建立主排程單，生產日期：${selectedDate}`,
      schedule_id: masterSchedule.id,
      merged_orders: orderIds.length
    });

  } catch (err) {
    console.error('❌ [Confirm] 排程錯誤:', err);
    res.status(500).json({ success: false, message: '排程失敗', error: err.message });
  }
});

// 廚房 API
app.get('/api/kitchen/production/:date', async (req, res) => {
  const { date } = req.params;
  try {
    const db = await getLatestData();

    // 只抓主排程單
    const schedules = db.orders.filter(o =>
      (
        (o.scheduled_date === date || (!o.scheduled_date && o.production_date === date))
      ) &&
      Array.isArray(o.merged_orders) &&
      o.merged_orders.length > 0 &&
      !o.linked_schedule_id
    );

    if (!schedules.length) {
      console.log('沒有主排程單');
      return res.json([]);
    }

    const productStats = {};
    schedules.forEach(schedule => {
      schedule.scheduled_items.forEach(item => {
        const key = item.product_name;
        if (!productStats[key]) {
          productStats[key] = {
            product_name: item.product_name,
            total_quantity: 0,
            completed_quantity: 0,
          };
        }
        productStats[key].total_quantity += item.scheduled_quantity || 0;
        productStats[key].completed_quantity += item.completed_quantity || 0;
      });
    });

    Object.values(productStats).forEach(p => {
      p.pending_quantity = Math.max(0, p.total_quantity - p.completed_quantity);
    });

    res.json(Object.values(productStats));
  } catch (err) {
    console.error('Kitchen production 查詢錯誤:', err);
    res.status(500).json([]);
  }
});

// 廚房標記完成 API
app.put('/api/kitchen/production/:date/:productName/status', async (req, res) => {
  const { date, productName } = req.params;
  const { status } = req.body;
  const decodedProductName = decodeURIComponent(productName);

  try {
    console.log('📦 Kitchen 標記完成請求:', { date, productName: decodedProductName, status });

    // 確保拿到最新 DB
    let db = await getLatestData();
    const orders = db.orders || [];
    const products = db.products || [];
    const orderItems = db.order_items || [];

    // 日期標準化
    const normalizedDate = date.split('T')[0];
    console.log('📅 Normalized Date =', normalizedDate);

    // 找出主排程單
    const mainSchedules = orders.filter(o =>
      o.production_date?.startsWith(normalizedDate) &&
      (o.is_main_schedule === true ||
        (Array.isArray(o.merged_orders) && o.merged_orders.length > 0)) &&
      (!o.linked_schedule_id || o.linked_schedule_id.startsWith('schedule_'))
    );

    if (!mainSchedules.length) {
      console.warn(`⚠️ 找不到 ${normalizedDate} 的主排程單`);
      return res.status(400).json({ error: '找不到主排程單，請確認排程是否建立成功' });
    }

    // 計算該產品的總排程數量
    let totalScheduledQuantity = 0;
    mainSchedules.forEach(order => {
      order.scheduled_items?.forEach(item => {
        if (item.product_name === decodedProductName) {
          totalScheduledQuantity += Number(item.scheduled_quantity) || 0;
        }
      });
    });
    console.log(`📊 ${decodedProductName} 總排程數量: ${totalScheduledQuantity}`);

    // 防重複：確認是否已標記完成
    let alreadyCompleted = false;
    if (status === 'completed') {
      orderItems.forEach(item => {
        if (item.product_name === decodedProductName &&
            item.production_date?.startsWith(normalizedDate) &&
            item.status === 'completed') {
          alreadyCompleted = true;
        }
      });
    }

    // 更新主排程與項目狀態
    mainSchedules.forEach(order => {
      order.status = status;
      order.scheduling_status = status;
      order.scheduled_items?.forEach(item => {
        if (item.product_name === decodedProductName) {
          item.status = status;
        }
      });
    });

    // 更新庫存（僅未完成過的項目）
    if (status === 'completed' && !alreadyCompleted) {
      const product = products.find(p => p.name === decodedProductName);
      if (product) {
        const oldStock = product.current_stock || 0;
        product.current_stock = oldStock + totalScheduledQuantity;
        console.log(`✅ 庫存更新: ${decodedProductName} ${oldStock} → ${product.current_stock} (+${totalScheduledQuantity})`);
      }
    } else if (alreadyCompleted) {
      console.log(`⚠️ ${decodedProductName} 已完成過，跳過庫存更新`);
    }

    // 儲存 + reload
    await saveData(db);
    db = await getLatestData();

    res.json({
      success: true,
      message: `${decodedProductName} 狀態已更新為 ${status}`,
      added: status === 'completed' && !alreadyCompleted ? totalScheduledQuantity : 0
    });
  } catch (err) {
    console.error('❌ Kitchen API 錯誤:', err);
    res.status(500).json({ error: '伺服器錯誤，請稍後再試' });
  }
});

// 庫存 API
app.get('/api/inventory/scheduling', async (req, res) => {
  try {
    const { date } = req.query;
    const db = await getLatestData();
    
    // 只顯示主排程單
    const schedules = db.orders.filter(o =>
      (o.scheduled_date === date || o.production_date === date) &&
      Array.isArray(o.merged_orders) &&
      o.merged_orders.length > 0 &&
      !o.linked_schedule_id
    );

    const inventoryDeduction = {};
    schedules.forEach(schedule => {
      schedule.scheduled_items?.forEach(item => {
        const productName = item.product_name;
        if (!inventoryDeduction[productName]) {
          inventoryDeduction[productName] = 0;
        }
        inventoryDeduction[productName] += item.scheduled_quantity || 0;
      });
    });

    res.json(inventoryDeduction);
  } catch (error) {
    console.error('庫存查詢錯誤:', error);
    res.status(500).json({ error: '庫存查詢失敗' });
  }
});

// 產品 API
app.get('/api/products', async (req, res) => {
  try {
    const db = await getLatestData();
    res.json(db.products || []);
  } catch (error) {
    console.error('取得產品失敗:', error);
    res.status(500).json({ error: '取得產品失敗' });
  }
});

// 客戶 API
app.get('/api/customers', async (req, res) => {
  try {
    const db = await getLatestData();
    res.json(db.customers || []);
  } catch (error) {
    console.error('取得客戶失敗:', error);
    res.status(500).json({ error: '取得客戶失敗' });
  }
});

// 訂單項目 API
app.get('/api/order-items', async (req, res) => {
  try {
    const db = await getLatestData();
    res.json(db.order_items || []);
  } catch (error) {
    console.error('取得訂單項目失敗:', error);
    res.status(500).json({ error: '取得訂單項目失敗' });
  }
});

// 未完成訂單 API
app.get('/api/orders/uncompleted', async (req, res) => {
  try {
    const { date } = req.query;
    const db = await getLatestData();
    const target = (date || new Date().toISOString().slice(0,10)).replace(/\//g,'-');
    const orders = (db.orders || []).filter(o =>
      o &&
      o.order_date &&
      o.order_date < target &&
      (o.status !== 'completed' && o.status !== 'shipped')
    ).map(o => ({
      id: o.id,
      customer_name: o.customer_name,
      order_date: o.order_date,
      scheduled_date: o.scheduled_date || null,
      production_date: o.production_date || null,
      status: o.status,
      total_items: Array.isArray(o.items) ? o.items.length : (Array.isArray(o.scheduled_items) ? o.scheduled_items.length : 0)
    }));
    res.json(orders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'uncompleted query failed' });
  }
});

// 初始化資料庫表格（僅 PostgreSQL）
async function initDatabase() {
  if (!usePostgres) return;
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        notes TEXT
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2),
        current_stock INTEGER DEFAULT 0,
        original_stock INTEGER DEFAULT 0,
        category VARCHAR(100)
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER,
        customer_name VARCHAR(255),
        order_date DATE,
        delivery_date DATE,
        status VARCHAR(50),
        notes TEXT,
        shipping_type VARCHAR(50),
        shipping_fee DECIMAL(10,2),
        credit_card_fee DECIMAL(10,2),
        shopee_fee DECIMAL(10,2),
        scheduling_status VARCHAR(50),
        production_date DATE,
        linked_schedule_id VARCHAR(255),
        scheduled_at TIMESTAMP,
        merged_orders JSONB,
        scheduled_items JSONB
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER,
        product_id INTEGER,
        product_name VARCHAR(255),
        quantity INTEGER,
        unit_price DECIMAL(10,2),
        special_notes TEXT,
        status VARCHAR(50),
        is_gift BOOLEAN DEFAULT FALSE
      )
    `);
    
    console.log('✅ PostgreSQL 資料表初始化完成');
  } catch (error) {
    console.error('❌ PostgreSQL 資料表初始化失敗:', error);
  }
}

// 啟動伺服器
async function startServer() {
  try {
    // 初始化資料庫
    await initDatabase();
    
    // 如果是 JSON 模式，確保資料檔案存在
    if (!usePostgres && !fs.existsSync(DATA_PATH)) {
      const defaultData = {
        orders: [],
        products: [],
        order_items: [],
        customers: []
      };
      writeLocalData(defaultData);
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📡 Mode: ${usePostgres ? 'PostgreSQL' : 'JSON'}`);
      console.log(`🌐 Local access: http://localhost:${PORT}`);
      console.log(`📡 API Base: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ 伺服器啟動失敗:', error);
    process.exit(1);
  }
}

startServer();
