import express from 'express';
import fs from 'fs';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import pkg from 'pg';
dotenv.config();
const app = express();

// 啟用 CORS
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

app.use(bodyParser.json());

const PORT = 3001;
const DATABASE_URL = process.env.DATABASE_URL;

// PostgreSQL 設定
let usePostgres = false;
let pool = null;
if (DATABASE_URL) {
  const { Pool } = pkg;
  pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  usePostgres = true;
  console.log('✅ Using PostgreSQL');
} else {
  console.log('🗂 Using local JSON storage');
}

// JSON 路徑
const DATA_PATH = './data.local.json';

function readLocalData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch (e) {
    return { orders: [], products: [], order_items: [] };
  }
}

function writeLocalData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

// 健康檢查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: usePostgres ? 'PostgreSQL' : 'JSON' });
});

// ✅ 資料修復：自動補齊所有缺失欄位、修正格式、統一資料結構
async function repairAllOrderData() {
  if (usePostgres) {
    console.log('📊 PostgreSQL 模式，跳過資料修復');
    return;
  }

  console.log('🔧 開始執行訂單資料修復...');
  const db = readLocalData();
  const orders = db.orders || [];

  let fixedId = 0;
  let fixedDate = 0;
  let fixedStructure = 0;

  // 產生遞增 ID（從現有最大 ID 後續往上加）
  const maxExistingId = Math.max(
    ...orders.map(o => Number(o.id) || 0),
    0
  );
  let nextId = maxExistingId + 1;

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    let updatedFields = {};

    // ✅ 1. 修復缺失的 id
    if (!order.id || order.id === null) {
      updatedFields.id = nextId++;
      fixedId++;
    }

    // ✅ 2. 修復缺失的 order_date
    if (!order.order_date) {
      updatedFields.order_date = new Date().toISOString().slice(0, 10);
      fixedDate++;
    }

    // ✅ 3. 修復不一致的結構（統一資料格式）
    const normalized = {};

    // 統一 customer_name
    normalized.customer_name =
      order.customer_name ||
      (order.customer_id ? `ID-${order.customer_id}` : '未知客戶');

    // 統一 total_quantity / order_count
    const itemCount =
      order.total_quantity ??
      order.order_count ??
      (order.items ? order.items.reduce((s, i) => s + (i.quantity || 0), 0) : 0);

    normalized.total_quantity = itemCount;

    // 統一 items 結構
    normalized.items = Array.isArray(order.items) ? order.items : [];

    // 添加時間戳
    if (!order.created_at) {
      normalized.created_at = new Date().toISOString();
    }
    if (!order.updated_at) {
      normalized.updated_at = new Date().toISOString();
    }

    // ✅ 如果這些欄位跟原本不一樣 → 需要更新
    const needsUpdate = 
      (order.customer_name !== normalized.customer_name) ||
      (JSON.stringify(order.items) !== JSON.stringify(normalized.items)) ||
      (order.total_quantity !== normalized.total_quantity) ||
      !order.created_at ||
      !order.updated_at;
      
    if (needsUpdate) {
      updatedFields = { ...updatedFields, ...normalized };
      fixedStructure++;
    }

    // ✅ 更新資料
    if (Object.keys(updatedFields).length > 0) {
      orders[i] = { ...order, ...updatedFields };
    }
  }

  // 寫回資料庫
  db.orders = orders;
  writeLocalData(db);

  console.log(
    `✅ 資料修復完成：
    - 補上 ID：${fixedId} 筆
    - 補上日期：${fixedDate} 筆
    - 修正欄位格式：${fixedStructure} 筆
    - ✅ 所有訂單資料結構已統一`
  );
}

// ✅ 自動修復 Kitchen 生產資料缺 item_id 的問題
async function repairKitchenProduction() {
  if (usePostgres) {
    console.log('📊 PostgreSQL 模式，跳過 Kitchen 資料修復');
    return;
  }

  console.log('🔧 開始執行 Kitchen 生產資料修復...');
  const db = readLocalData();
  const orders = db.orders || [];

  let fixed = 0;

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    if (!Array.isArray(order.items)) continue;

    let needsUpdate = false;
    let newItems = [];

    for (const item of order.items) {
      if (!item.item_id) {
        needsUpdate = true;
        // 使用 crypto.randomUUID() 生成唯一 ID
        newItems.push({
          ...item,
          item_id: crypto.randomUUID(),
        });
        fixed++;
      } else {
        newItems.push(item);
      }
    }

    if (needsUpdate) {
      orders[i] = { ...order, items: newItems };
    }
  }

  // 寫回資料庫
  db.orders = orders;
  writeLocalData(db);

  console.log(`✅ Kitchen 生產資料修復完成：補了 ${fixed} 個缺 item_id`);
}

// ✅ 系統啟動時執行自動修復
Promise.all([
  repairAllOrderData(),
  repairKitchenProduction()
])
  .then(() => console.log('✅ 所有資料修復完成，系統啟動中...'))
  .catch(err => console.error('❌ 資料修復錯誤:', err));

// 訂單 API
app.get('/api/orders', async (req, res) => {
  if (usePostgres) {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY id DESC LIMIT 20');
    res.json(rows);
  } else {
    const db = readLocalData();
    res.json(db.orders || []);
  }
});

app.post('/api/orders', async (req, res) => {
  const newOrder = req.body;
  
  if (usePostgres) {
    await pool.query('INSERT INTO orders (data) VALUES ($1)', [JSON.stringify(newOrder)]);
    res.json({ success: true });
  } else {
    const db = readLocalData();
    
    // 為新訂單分配ID
    const maxId = db.orders.reduce((max, order) => {
      const orderId = parseInt(order.id) || 0;
      return orderId > max ? orderId : max;
    }, 0);
    
    newOrder.id = maxId + 1;
    newOrder.created_at = new Date().toISOString();
    newOrder.updated_at = new Date().toISOString();
    
    db.orders.push(newOrder);
    writeLocalData(db);
    res.json({ success: true, id: newOrder.id });
  }
});

// 客戶 API
app.get('/api/customers', async (req, res) => {
  if (usePostgres) {
    const { rows } = await pool.query('SELECT * FROM customers ORDER BY id DESC');
    res.json(rows);
  } else {
    const db = readLocalData();
    res.json(db.customers || []);
  }
});

app.post('/api/customers', async (req, res) => {
  const newCustomer = req.body;
  if (usePostgres) {
    await pool.query('INSERT INTO customers (data) VALUES ($1)', [JSON.stringify(newCustomer)]);
    res.json({ success: true });
  } else {
    const db = readLocalData();
    if (!db.customers) db.customers = [];
    newCustomer.id = db.customers.length > 0 ? Math.max(...db.customers.map(c => c.id)) + 1 : 1;
    db.customers.push(newCustomer);
    writeLocalData(db);
    res.json({ success: true, id: newCustomer.id });
  }
});

// 產品 API
app.get('/api/products', async (req, res) => {
  if (usePostgres) {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(rows);
  } else {
    const db = readLocalData();
    res.json(db.products || []);
  }
});

app.post('/api/products', async (req, res) => {
  const newProduct = req.body;
  if (usePostgres) {
    await pool.query('INSERT INTO products (data) VALUES ($1)', [JSON.stringify(newProduct)]);
    res.json({ success: true });
  } else {
    const db = readLocalData();
    if (!db.products) db.products = [];
    newProduct.id = db.products.length > 0 ? Math.max(...db.products.map(p => p.id)) + 1 : 1;
    db.products.push(newProduct);
    writeLocalData(db);
    res.json({ success: true, id: newProduct.id });
  }
});

// 運費設定 API
app.get('/api/shipping-fee', async (req, res) => {
  res.json({ shippingFee: 120 });
});

// 產品更新 API
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const updatedProduct = req.body;
  if (usePostgres) {
    await pool.query('UPDATE products SET data = $1 WHERE id = $2', [JSON.stringify(updatedProduct), id]);
    res.json({ success: true });
  } else {
    const db = readLocalData();
    const productIndex = db.products.findIndex(p => p.id == id);
    if (productIndex !== -1) {
      db.products[productIndex] = { ...db.products[productIndex], ...updatedProduct };
      writeLocalData(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  }
});

// 產品刪除 API
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  if (usePostgres) {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true });
  } else {
    const db = readLocalData();
    db.products = db.products.filter(p => p.id != id);
    writeLocalData(db);
    res.json({ success: true });
  }
});

// 產品同步優先順序 API
app.post('/api/products/sync-priority', async (req, res) => {
  res.json({ success: true, message: 'Product priority synced' });
});

// 客戶訂單 API
app.get('/api/orders/customers/:date', async (req, res) => {
  const { date } = req.params;
  if (usePostgres) {
    const { rows } = await pool.query('SELECT * FROM orders WHERE delivery_date = $1', [date]);
    res.json({ orders: rows, totalAmount: 0 });
  } else {
    const db = readLocalData();
    const orders = db.orders.filter(order => order.delivery_date === date);
    
    // 為每個訂單添加客戶資訊
    const ordersWithCustomerInfo = orders.map(order => {
      const customer = db.customers.find(c => c.id === order.customer_id);
      return {
        ...order,
        customer_name: customer ? customer.name : (order.customer_name || '未知客戶'),
        phone: customer ? customer.phone : '',
        address: customer ? customer.address : '',
        family_mart_address: customer ? customer.family_mart_address : '',
        source: customer ? customer.source : '',
        payment_method: customer ? customer.payment_method : '',
        order_number: customer ? customer.order_number : order.order_number || ''
      };
    });
    
    const totalAmount = ordersWithCustomerInfo.reduce((sum, order) => {
      const itemsTotal = (order.items || []).reduce((itemSum, item) => 
        itemSum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
      return sum + itemsTotal + (order.shipping_fee || 0) + (order.credit_card_fee || 0) + (order.shopee_fee || 0);
    }, 0);
    
    res.json({ orders: ordersWithCustomerInfo, totalAmount });
  }
});

// POS 訂單 API
app.post('/api/shared/pos-orders', async (req, res) => {
  const posOrderData = req.body;
  if (usePostgres) {
    await pool.query('INSERT INTO orders (data) VALUES ($1)', [JSON.stringify(posOrderData)]);
    res.json({ success: true });
  } else {
    const db = readLocalData();
    const newOrder = {
      id: db.orders.length > 0 ? Math.max(...db.orders.map(o => o.id)) + 1 : 1,
      ...posOrderData,
      order_date: new Date().toISOString().split('T')[0],
      delivery_date: new Date().toISOString().split('T')[0],
      status: 'completed'
    };
    db.orders.push(newOrder);
    writeLocalData(db);
    res.json({ success: true, id: newOrder.id });
  }
});

// 廚房相關 API - 只顯示主排程單
app.get('/api/kitchen/production/:date', async (req, res) => {
  const { date } = req.params;
  try {
  if (usePostgres) {
      // PostgreSQL 模式：查詢主排程單
      const { rows } = await pool.query(`
        SELECT * FROM orders 
        WHERE production_date = $1 
        AND merged_orders IS NOT NULL 
        AND jsonb_array_length(merged_orders) > 0
        AND (linked_schedule_id IS NULL OR linked_schedule_id = '')
      `, [date]);
    res.json(rows);
  } else {
    const db = readLocalData();
      // 只抓主排程單（有 merged_orders 且不為空）
      const schedules = db.orders.filter(o =>
        o.production_date === date &&
        Array.isArray(o.merged_orders) &&
        o.merged_orders.length > 0 &&
        (!o.linked_schedule_id || o.linked_schedule_id === '')
      );
      
      console.log(`🍳 [Kitchen] ${date} 主排程檢查結果：${schedules.length} 筆`);
      schedules.forEach(s =>
        console.log(`→ ${s.id}: ${s.scheduled_items?.map(i => `${i.product_name}×${i.scheduled_quantity}`).join(', ')}`)
      );

      if (!schedules.length) {
        console.log('⚠️ 沒有主排程單');
        return res.json([]);
      }

      // 統計產品總數
      const productStats = {};
      schedules.forEach(schedule => {
        if (Array.isArray(schedule.scheduled_items)) {
          schedule.scheduled_items.forEach(item => {
            const name = item.product_name;
            if (!productStats[name]) {
              productStats[name] = {
                product_name: name,
                total_quantity: 0,
                completed_quantity: 0,
                pending_quantity: 0,
              };
            }
            productStats[name].total_quantity += Number(item.scheduled_quantity || 0);
            productStats[name].completed_quantity += Number(item.completed_quantity || 0);
          });
        }
      });

      Object.values(productStats).forEach(p => {
        p.pending_quantity = Math.max(0, p.total_quantity - p.completed_quantity);
      });

      res.json(Object.values(productStats));
    }
  } catch (err) {
    console.error('❌ Kitchen production 查詢錯誤:', err);
    res.status(500).json({ error: '無法取得廚房生產資料' });
  }
});

// ==================== Kitchen 統一函數 ====================

/**
 * 更新 Kitchen 生產狀態
 * @param {Array} mainSchedules - 主排程單陣列
 * @param {string} productName - 產品名稱
 * @param {string} status - 狀態 ('completed' | 'pending')
 * @returns {Object} 更新結果
 */
function updateKitchenStatus(mainSchedules, productName, status) {
  let updated = false;
  let totalScheduledQuantity = 0;

  // 計算總排程數量
  mainSchedules.forEach(order => {
    if (Array.isArray(order.scheduled_items)) {
      order.scheduled_items.forEach(item => {
        if (item.product_name === productName) {
          totalScheduledQuantity += Number(item.scheduled_quantity) || 0;
        }
      });
    }
  });

  // 更新狀態
  mainSchedules.forEach(order => {
    if (Array.isArray(order.scheduled_items)) {
      order.scheduled_items.forEach(item => {
        if (item.product_name === productName) {
          item.status = status;
          if (status === 'completed') {
            item.completed_quantity = item.scheduled_quantity;
          } else if (status === 'pending') {
            item.completed_quantity = 0;
          }
          updated = true;
        }
      });
    }
  });

  return {
    updated,
    totalScheduledQuantity,
    status
  };
}

/**
 * 更新庫存
 * @param {Object} db - 資料庫物件
 * @param {string} productName - 產品名稱
 * @param {number} quantity - 數量變化
 * @param {string} status - 狀態
 * @returns {Object} 更新結果
 */
function updateInventoryStock(db, productName, quantity, status) {
  const products = db.products || [];
  const product = products.find(p => p.name === productName);
  
  if (!product) {
    console.warn(`⚠️ 找不到產品: ${productName}`);
    return { success: false, message: `找不到產品: ${productName}` };
  }

  const oldStock = product.current_stock || 0;
  let newStock = oldStock;
  let added = 0;

  if (status === 'completed') {
    newStock = oldStock + quantity;
    added = quantity;
  } else if (status === 'pending') {
    // pending 狀態不改變庫存
    added = 0;
  }

  product.current_stock = newStock;
  
  console.log(`✅ 庫存更新: ${productName} ${oldStock} → ${newStock} (+${added})`);
  
  return {
    success: true,
    oldStock,
    newStock,
    added,
    message: `庫存更新: ${productName} ${oldStock} → ${newStock}`
  };
}

// ==================== Kitchen API ====================

// 廚房生產狀態更新 API
app.put('/api/kitchen/production/:date/:productName/status', async (req, res) => {
  const { date, productName } = req.params;
  const { status } = req.body;
  const decodedProductName = decodeURIComponent(productName);

  try {
    console.log('📦 Kitchen 標記完成請求:', { date, productName: decodedProductName, status });

    if (usePostgres) {
      // PostgreSQL 版本 - 簡化實現
      res.json({ success: true, message: '生產狀態更新成功' });
    } else {
      // 本地 JSON 版本
      const db = readLocalData();
      if (!db.orders) db.orders = [];

      // 找出主排程單
      const mainSchedules = db.orders.filter(o =>
        o.production_date === date &&
        Array.isArray(o.merged_orders) &&
        o.merged_orders.length > 0 &&
        (!o.linked_schedule_id || o.linked_schedule_id === '')
      );

      if (!mainSchedules.length) {
        console.warn(`⚠️ 找不到 ${date} 的主排程單`);
        return res.status(400).json({ error: '找不到主排程單' });
      }

      // 使用統一函數更新 Kitchen 狀態
      const kitchenResult = updateKitchenStatus(mainSchedules, decodedProductName, status);
      console.log(`📊 ${decodedProductName} 總排程數量: ${kitchenResult.totalScheduledQuantity}`);

      if (!kitchenResult.updated) {
        return res.status(400).json({ error: '找不到指定的產品' });
      }

      // 使用統一函數更新庫存
      const inventoryResult = updateInventoryStock(db, decodedProductName, kitchenResult.totalScheduledQuantity, status);

      if (!inventoryResult.success) {
        console.warn(`⚠️ 庫存更新失敗: ${inventoryResult.message}`);
      }

      // 儲存資料
      writeLocalData(db);
      console.log(`✅ Kitchen 狀態更新成功: ${decodedProductName} -> ${status}`);

      // 回傳更新後的 production item
      res.json({ 
        success: true, 
        message: '生產狀態更新成功',
        added: inventoryResult.added,
        updated_item: {
          product_name: decodedProductName,
          status: status,
          scheduled_quantity: kitchenResult.totalScheduledQuantity,
          completed_quantity: status === 'completed' ? kitchenResult.totalScheduledQuantity : 0,
          inventory_change: inventoryResult.added
        }
      });
    }
  } catch (err) {
    console.error('❌ Kitchen 狀態更新失敗:', err);
    res.status(500).json({ error: '更新生產狀態失敗' });
  }
});

// 🆕 每週訂單 API：查詢指定日期所在週的所有訂單
app.get('/api/orders/weekly/:date', async (req, res) => {
  const { date } = req.params;

  try {
    const startDate = new Date(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);

    if (usePostgres) {
      // PostgreSQL 版本
      const { rows } = await pool.query(`
        SELECT o.*, 
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', oi.id,
                     'product_id', oi.product_id,
                     'product_name', oi.product_name,
                     'quantity', oi.quantity,
                     'unit_price', oi.unit_price,
                     'item_total', oi.item_total
                   )
                 ) FILTER (WHERE oi.id IS NOT NULL), 
                 '[]'::json
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.order_date >= $1 AND o.order_date < $2
        GROUP BY o.id
        ORDER BY o.order_date DESC
      `, [startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10)]);

      res.json({
        range: {
          from: startDate.toISOString().slice(0, 10),
          to: endDate.toISOString().slice(0, 10),
        },
        count: rows.length,
        orders: rows,
      });
    } else {
      // JSON 版本
      const db = readLocalData();
      const orders = db.orders.filter(order => {
        const orderDate = new Date(order.order_date);
        return orderDate >= startDate && orderDate < endDate;
      });

      // 為每個訂單添加 items
      const ordersWithItems = orders.map(order => ({
        ...order,
        items: db.order_items ? db.order_items.filter(item => item.order_id === order.id) : []
      }));

      res.json({
        range: {
          from: startDate.toISOString().slice(0, 10),
          to: endDate.toISOString().slice(0, 10),
        },
        count: ordersWithItems.length,
        orders: ordersWithItems,
      });
    }
  } catch (err) {
    console.error('❌ 無法取得每週訂單:', err);
    res.status(500).json({ error: '無法取得每週訂單' });
  }
});

app.get('/api/kitchen/walkin-orders-list', async (req, res) => {
  if (usePostgres) {
    const { rows } = await pool.query('SELECT * FROM orders WHERE order_type = $1', ['walk-in']);
    res.json(rows);
  } else {
    const db = readLocalData();
    const walkinOrders = db.orders.filter(order => order.order_type === 'walk-in');
    res.json(walkinOrders);
  }
});

// 排程參數測試 API
app.post('/api/scheduling/parameter-test', async (req, res) => {
  res.json({ 
    success: true, 
    recommended_parameters: req.body.parameters,
    message: 'Parameter test completed' 
  });
});

app.put('/api/scheduling/config', async (req, res) => {
  res.json({ success: true, message: 'Configuration updated' });
});

// 庫存相關 API
app.get('/api/inventory/scheduling', async (req, res) => {
  if (usePostgres) {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY id');
    res.json(rows);
  } else {
    const db = readLocalData();
    res.json(db.products || []);
  }
});

app.get('/api/inventory/transactions', async (req, res) => {
  if (usePostgres) {
    const { rows } = await pool.query('SELECT * FROM inventory_transactions ORDER BY created_at DESC');
    res.json(rows);
  } else {
    const db = readLocalData();
    res.json(db.inventory_transactions || []);
  }
});

app.post('/api/inventory/transaction', async (req, res) => {
  const { product_id, transaction_type, quantity, notes, created_by } = req.body;
  
  try {
    if (!product_id || !transaction_type || !quantity) {
      return res.status(400).json({ error: '缺少必要參數' });
    }
    
    if (usePostgres) {
      // PostgreSQL 版本
      const product = await pool.query('SELECT * FROM products WHERE id = $1', [product_id]);
      if (product.rows.length === 0) {
        return res.status(404).json({ error: '產品不存在' });
      }
      
      const quantityNum = parseInt(quantity);
      if (quantityNum <= 0) {
        return res.status(400).json({ error: '數量必須大於 0' });
      }
      
      // 計算新的庫存數量
      let newStock = product.rows[0].current_stock || 0;
      if (transaction_type === 'in') {
        newStock += quantityNum;
      } else if (transaction_type === 'out') {
        newStock -= quantityNum;
        if (newStock < 0) {
          return res.status(400).json({ error: '庫存不足，無法出貨' });
        }
      } else {
        return res.status(400).json({ error: '無效的異動類型' });
      }
      
      // 更新產品庫存
      await pool.query('UPDATE products SET current_stock = $1, updated_at = $2 WHERE id = $3', 
        [newStock, new Date().toISOString(), product_id]);
      
      // 新增異動記錄
      await pool.query('INSERT INTO inventory_transactions (data) VALUES ($1)', 
        [JSON.stringify({
          product_id: parseInt(product_id),
          product_name: product.rows[0].name,
          transaction_type,
          quantity: quantityNum,
          transaction_date: new Date().toISOString(),
          notes: notes || '',
          created_by: created_by || 'admin',
          created_at: new Date().toISOString()
        })]);
      
      res.json({ success: true, message: '庫存異動記錄成功' });
    } else {
      // 本地 JSON 版本
      const db = readLocalData();
      
      const product = db.products.find(p => p.id === parseInt(product_id));
      if (!product) {
        return res.status(404).json({ error: '產品不存在' });
      }
      
      const quantityNum = parseInt(quantity);
      if (quantityNum <= 0) {
        return res.status(400).json({ error: '數量必須大於 0' });
      }
      
      // 計算新的庫存數量
      let newStock = product.current_stock || 0;
      if (transaction_type === 'in') {
        newStock += quantityNum;
      } else if (transaction_type === 'out') {
        newStock -= quantityNum;
        if (newStock < 0) {
          return res.status(400).json({ error: '庫存不足，無法出貨' });
        }
      } else {
        return res.status(400).json({ error: '無效的異動類型' });
      }
      
      // 更新產品庫存
      product.current_stock = newStock;
      product.updated_at = new Date().toISOString();
      
      // 確保 inventory_transactions 存在
      if (!db.inventory_transactions) {
        db.inventory_transactions = [];
      }
      
      // 新增異動記錄
      const newTransaction = {
        id: db.inventory_transactions.length > 0 ? Math.max(...db.inventory_transactions.map(t => t.id)) + 1 : 1,
        product_id: parseInt(product_id),
        product_name: product.name,
        transaction_type,
        quantity: quantityNum,
        transaction_date: new Date().toISOString(),
        notes: notes || '',
        created_by: created_by || 'admin',
        created_at: new Date().toISOString()
      };
      
      db.inventory_transactions.push(newTransaction);
      writeLocalData(db);
      
      res.json({ success: true, id: newTransaction.id, message: '庫存異動記錄成功' });
    }
  } catch (error) {
    console.error('庫存異動錯誤:', error);
    res.status(500).json({ error: '庫存異動失敗: ' + error.message });
  }
});

// 排程相關 API
app.get('/api/scheduling/dates/:date/orders', async (req, res) => {
  const { date } = req.params;
  if (usePostgres) {
    const { rows } = await pool.query('SELECT * FROM orders WHERE delivery_date = $1', [date]);
    res.json({ orders: rows });
  } else {
    const db = readLocalData();
    const orders = db.orders.filter(order => order.delivery_date === date);
    
    // 為每個訂單添加客戶資訊和確保有 id
    const ordersWithInfo = orders.map(order => {
      const customer = db.customers.find(c => c.id === order.customer_id);
      return {
        ...order,
        id: order.id || `order_${Date.now()}_${Math.random()}`, // 確保有 id
        customer_name: customer ? customer.name : (order.customer_name || '未知客戶'),
        phone: customer ? customer.phone : '',
        address: customer ? customer.address : '',
        family_mart_address: customer ? customer.family_mart_address : '',
        source: customer ? customer.source : '',
        payment_method: customer ? customer.payment_method : '',
        order_number: customer ? customer.order_number : order.order_number || ''
      };
    });
    
    res.json({ orders: ordersWithInfo });
  }
});

app.get('/api/orders/uncompleted', async (req, res) => {
  if (usePostgres) {
    const { rows } = await pool.query('SELECT * FROM orders WHERE status != $1', ['completed']);
    res.json(rows);
  } else {
    const db = readLocalData();
    const uncompletedOrders = db.orders.filter(order => order.status !== 'completed');
    res.json(uncompletedOrders);
  }
});

// 訂單歷史 API
app.get('/api/orders/history', async (req, res) => {
  const { customer_id, start_date, end_date, order_type } = req.query;
  
  if (usePostgres) {
    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (customer_id) {
      query += ` AND customer_id = $${paramCount}`;
      params.push(customer_id);
      paramCount++;
    }
    if (start_date) {
      query += ` AND order_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    if (end_date) {
      query += ` AND order_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    if (order_type) {
      query += ` AND order_type = $${paramCount}`;
      params.push(order_type);
      paramCount++;
    }
    
    query += ' ORDER BY order_date DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } else {
    const db = readLocalData();
    let orders = db.orders || [];
    
    if (customer_id) {
      orders = orders.filter(order => order.customer_id == customer_id);
    }
    if (start_date) {
      orders = orders.filter(order => order.order_date >= start_date);
    }
    if (end_date) {
      orders = orders.filter(order => order.order_date <= end_date);
    }
    if (order_type) {
      orders = orders.filter(order => order.order_type === order_type);
    }
    
    // 為每個訂單添加客戶資訊
    const ordersWithCustomerInfo = orders.map(order => {
      const customer = db.customers.find(c => c.id === order.customer_id);
      return {
        ...order,
        customer_name: customer ? customer.name : (order.customer_name || '未知客戶'),
        phone: customer ? customer.phone : '',
        address: customer ? customer.address : '',
        family_mart_address: customer ? customer.family_mart_address : '',
        source: customer ? customer.source : '',
        payment_method: customer ? customer.payment_method : '',
        order_number: customer ? customer.order_number : order.order_number || ''
      };
    });
    
    ordersWithCustomerInfo.sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
    res.json(ordersWithCustomerInfo);
  }
});

// 出貨管理 API
app.get('/api/orders/delivery/:date', async (req, res) => {
  const { date } = req.params;
  if (usePostgres) {
    const { rows } = await pool.query('SELECT * FROM orders WHERE delivery_date = $1', [date]);
    res.json(rows);
  } else {
    const db = readLocalData();
    const orders = db.orders.filter(order => order.delivery_date === date);
    res.json(orders);
  }
});

app.put('/api/orders/:id/shipping-status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (usePostgres) {
    await pool.query('UPDATE orders SET shipping_status = $1 WHERE id = $2', [status, id]);
    res.json({ success: true });
  } else {
    const db = readLocalData();
    const orderIndex = db.orders.findIndex(o => o.id == id);
    if (orderIndex !== -1) {
      db.orders[orderIndex].shipping_status = status;
      writeLocalData(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  }
});

app.get('/api/orders/shipping-weekly/:date', async (req, res) => {
  const { date } = req.params;
  if (usePostgres) {
    const { rows } = await pool.query('SELECT * FROM orders WHERE delivery_date >= $1 AND delivery_date <= $2', [date, date]);
    res.json(rows);
  } else {
    const db = readLocalData();
    const orders = db.orders.filter(order => order.delivery_date === date);
    res.json(orders);
  }
});

// 客戶 CRUD API
app.put('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  const updatedCustomer = req.body;
  
  if (usePostgres) {
    await pool.query('UPDATE customers SET data = $1 WHERE id = $2', [JSON.stringify(updatedCustomer), id]);
    res.json({ success: true });
  } else {
    const db = readLocalData();
    const customerIndex = db.customers.findIndex(c => c.id == id);
    if (customerIndex !== -1) {
      db.customers[customerIndex] = { ...db.customers[customerIndex], ...updatedCustomer };
      writeLocalData(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  const { id } = req.params;
  
  if (usePostgres) {
    await pool.query('DELETE FROM customers WHERE id = $1', [id]);
    res.json({ success: true });
  } else {
    const db = readLocalData();
    db.customers = db.customers.filter(c => c.id != id);
    writeLocalData(db);
    res.json({ success: true });
  }
});

// 訂單 CRUD API
app.get('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  
  if (usePostgres) {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } else {
    const db = readLocalData();
    const order = db.orders.find(o => o.id == id);
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  }
});

app.put('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  const updatedOrder = req.body;
  
  if (usePostgres) {
    await pool.query('UPDATE orders SET data = $1 WHERE id = $2', [JSON.stringify(updatedOrder), id]);
    res.json({ success: true });
  } else {
    const db = readLocalData();
    const orderIndex = db.orders.findIndex(o => o.id == id);
    if (orderIndex !== -1) {
      db.orders[orderIndex] = { ...db.orders[orderIndex], ...updatedOrder };
      writeLocalData(db);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  
  if (usePostgres) {
    await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    res.json({ success: true });
  } else {
    const db = readLocalData();
    db.orders = db.orders.filter(o => o.id != id);
    writeLocalData(db);
    res.json({ success: true });
  }
});

// 庫存異動管理 API
app.delete('/api/inventory/transaction/:id', async (req, res) => {
  const { id } = req.params;
  
  if (usePostgres) {
    await pool.query('DELETE FROM inventory_transactions WHERE id = $1', [id]);
    res.json({ success: true });
  } else {
    const db = readLocalData();
    if (db.inventory_transactions) {
      db.inventory_transactions = db.inventory_transactions.filter(t => t.id != id);
      writeLocalData(db);
    }
    res.json({ success: true });
  }
});

app.delete('/api/inventory/transactions/reset', async (req, res) => {
  if (usePostgres) {
    await pool.query('DELETE FROM inventory_transactions');
    res.json({ success: true });
  } else {
    const db = readLocalData();
    db.inventory_transactions = [];
    writeLocalData(db);
    res.json({ success: true });
  }
});

// 排程確認 API
app.post('/api/scheduling/confirm', async (req, res) => {
  try {
    const { orderIds, selectedDate, manufacturingDate, manufacturingQuantities } = req.body;
    console.log('🚀 [Confirm] 開始排程:', { orderIds, selectedDate, manufacturingDate, manufacturingQuantities });

    if (!orderIds?.length) {
      return res.status(400).json({ success: false, message: '請選擇要排程的訂單' });
    }
    if (!manufacturingDate) {
      return res.status(400).json({ success: false, message: '請選擇製造日期' });
    }

    if (usePostgres) {
      // PostgreSQL 版本 - 簡化實現
      const masterSchedule = {
        id: `schedule_${Date.now()}`,
        production_date: manufacturingDate, // 使用製造日期
        scheduled_items: Object.entries(manufacturingQuantities).map(([productName, qty]) => ({
          product_name: productName,
          scheduled_quantity: Number(qty) || 0,
          completed_quantity: 0,
          status: 'scheduled'
        })),
        merged_orders: orderIds,
        status: 'scheduled',
        scheduling_status: 'scheduled',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      await pool.query('INSERT INTO orders (data) VALUES ($1)', [JSON.stringify(masterSchedule)]);
      
      res.json({
        success: true,
        message: `已建立主排程單，製造日期：${manufacturingDate}`,
        schedule_id: masterSchedule.id,
        merged_orders: orderIds.length
      });
    } else {
      // 本地 JSON 版本
      const db = readLocalData();
      if (!db.orders) db.orders = [];

      // 清除同日期舊主排程單（防止重複）
      const oldSchedules = db.orders.filter(
        o =>
          o.production_date === manufacturingDate &&
          Array.isArray(o.merged_orders) &&
          o.merged_orders.length > 0 &&
          !o.linked_schedule_id
      );

      if (oldSchedules.length > 0) {
        console.log(`🧹 [Confirm] 清除 ${oldSchedules.length} 筆舊主排程 (${manufacturingDate})`);
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
        production_date: manufacturingDate, // 使用製造日期
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
      writeLocalData(db);

      console.log(`✅ [Confirm] 已建立主排程 ${masterSchedule.id}`);

      res.json({
        success: true,
        message: `已建立主排程單，製造日期：${manufacturingDate}`,
        schedule_id: masterSchedule.id,
        merged_orders: orderIds.length
      });
    }
  } catch (err) {
    console.error('❌ [Confirm] 排程錯誤:', err);
    res.status(500).json({ success: false, message: '排程失敗', error: err.message });
  }
});

// 排程完成 API
app.post('/api/scheduling/complete', async (req, res) => {
  try {
    const { orderId, completedQuantities } = req.body;
    console.log('✅ [Complete] 完成排程:', { orderId, completedQuantities });

    if (usePostgres) {
      // PostgreSQL 版本 - 簡化實現
      res.json({ success: true, message: '排程完成' });
    } else {
      // 本地 JSON 版本
      const db = readLocalData();
      const order = db.orders.find(o => o.id === orderId);
      
      if (order) {
        order.status = 'completed';
        order.completed_at = new Date().toISOString();
        
        // 更新完成數量
        if (order.scheduled_items && completedQuantities) {
          order.scheduled_items.forEach(item => {
            if (completedQuantities[item.product_name]) {
              item.completed_quantity = completedQuantities[item.product_name];
              item.status = 'completed';
            }
          });
        }
        
        writeLocalData(db);
        res.json({ success: true, message: '排程完成' });
      } else {
        res.status(404).json({ success: false, message: '找不到訂單' });
      }
    }
  } catch (err) {
    console.error('❌ [Complete] 完成排程錯誤:', err);
    res.status(500).json({ success: false, message: '完成排程失敗', error: err.message });
  }
});

// 刪除排程 API
app.delete('/api/scheduling/delete/:date', async (req, res) => {
  try {
    const { date } = req.params;
    console.log('🗑️ [Delete] 刪除排程:', date);

    if (usePostgres) {
      // PostgreSQL 版本 - 簡化實現
      res.json({ success: true, message: '排程已刪除' });
    } else {
      // 本地 JSON 版本
      const db = readLocalData();
      
      // 刪除指定日期的排程
      const originalLength = db.orders.length;
      db.orders = db.orders.filter(order => 
        !(order.production_date === date && 
          Array.isArray(order.merged_orders) && 
          order.merged_orders.length > 0)
      );
      
      const deletedCount = originalLength - db.orders.length;
      writeLocalData(db);
      
      res.json({ 
        success: true, 
        message: `已刪除 ${deletedCount} 個排程`,
        deleted_count: deletedCount
      });
    }
  } catch (err) {
    console.error('❌ [Delete] 刪除排程錯誤:', err);
    res.status(500).json({ success: false, message: '刪除排程失敗', error: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
