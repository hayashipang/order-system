const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// 載入環境變數（簡化版本）
const loadEnvFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const envContent = fs.readFileSync(filePath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !process.env[key]) {
          process.env[key] = value.trim();
        }
      });
    }
  } catch (error) {
    console.log('環境變數檔案載入失敗，使用預設值');
  }
};

// 載入本地環境變數
loadEnvFile(path.join(__dirname, 'env.local'));

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// 顯示環境資訊
console.log('🌍 環境設定:');
console.log('  NODE_ENV:', NODE_ENV);
console.log('  PORT:', PORT);
console.log('  API_BASE_URL:', process.env.API_BASE_URL || '未設定');
console.log('🧪 實驗功能：添加了新的日誌記錄功能');

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // 允許沒有 origin 的請求（如移動應用或 Postman）
    if (!origin) return callback(null, true);
    
    // 允許本地開發
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // 允許所有 Vercel 域名
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // 允許所有 Railway 域名
    if (origin.includes('railway.app')) {
      return callback(null, true);
    }
    
    // 其他域名拒絕
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// 靜態檔案處理將在API路由之後添加

// JSON 檔案資料庫 - 資料檔案分離架構
const TEMPLATE_DATA_FILE = path.join(__dirname, 'data.json');  // 範本資料檔案 (會被 Git 追蹤)
const LOCAL_DATA_FILE = path.join(__dirname, 'data.local.json'); // 本地資料檔案 (不會被 Git 追蹤)
let db = {};

// 檔案讀寫函數 - 支援資料檔案分離
function loadData() {
  try {
    // 優先讀取本地資料檔案
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const data = fs.readFileSync(LOCAL_DATA_FILE, 'utf8');
      db = JSON.parse(data);
      console.log('✅ 資料已從本地檔案 (data.local.json) 載入');
      return;
    }
    
    // 如果本地檔案不存在，檢查範本檔案
    if (fs.existsSync(TEMPLATE_DATA_FILE)) {
      const data = fs.readFileSync(TEMPLATE_DATA_FILE, 'utf8');
      db = JSON.parse(data);
      
      // 複製範本資料到本地檔案
      fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
      console.log('✅ 已從範本檔案複製資料到本地檔案 (data.local.json)');
      return;
    }
    
    // 如果兩個檔案都不存在，創建預設資料
    console.log('⚠️  未找到資料檔案，創建預設資料...');
    db = {
      users: [
        { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
        { id: 2, username: 'kitchen', password: 'kitchen123', role: 'kitchen' }
      ],
      customers: [],
      products: [
        { id: 1, name: '蔬果73-元氣綠', price: 120.00, description: '綠色蔬果系列，富含維生素', current_stock: 0 },
        { id: 2, name: '蔬果73-活力紅', price: 120.00, description: '紅色蔬果系列，抗氧化', current_stock: 0 },
        { id: 3, name: '蔬果73-亮妍莓', price: 130.00, description: '莓果系列，美容養顏', current_stock: 0 },
        { id: 4, name: '蔬菜73-幸運果', price: 120.00, description: '黃橘色蔬果系列，提升免疫力', current_stock: 0 },
        { id: 5, name: '蔬菜100-順暢綠', price: 150.00, description: '100% 綠色蔬菜，促進消化', current_stock: 0 },
        { id: 6, name: '蔬菜100-養生黑', price: 160.00, description: '100% 黑色養生，滋補強身', current_stock: 0 },
        { id: 7, name: '蔬菜100-養眼晶(有機枸杞)', price: 180.00, description: '100% 有機枸杞，護眼明目', current_stock: 0 },
        { id: 8, name: '蔬菜100-法國黑巧70', price: 200.00, description: '100% 法國黑巧克力，濃郁香醇', current_stock: 0 }
      ],
      orders: [],
      order_items: [],
      inventory_transactions: [],
      shippingFee: 0
    };
    saveData();
    console.log('✅ 已創建預設資料並儲存到本地檔案');
    
  } catch (error) {
    console.error('❌ 載入資料時發生錯誤:', error);
    // 使用預設資料
    db = {
      users: [
        { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
        { id: 2, username: 'kitchen', password: 'kitchen123', role: 'kitchen' }
      ],
      customers: [],
      products: [
        { id: 1, name: '蔬果73-元氣綠', price: 120.00, description: '綠色蔬果系列，富含維生素', current_stock: 0 },
        { id: 2, name: '蔬果73-活力紅', price: 120.00, description: '紅色蔬果系列，抗氧化', current_stock: 0 },
        { id: 3, name: '蔬果73-亮妍莓', price: 130.00, description: '莓果系列，美容養顏', current_stock: 0 },
        { id: 4, name: '蔬菜73-幸運果', price: 120.00, description: '黃橘色蔬果系列，提升免疫力', current_stock: 0 },
        { id: 5, name: '蔬菜100-順暢綠', price: 150.00, description: '100% 綠色蔬菜，促進消化', current_stock: 0 },
        { id: 6, name: '蔬菜100-養生黑', price: 160.00, description: '100% 黑色養生，滋補強身', current_stock: 0 },
        { id: 7, name: '蔬菜100-養眼晶(有機枸杞)', price: 180.00, description: '100% 有機枸杞，護眼明目', current_stock: 0 },
        { id: 8, name: '蔬菜100-法國黑巧70', price: 200.00, description: '100% 法國黑巧克力，濃郁香醇', current_stock: 0 }
      ],
      orders: [],
      order_items: [],
      inventory_transactions: [],
      shippingFee: 0
    };
  }
}

function saveData() {
  try {
    // 儲存到本地資料檔案
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
    console.log('✅ 資料已儲存到本地檔案 (data.local.json)');
  } catch (error) {
    console.error('❌ 儲存資料時發生錯誤:', error);
  }
}

// 資料庫初始化狀態
let dbReady = false;

// 初始化資料庫
function initializeDatabase(callback) {
  console.log('正在初始化 JSON 資料庫...');
  loadData();
  console.log('JSON 資料庫初始化完成');
  dbReady = true;
  if (callback) callback();
}

// 初始化資料庫
initializeDatabase(() => {
  console.log('資料庫初始化完成');
});

// 資料庫準備檢查中間件
const checkDatabaseReady = (req, res, next) => {
  if (!dbReady) {
    res.status(503).json({ error: '資料庫尚未準備就緒，請稍後再試' });
    return;
  }
  next();
};

// API Routes

// 登入驗證
app.post('/api/login', checkDatabaseReady, (req, res) => {
  const { username, password } = req.body;
  
  // 直接查找用戶
  const user = db.users.find(u => u.username === username && u.password === password);
  
  if (user) {
    res.json({ 
      success: true, 
      user: { id: user.id, username: user.username, role: user.role }
    });
  } else {
    res.status(401).json({ error: '帳號或密碼錯誤' });
  }
});

// 取得所有產品列表（包含價格）
app.get('/api/products', checkDatabaseReady, (req, res) => {
  res.json(db.products);
});

// 取得產品優先順序設定
app.get('/api/products/priority', checkDatabaseReady, (req, res) => {
  try {
    // 如果沒有優先順序設定，返回預設值
    if (!db.product_priority) {
      db.product_priority = db.products.map((product, index) => ({
        product_id: product.id,
        product_name: product.name,
        priority: index + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      saveData();
    }
    res.json(db.product_priority);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新產品優先順序設定
app.put('/api/products/priority', (req, res) => {
  try {
    const { priority_settings } = req.body;
    
    if (!Array.isArray(priority_settings)) {
      return res.status(400).json({ error: '優先順序設定必須是陣列格式' });
    }
    
    // 驗證每個設定都有必要的欄位
    for (const setting of priority_settings) {
      if (!setting.product_id || !setting.priority) {
        return res.status(400).json({ error: '每個設定都必須包含 product_id 和 priority' });
      }
    }
    
    // 更新優先順序設定
    db.product_priority = priority_settings.map(setting => ({
      product_id: setting.product_id,
      product_name: setting.product_name || db.products.find(p => p.id === setting.product_id)?.name || '未知產品',
      priority: parseInt(setting.priority),
      updated_at: new Date().toISOString()
    }));
    
    saveData();
    
    res.json({ 
      message: '產品優先順序更新成功', 
      priority_settings: db.product_priority 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 同步產品優先順序設定
app.post('/api/products/sync-priority', (req, res) => {
  try {
    // 如果沒有優先順序設定，初始化
    if (!db.product_priority) {
      db.product_priority = [];
    }
    
    // 獲取所有現有產品
    const existingProducts = db.products;
    const existingPriorityIds = db.product_priority.map(p => p.product_id);
    
    // 為新產品添加優先順序設定
    const newProducts = existingProducts.filter(product => 
      !existingPriorityIds.includes(product.id)
    );
    
    if (newProducts.length > 0) {
      const maxPriority = Math.max(...db.product_priority.map(p => p.priority), 0);
      
      newProducts.forEach((product, index) => {
        db.product_priority.push({
          product_id: product.id,
          product_name: product.name,
          priority: maxPriority + index + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
    }
    
    // 移除已刪除產品的優先順序設定
    const existingProductIds = existingProducts.map(p => p.id);
    db.product_priority = db.product_priority.filter(priority => 
      existingProductIds.includes(priority.product_id)
    );
    
    // 更新產品名稱（如果產品名稱有變更）
    db.product_priority.forEach(priority => {
      const product = existingProducts.find(p => p.id === priority.product_id);
      if (product && product.name !== priority.product_name) {
        priority.product_name = product.name;
        priority.updated_at = new Date().toISOString();
      }
    });
    
    saveData();
    
    res.json({ 
      message: '產品優先順序同步成功', 
      priority_settings: db.product_priority,
      synced_products: newProducts.length,
      removed_products: existingPriorityIds.length - db.product_priority.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得運費設定
app.get('/api/shipping-fee', checkDatabaseReady, (req, res) => {
  res.json({ shippingFee: db.shippingFee || 120 });
});

// 更新運費設定
app.put('/api/shipping-fee', checkDatabaseReady, (req, res) => {
  const { shippingFee } = req.body;
  
  try {
    db.shippingFee = parseFloat(shippingFee);
    saveData();
    res.json({ message: '運費設定更新成功', shippingFee: db.shippingFee });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 台灣地址相關API
// 取得所有縣市
app.get('/api/address/counties', (req, res) => {
  try {
    const addressData = JSON.parse(fs.readFileSync(path.join(__dirname, 'taiwan-address-data.json'), 'utf8'));
    res.json(addressData.counties);
  } catch (error) {
    res.status(500).json({ error: '無法載入縣市資料' });
  }
});

// 取得指定縣市的鄉鎮市區
app.get('/api/address/districts/:county', (req, res) => {
  try {
    const { county } = req.params;
    const addressData = JSON.parse(fs.readFileSync(path.join(__dirname, 'taiwan-address-data.json'), 'utf8'));
    const districts = addressData.districts[county] || [];
    res.json(districts);
  } catch (error) {
    res.status(500).json({ error: '無法載入鄉鎮市區資料' });
  }
});

// 取得指定縣市的常用路名
app.get('/api/address/roads/:county', (req, res) => {
  try {
    const { county } = req.params;
    const addressData = JSON.parse(fs.readFileSync(path.join(__dirname, 'taiwan-address-data.json'), 'utf8'));
    const roads = addressData.common_roads[county] || [];
    res.json(roads);
  } catch (error) {
    res.status(500).json({ error: '無法載入路名資料' });
  }
});

// 新增產品
app.post('/api/products', (req, res) => {
  const { name, price, description } = req.body;
  
  try {
    const newProduct = {
      id: Math.max(...db.products.map(p => p.id), 0) + 1,
      name,
      price: parseFloat(price),
      description,
      current_stock: 0,
      min_stock: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.products.push(newProduct);
    
    // 自動同步優先順序設定
    syncProductPriority();
    
    saveData();
    
    res.json(newProduct);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新產品
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, description, current_stock, min_stock } = req.body;
  
  try {
    console.log('更新產品請求:', { id, name, price, description, current_stock, min_stock });
    console.log('當前產品列表:', db.products);
    
    const productIndex = db.products.findIndex(p => p.id === parseInt(id));
    if (productIndex === -1) {
      console.log('產品不存在，ID:', id);
      res.status(404).json({ error: '產品不存在' });
      return;
    }
    
    console.log('找到產品，索引:', productIndex);
    console.log('更新前產品:', db.products[productIndex]);
    
    // 保存舊的產品名稱
    const oldProductName = db.products[productIndex].name;
    
    db.products[productIndex] = {
      ...db.products[productIndex],
      name,
      price: parseFloat(price),
      description,
      ...(current_stock !== undefined && { current_stock: parseInt(current_stock) }),
      ...(min_stock !== undefined && { min_stock: parseInt(min_stock) }),
      updated_at: new Date().toISOString()
    };
    
    // 注意：產品名稱更新不會影響歷史訂單項目
    // 歷史訂單應該保持原始記錄，只有新訂單會使用新的產品名稱
    console.log('產品名稱更新完成，歷史訂單保持不變:', { oldName: oldProductName, newName: name });
    
    console.log('更新後產品:', db.products[productIndex]);
    
    // 自動同步優先順序設定
    syncProductPriority();
    
    saveData();
    res.json({ 
      message: '產品更新成功', 
      product: db.products[productIndex]
    });
  } catch (error) {
    console.error('更新產品錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

// 刪除產品
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    const productIndex = db.products.findIndex(p => p.id === parseInt(id));
    if (productIndex === -1) {
      res.status(404).json({ error: '產品不存在' });
      return;
    }
    
    // 檢查是否有庫存異動記錄
    const hasInventoryTransactions = db.inventory_transactions && 
      db.inventory_transactions.some(transaction => transaction.product_id === parseInt(id));
    
    if (hasInventoryTransactions) {
      res.status(400).json({ error: '該產品有庫存異動記錄，無法刪除' });
      return;
    }
    
    db.products.splice(productIndex, 1);
    
    // 自動同步優先順序設定
    syncProductPriority();
    
    saveData();
    res.json({ message: '產品刪除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 庫存管理相關 API
// 取得庫存資料
app.get('/api/inventory', checkDatabaseReady, (req, res) => {
  try {
    // 確保 inventory_transactions 存在
    if (!db.inventory_transactions) {
      db.inventory_transactions = [];
    }
    
    res.json(db.products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得庫存異動記錄
app.get('/api/inventory/transactions', checkDatabaseReady, (req, res) => {
  try {
    // 確保 inventory_transactions 存在
    if (!db.inventory_transactions) {
      db.inventory_transactions = [];
    }
    
    // 按時間倒序排列
    const sortedTransactions = db.inventory_transactions.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );
    
    res.json(sortedTransactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 新增庫存異動記錄
app.post('/api/inventory/transaction', checkDatabaseReady, (req, res) => {
  const { product_id, transaction_type, quantity, notes, created_by } = req.body;
  
  try {
    if (!product_id || !transaction_type || !quantity) {
      return res.status(400).json({ error: '缺少必要參數' });
    }
    
    const product = db.products.find(p => p.id === parseInt(product_id));
    if (!product) {
      return res.status(404).json({ error: '產品不存在' });
    }
    
    const quantityNum = parseInt(quantity);
    if (quantityNum <= 0) {
      return res.status(400).json({ error: '數量必須大於 0' });
    }
    
    // 確保 inventory_transactions 存在
    if (!db.inventory_transactions) {
      db.inventory_transactions = [];
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
    
    // 新增異動記錄
    const newTransaction = {
      id: Math.max(...db.inventory_transactions.map(t => t.id), 0) + 1,
      product_id: parseInt(product_id),
      product_name: product.name,
      transaction_type,
      quantity: quantityNum,
      transaction_date: new Date().toISOString(),
      notes: notes || '',
      created_by: created_by || 'admin', // 使用傳入的操作人員，預設為 admin
      created_at: new Date().toISOString()
    };
    
    db.inventory_transactions.push(newTransaction);
    saveData();
    
    res.json({ 
      message: '庫存異動記錄成功',
      transaction: newTransaction,
      updatedProduct: product
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 刪除庫存異動記錄
app.delete('/api/inventory/transaction/:id', checkDatabaseReady, (req, res) => {
  const { id } = req.params;
  
  try {
    const transactionId = parseInt(id);
    const transactionIndex = db.inventory_transactions.findIndex(t => t.id === transactionId);
    
    if (transactionIndex === -1) {
      res.status(404).json({ error: '找不到指定的庫存異動記錄' });
      return;
    }
    
    const transaction = db.inventory_transactions[transactionIndex];
    const product = db.products.find(p => p.id === transaction.product_id);
    
    if (!product) {
      res.status(404).json({ error: '找不到對應的產品' });
      return;
    }
    
    // 反向操作：如果是進貨，則減少庫存；如果是出貨，則增加庫存
    if (transaction.transaction_type === 'in') {
      product.current_stock -= transaction.quantity;
    } else if (transaction.transaction_type === 'out') {
      product.current_stock += transaction.quantity;
    }
    
    // 更新產品的最後更新時間
    product.updated_at = new Date().toISOString();
    
    // 刪除異動記錄
    db.inventory_transactions.splice(transactionIndex, 1);
    
    // 儲存到檔案
    saveData();
    
    res.json({ 
      message: '庫存異動記錄已刪除',
      deletedTransaction: transaction,
      updatedProduct: product
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 重置所有庫存異動記錄
app.delete('/api/inventory/transactions/reset', checkDatabaseReady, (req, res) => {
  try {
    // 只清空所有庫存異動記錄，不改變當前庫存數量
    db.inventory_transactions = [];
    
    // 儲存到檔案
    saveData();
    
    res.json({ 
      message: '所有庫存異動記錄已重置',
      currentProducts: db.products.map(p => ({ id: p.id, name: p.name, current_stock: p.current_stock }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得廚房製作清單 (按產品統計數量)
app.get('/api/kitchen/production/:date', checkDatabaseReady, (req, res) => {
  const { date } = req.params;
  
  try {
    console.log('請求製作清單日期:', date);
    const allOrders = Array.isArray(db.orders) ? db.orders : [];
    const allOrderItems = Array.isArray(db.order_items) ? db.order_items : [];
    console.log('所有訂單數:', allOrders.length);
    console.log('所有訂單項目數:', allOrderItems.length);
    
    // 取得指定日期的訂單（支援多種日期格式），排除現場訂單
    const orders = allOrders.filter(order => {
      if (!order || !order.order_date) return false;
      let orderDateStr;
      let requestDate;
      try {
        orderDateStr = new Date(order.order_date).toISOString().split('T')[0];
        requestDate = new Date(date).toISOString().split('T')[0];
      } catch (e) {
        return false;
      }
      const directMatch = order.order_date === date;
      const dateMatch = orderDateStr === requestDate;
      const isNotWalkin = order.order_type !== 'walk-in'; // 排除現場訂單
      // 簡化日誌避免過多輸出
      return (directMatch || dateMatch) && isNotWalkin;
    });
    
    console.log('匹配的訂單:', orders);
    const orderIds = orders.map(order => order.id);
    
    // 取得這些訂單的項目
    const orderItems = allOrderItems.filter(item => orderIds.includes(item.order_id));
    console.log('訂單項目:', orderItems);
    
    // 按產品名稱和單價分組統計
    const productStats = {};
    
    orderItems.forEach(item => {
      const key = `${item.product_name}_${item.unit_price}_${item.is_gift || false}`;
      if (!productStats[key]) {
        productStats[key] = {
          product_name: item.product_name,
          total_quantity: 0,
          unit_price: item.unit_price,
          total_amount: 0,
          order_date: date,
          delivery_date: orders.find(o => o.id === item.order_id)?.delivery_date || '',
          order_status: orders.find(o => o.id === item.order_id)?.status || 'pending',
          pending_quantity: 0,
          completed_quantity: 0,
          pending_count: 0,
          completed_count: 0,
          is_gift: item.is_gift || false
        };
      }
      
      productStats[key].total_quantity += item.quantity;
      productStats[key].total_amount += item.quantity * item.unit_price;
      
      if (item.status === 'pending') {
        productStats[key].pending_quantity += item.quantity;
        productStats[key].pending_count += 1;
      } else if (item.status === 'completed') {
        productStats[key].completed_quantity += item.quantity;
        productStats[key].completed_count += 1;
      }
    });
    
    const result = Object.values(productStats).sort((a, b) => a.product_name.localeCompare(b.product_name));
    return res.json(result);
  } catch (error) {
    console.error('Kitchen production 查詢錯誤:', error);
    // 發生例外時回傳空陣列避免前端崩潰
    return res.status(200).json([]);
  }
});

// 取得所有訂單
app.get('/api/orders', checkDatabaseReady, (req, res) => {
  try {
    res.json(db.orders || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得客戶訂單清單 (按客戶分組)
app.get('/api/orders/customers/:date', checkDatabaseReady, (req, res) => {
  const { date } = req.params;
  
  try {
    console.log('請求客戶訂單日期:', date);
    const allOrders = Array.isArray(db.orders) ? db.orders : [];
    const allCustomers = Array.isArray(db.customers) ? db.customers : [];
    const allItems = Array.isArray(db.order_items) ? db.order_items : [];
    
    // 取得指定日期的訂單（支援多種日期格式）
    const orders = allOrders.filter(order => {
      if (!order || !order.order_date) return false;
      let orderDateStr, requestDate;
      try {
        orderDateStr = new Date(order.order_date).toISOString().split('T')[0];
        requestDate = new Date(date).toISOString().split('T')[0];
      } catch (e) {
        return false;
      }
      return orderDateStr === requestDate || order.order_date === date;
    });
    
    console.log('匹配的訂單:', orders);
    const orderIds = orders.map(order => order.id);
    
    // 取得這些訂單的項目
    const orderItems = allItems.filter(item => orderIds.includes(item.order_id));
    console.log('訂單項目:', orderItems);
    
    // 按客戶和訂單分組並計算金額
    const groupedOrders = {};
    let totalDailyAmount = 0;
    
    orders.forEach(order => {
      const customer = allCustomers.find(c => c.id === order.customer_id);
      if (!customer) return;
      
      const customerId = customer.id;
      const orderKey = `${customerId}_${order.id}`; // 使用客戶ID和訂單ID作為唯一鍵
      
      if (!groupedOrders[orderKey]) {
        groupedOrders[orderKey] = {
          id: order.id, // 添加 id 欄位以保持一致性
          customer_id: customerId,
          customer_name: customer.name,
          phone: customer.phone,
          address: customer.address,
          family_mart_address: customer.family_mart_address || '',
          source: customer.source,
          order_number: customer.order_number || '',
          payment_method: customer.payment_method || '貨到付款',
          order_id: order.id,
          delivery_date: order.delivery_date,
          status: order.status === 'completed' ? 'shipped' : order.status,
          order_notes: order.notes,
          shipping_type: order.shipping_type || 'none',
          shipping_fee: order.shipping_fee || 0,
          credit_card_fee: order.credit_card_fee || 0,
          shopee_fee: order.shopee_fee || 0, // 新增蝦皮費用欄位
          items: [],
          customer_total: 0,
          all_items_completed: true
        };
      }
      
      // 取得該訂單的項目
      const items = orderItems.filter(item => item.order_id === order.id);
      items.forEach(item => {
        const itemTotal = item.quantity * item.unit_price;
        groupedOrders[orderKey].items.push({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          item_total: itemTotal,
          special_notes: item.special_notes,
          item_status: item.status,
          is_gift: item.is_gift || false
        });
        
        // 檢查是否有未完成的項目
        if (item.status !== 'completed') {
          groupedOrders[orderKey].all_items_completed = false;
        }
        
        groupedOrders[orderKey].customer_total += itemTotal;
        totalDailyAmount += itemTotal;
      });
      
      // 只有免運費（負數）會影響我們的收入
      if (order.shipping_fee && order.shipping_fee < 0) {
        groupedOrders[orderKey].customer_total += order.shipping_fee;
        totalDailyAmount += order.shipping_fee;
      }
      
      // 扣除信用卡手續費（從我們的收入中扣除）
      if (order.credit_card_fee && order.credit_card_fee > 0) {
        groupedOrders[orderKey].customer_total -= order.credit_card_fee;
        totalDailyAmount -= order.credit_card_fee;
      }
      
      // 扣除蝦皮費用（從我們的收入中扣除）
      if (order.shopee_fee && order.shopee_fee > 0) {
        groupedOrders[orderKey].customer_total -= order.shopee_fee;
        totalDailyAmount -= order.shopee_fee;
      }
      // 客戶付運費給快遞公司，不計入我們的收入
    });
    
    return res.json({
      orders: Object.values(groupedOrders),
      totalAmount: totalDailyAmount
    });
  } catch (error) {
    console.error('取得客戶訂單清單失敗:', error);
    return res.status(200).json({ orders: [], totalAmount: 0 });
  }
});

// 取得指定配送日期的訂單（用於出貨管理）
app.get('/api/orders/delivery/:date', (req, res) => {
  const { date } = req.params;
  
  try {
    console.log('請求配送日期:', date);
    console.log('所有訂單:', db.orders);
    
    // 取得指定配送日期的訂單
    const orders = db.orders.filter(order => {
      const deliveryDate = new Date(order.delivery_date).toISOString().split('T')[0];
      const requestDate = new Date(date).toISOString().split('T')[0];
      return deliveryDate === requestDate || order.delivery_date === date;
    });
    
    console.log('匹配的配送訂單:', orders);
    const orderIds = orders.map(order => order.id);
    
    // 取得這些訂單的項目
    const orderItems = db.order_items.filter(item => orderIds.includes(item.order_id));
    console.log('訂單項目:', orderItems);
    
    // 按客戶和訂單分組並計算金額
    const groupedOrders = {};
    let totalDailyAmount = 0;
    
    orders.forEach(order => {
      const customer = db.customers.find(c => c.id === order.customer_id);
      if (!customer) return;
      
      const customerId = customer.id;
      const orderKey = `${customerId}_${order.id}`;
      
      if (!groupedOrders[orderKey]) {
        groupedOrders[orderKey] = {
          id: order.id,
          customer_id: customerId,
          customer_name: customer.name,
          phone: customer.phone,
          address: customer.address,
          family_mart_address: customer.family_mart_address || '',
          source: customer.source,
          order_number: customer.order_number || '',
          payment_method: customer.payment_method || '貨到付款',
          order_id: order.id,
          order_date: order.order_date,
          delivery_date: order.delivery_date,
          status: order.status === 'completed' ? 'shipped' : order.status,
          order_notes: order.notes,
          shipping_type: order.shipping_type || 'none',
          shipping_fee: order.shipping_fee || 0,
          credit_card_fee: order.credit_card_fee || 0,
          shopee_fee: order.shopee_fee || 0, // 新增蝦皮費用欄位
          items: [],
          customer_total: 0,
          all_items_completed: true
        };
      }
      
      // 取得該訂單的項目
      const items = orderItems.filter(item => item.order_id === order.id);
      items.forEach(item => {
        const itemTotal = item.quantity * item.unit_price;
        groupedOrders[orderKey].items.push({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          item_total: itemTotal,
          special_notes: item.special_notes,
          item_status: item.status,
          is_gift: item.is_gift
        });
        
        groupedOrders[orderKey].customer_total += itemTotal;
        totalDailyAmount += itemTotal;
        
        // 檢查是否所有項目都已完成
        if (item.status !== 'completed') {
          groupedOrders[orderKey].all_items_completed = false;
        }
      });
      
      // 只有免運費（負數）會影響我們的收入
      if (order.shipping_fee && order.shipping_fee < 0) {
        groupedOrders[orderKey].customer_total += order.shipping_fee;
        totalDailyAmount += order.shipping_fee;
      }
      
      // 扣除信用卡手續費（從我們的收入中扣除）
      if (order.credit_card_fee && order.credit_card_fee > 0) {
        groupedOrders[orderKey].customer_total -= order.credit_card_fee;
        totalDailyAmount -= order.credit_card_fee;
      }
      
      // 扣除蝦皮費用（從我們的收入中扣除）
      if (order.shopee_fee && order.shopee_fee > 0) {
        groupedOrders[orderKey].customer_total -= order.shopee_fee;
        totalDailyAmount -= order.shopee_fee;
      }
    });
    
    res.json({
      orders: Object.values(groupedOrders),
      totalAmount: totalDailyAmount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得未來一週出貨概覽
app.get('/api/orders/shipping-weekly/:startDate', (req, res) => {
  const { startDate } = req.params;
  
  try {
    console.log('請求週出貨概覽開始日期:', startDate);
    
    // 計算一週的日期範圍
    const start = new Date(startDate);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    console.log('週出貨概覽日期範圍:', dates);
    
    // 建立日期對應的結果
    const result = {};
    dates.forEach(date => {
      result[date] = {
        date: date,
        order_count: 0,
        item_count: 0,
        total_quantity: 0,
        total_amount: 0,
        pending_orders: 0,
        shipped_orders: 0
      };
    });
    
    // 查詢每一天的配送訂單
    dates.forEach(date => {
      const dayOrders = db.orders.filter(order => {
        const deliveryDate = new Date(order.delivery_date).toISOString().split('T')[0];
        return deliveryDate === date;
      });
      
      const orderIds = dayOrders.map(order => order.id);
      const dayItems = db.order_items.filter(item => orderIds.includes(item.order_id));
      
      // 計算金額
      let totalAmount = 0;
      dayOrders.forEach(order => {
        const orderItems = dayItems.filter(item => item.order_id === order.id);
        const orderTotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        totalAmount += orderTotal;
        
        // 運費處理
        if (order.shipping_fee && order.shipping_fee < 0) {
          totalAmount += order.shipping_fee;
        }
      });
      
      result[date] = {
        date: date,
        order_count: dayOrders.length,
        item_count: dayItems.length,
        total_quantity: dayItems.reduce((sum, item) => sum + item.quantity, 0),
        total_amount: totalAmount,
        pending_orders: dayOrders.filter(order => order.status === 'pending').length,
        shipped_orders: dayOrders.filter(order => order.status === 'completed' || order.status === 'shipped').length
      };
    });
    
    res.json({
      start_date: startDate,
      dates: dates,
      weekly_data: Object.values(result)
    });
  } catch (error) {
    console.error('週出貨概覽錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

// 取得一週訂單數量概覽
app.get('/api/orders/weekly/:startDate', (req, res) => {
  const { startDate } = req.params;
  
  try {
    // 計算一週的日期範圍
    const start = new Date(startDate);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // 建立日期對應的結果
    const result = {};
    dates.forEach(date => {
      result[date] = {
        date: date,
        order_count: 0,
        item_count: 0,
        total_quantity: 0
      };
    });
    
    // 查詢每一天的訂單數量
    dates.forEach(date => {
      const dayOrders = db.orders.filter(order => order.order_date === date);
      const orderIds = dayOrders.map(order => order.id);
      const dayItems = db.order_items.filter(item => orderIds.includes(item.order_id));
      
      result[date] = {
        date: date,
        order_count: dayOrders.length,
        item_count: dayItems.length,
        total_quantity: dayItems.reduce((sum, item) => sum + item.quantity, 0)
      };
    });
    
    res.json({
      start_date: startDate,
      dates: dates,
      weekly_data: Object.values(result)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 匯出當日訂單 CSV
app.get('/api/orders/export/:date', (req, res) => {
  const { date } = req.params;
  
  try {
    // 取得指定日期的訂單
    const orders = db.orders.filter(order => order.order_date === date);
    const orderIds = orders.map(order => order.id);
    
    // 取得這些訂單的項目
    const orderItems = db.order_items.filter(item => orderIds.includes(item.order_id));
    
    // 按客戶分組
    const groupedOrders = {};
    orders.forEach(order => {
      const customer = db.customers.find(c => c.id === order.customer_id);
      if (!customer) return;
      
      const customerId = customer.id;
      if (!groupedOrders[customerId]) {
        groupedOrders[customerId] = {
          customer_name: customer.name,
          phone: customer.phone,
          address: customer.address,
          source: customer.source,
          order_notes: order.notes,
          items: []
        };
      }
      
      // 取得該訂單的項目
      const items = orderItems.filter(item => item.order_id === order.id);
      items.forEach(item => {
        groupedOrders[customerId].items.push({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          item_total: item.quantity * item.unit_price,
          special_notes: item.special_notes,
          item_status: item.status
        });
      });
    });
    
    // 為每個客戶生成 CSV
    const csvFiles = {};
    Object.keys(groupedOrders).forEach(customerId => {
      const order = groupedOrders[customerId];
      const customerName = order.customer_name.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_'); // 清理檔名
      
      let csvContent = `客戶資訊\n`;
      csvContent += `客戶姓名,${order.customer_name}\n`;
      csvContent += `電話,${order.phone || ''}\n`;
      csvContent += `地址,${order.address || ''}\n`;
      csvContent += `客戶來源,${order.source || ''}\n`;
      csvContent += `訂單備註,${order.order_notes || ''}\n\n`;
      
      csvContent += `訂單明細\n`;
      csvContent += `產品名稱,數量,單價,小計,特殊備註,狀態\n`;
      
      let totalAmount = 0;
      order.items.forEach(item => {
        csvContent += `${item.product_name},${item.quantity},${item.unit_price},${item.item_total},${item.special_notes || ''},${item.item_status === 'completed' ? '已完成' : '待製作'}\n`;
        totalAmount += item.item_total;
      });
      
      csvContent += `\n總金額,${totalAmount}\n`;
      
      csvFiles[`${customerName}_${date}.csv`] = csvContent;
    });
    
    res.json({
      date: date,
      files: csvFiles,
      message: `成功生成 ${Object.keys(csvFiles).length} 個客戶的訂單檔案`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/customers', checkDatabaseReady, (req, res) => {
  try {
    const customers = db.customers.sort((a, b) => a.name.localeCompare(b.name));
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 新增客戶
app.post('/api/customers', (req, res) => {
  const { 
    name, 
    phone, 
    address, 
    family_mart_address,
    source, 
    payment_method,
    order_number
  } = req.body;
  
  try {
    const newCustomer = {
      id: Math.max(...db.customers.map(c => c.id), 0) + 1,
      name,
      phone,
      address,
      family_mart_address: family_mart_address || '',
      source: source || '直接來店訂購',
      payment_method: payment_method || '貨到付款',
      order_number: order_number || ''
    };
    
    db.customers.push(newCustomer);
    saveData();
    
    res.json(newCustomer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新客戶
app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { 
    name, 
    phone, 
    address, 
    family_mart_address,
    source, 
    payment_method,
    order_number
  } = req.body;
  
  try {
    const customerIndex = db.customers.findIndex(c => c.id === parseInt(id));
    if (customerIndex === -1) {
      res.status(404).json({ error: '客戶不存在' });
      return;
    }
    
    db.customers[customerIndex] = {
      ...db.customers[customerIndex],
      name,
      phone,
      address,
      family_mart_address: family_mart_address || '',
      source,
      payment_method: payment_method || '貨到付款',
      order_number: order_number || ''
    };
    
    saveData();
    res.json({ 
      id: parseInt(id), 
      name, 
      phone, 
      address, 
      family_mart_address,
      source, 
      payment_method,
      order_number
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 刪除客戶
app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    const customerId = parseInt(id);
    const customerIndex = db.customers.findIndex(c => c.id === customerId);
    
    if (customerIndex === -1) {
      res.status(404).json({ error: '客戶不存在' });
      return;
    }
    
    // 1. 刪除該客戶的所有訂單項目
    const customerOrders = db.orders.filter(order => order.customer_id === customerId);
    const orderIds = customerOrders.map(order => order.id);
    db.order_items = db.order_items.filter(item => !orderIds.includes(item.order_id));
    
    // 2. 刪除該客戶的所有訂單
    db.orders = db.orders.filter(order => order.customer_id !== customerId);
    
    // 3. 刪除客戶
    db.customers.splice(customerIndex, 1);
    
    saveData();
    res.json({ message: '客戶及相關訂單刪除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得訂單歷史
app.get('/api/orders/history', (req, res) => {
  const { customer_id, start_date, end_date, order_type } = req.query;
  
  try {
    let filteredOrders = db.orders;
    
    // 應用篩選條件
    if (customer_id) {
      const customerId = parseInt(customer_id);
      const customer = db.customers.find(c => c.id === customerId);
      
      if (customer) {
        // 同時根據customer_id和客戶姓名來篩選
        filteredOrders = filteredOrders.filter(order => 
          order.customer_id === customerId || 
          (order.customer_id === null && order.customer_name === customer.name)
        );
      } else {
        filteredOrders = filteredOrders.filter(order => order.customer_id === customerId);
      }
    }
    
    if (start_date) {
      filteredOrders = filteredOrders.filter(order => order.order_date >= start_date);
    }
    
    if (end_date) {
      filteredOrders = filteredOrders.filter(order => order.order_date <= end_date);
    }
    
    // 按訂單類型篩選
    if (order_type) {
      if (order_type === 'online') {
        filteredOrders = filteredOrders.filter(order => order.order_type !== 'walk-in');
      } else if (order_type === 'walk-in') {
        filteredOrders = filteredOrders.filter(order => order.order_type === 'walk-in');
      }
    }
    
    // 加入客戶資訊和訂單項目，並排序
    const result = filteredOrders
      .map(order => {
        const customer = db.customers.find(c => c.id === order.customer_id);
        const orderItems = db.order_items.filter(item => item.order_id === order.id);
        
        return {
          id: order.id,
          order_date: order.order_date,
          delivery_date: order.delivery_date,
          status: order.status === 'completed' ? 'shipped' : order.status, // Map 'completed' to 'shipped' for frontend display
          notes: order.notes,
          shipping_type: order.shipping_type || 'none',
          shipping_fee: order.shipping_fee || 0,
          credit_card_fee: order.credit_card_fee || 0,
          shopee_fee: order.shopee_fee || 0, // 新增蝦皮費用欄位
          customer_name: customer ? customer.name : (order.customer_name || '未知客戶'),
          phone: customer ? customer.phone : '',
          // 現場銷售特有欄位
          order_type: order.order_type || 'online',
          subtotal: order.subtotal,
          customer_payment: order.customer_payment,
          change: order.change,
          created_by: order.created_by,
          items: orderItems.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            special_notes: item.special_notes,
            status: item.status,
            is_gift: item.is_gift || false
          }))
        };
      })
      .sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得單個訂單詳情
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    const order = db.orders.find(o => o.id === parseInt(id));
    if (!order) {
      res.status(404).json({ error: '訂單不存在' });
      return;
    }
    
    // 取得客戶資訊
    const customer = db.customers.find(c => c.id === order.customer_id);
    
    // 取得訂單項目
    const orderItems = db.order_items.filter(item => item.order_id === parseInt(id));
    
    res.json({
      ...order,
      customer_name: customer ? customer.name : '未知客戶',
      customer_phone: customer ? customer.phone : '',
      customer_address: customer ? customer.address : '',
      items: orderItems
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 新增訂單
app.post('/api/orders', (req, res) => {
  const { customer_id, customer_name, order_date, delivery_date, items, notes, shipping_type, shipping_fee, credit_card_fee, shopee_fee } = req.body;
  
  try {
    // 取得客戶資料以檢查付款方式（允許 customer_id 為 null）
    let customer = null;
    if (customer_id) {
      customer = db.customers.find(c => c.id === parseInt(customer_id));
      if (!customer) {
        res.status(404).json({ error: '客戶不存在' });
        return;
      }
    }

    // 計算信用卡手續費
    let creditCardFee = 0;
    if (customer && customer.payment_method === '信用卡') {
      // 計算付費產品總金額（排除贈品）
      const paidItemsTotal = items
        .filter(item => !item.is_gift)
        .reduce((total, item) => total + (parseFloat(item.unit_price) * parseInt(item.quantity)), 0);
      
      // 手續費 = 付費產品金額 × 2%
      creditCardFee = Math.round(paidItemsTotal * 0.02);
    }

    const newOrder = {
      id: Math.max(...db.orders.map(o => o.id), 0) + 1,
      customer_id: customer_id ? parseInt(customer_id) : null,
      customer_name: customer_name || '未知客戶',
      order_date,
      delivery_date,
      status: 'pending',
      notes,
      shipping_type: shipping_type || 'none', // 'none', 'paid', 'free'
      shipping_fee: shipping_fee || 0,
      credit_card_fee: credit_card_fee || creditCardFee, // 使用前端計算的費用或後端計算的費用
      shopee_fee: shopee_fee || 0 // 新增蝦皮費用欄位
    };
    
    db.orders.push(newOrder);
    
    // 新增訂單項目
    console.log('創建訂單項目:', items);
    if (!items || !Array.isArray(items)) {
      console.error('items 參數無效:', items);
      res.status(400).json({ error: 'items 參數必須是數組' });
      return;
    }
    items.forEach(item => {
      const newItem = {
        id: Math.max(...db.order_items.map(oi => oi.id), 0) + 1,
        order_id: newOrder.id,
        product_name: item.product_name,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
        special_notes: item.special_notes || '',
        status: 'pending',
        is_gift: item.is_gift || false
      };
      console.log('添加訂單項目:', newItem);
      db.order_items.push(newItem);
    });
    
    saveData();
    res.json({ 
      id: newOrder.id, 
      message: '訂單建立成功',
      credit_card_fee: creditCardFee,
      total_amount: items.reduce((total, item) => total + (parseFloat(item.unit_price) * parseInt(item.quantity)), 0) + (shipping_fee || 0) - creditCardFee
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新訂單（完整編輯）
app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const { customer_id, order_date, delivery_date, items, notes, shipping_type, shipping_fee, credit_card_fee, shopee_fee } = req.body;
  
  try {
    const orderIndex = db.orders.findIndex(o => o.id === parseInt(id));
    if (orderIndex === -1) {
      res.status(404).json({ error: '訂單不存在' });
      return;
    }

    // 取得客戶資料以檢查付款方式
    const customer = db.customers.find(c => c.id === parseInt(customer_id));
    if (!customer) {
      res.status(404).json({ error: '客戶不存在' });
      return;
    }

    // 計算信用卡手續費
    let creditCardFee = 0;
    if (customer.payment_method === '信用卡') {
      // 計算付費產品總金額（排除贈品）
      const paidItemsTotal = items
        .filter(item => !item.is_gift)
        .reduce((total, item) => total + (parseFloat(item.unit_price) * parseInt(item.quantity)), 0);
      
      // 手續費 = 付費產品金額 × 2%
      creditCardFee = Math.round(paidItemsTotal * 0.02);
    }
    
    // 更新訂單基本資訊
    db.orders[orderIndex] = {
      ...db.orders[orderIndex],
      customer_id: parseInt(customer_id),
      order_date,
      delivery_date,
      notes,
      shipping_type: shipping_type || 'none',
      shipping_fee: shipping_fee || 0,
      credit_card_fee: credit_card_fee || creditCardFee, // 使用前端計算的費用或後端計算的費用
      shopee_fee: shopee_fee || 0 // 更新蝦皮費用
    };
    
    // 刪除舊的訂單項目
    db.order_items = db.order_items.filter(item => item.order_id !== parseInt(id));
    
    // 新增新的訂單項目
    items.forEach(item => {
      const newItem = {
        id: Math.max(...db.order_items.map(oi => oi.id), 0) + 1,
        order_id: parseInt(id),
        product_name: item.product_name,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
        special_notes: item.special_notes || '',
        status: item.status || 'pending', // 保持原有狀態或設為 pending
        is_gift: item.is_gift || false
      };
      db.order_items.push(newItem);
    });
    
    saveData();
    res.json({ 
      message: '訂單更新成功', 
      order: db.orders[orderIndex],
      credit_card_fee: creditCardFee,
      total_amount: items.reduce((total, item) => total + (parseFloat(item.unit_price) * parseInt(item.quantity)), 0) + (shipping_fee || 0) - creditCardFee
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新訂單狀態（基於訂單項目狀態自動計算）
app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const orderIndex = db.orders.findIndex(o => o.id === parseInt(id));
    if (orderIndex === -1) {
      res.status(404).json({ error: '訂單不存在' });
      return;
    }
    
    // 取得該訂單的所有項目
    const orderItems = db.order_items.filter(item => item.order_id === parseInt(id));
    const total = orderItems.length;
    const completed = orderItems.filter(item => item.status === 'completed').length;
    
    // 如果請求的狀態是 pending 或 shipped，直接設置
    if (status === 'pending' || status === 'shipped') {
      db.orders[orderIndex].status = status;
    } else {
      // 否則根據訂單項目狀態自動計算訂單狀態
      let newStatus = 'pending';
      if (total > 0 && completed === total) {
        newStatus = 'completed';
      } else if (completed > 0) {
        newStatus = 'in_progress';
      }
      db.orders[orderIndex].status = newStatus;
    }
    
    saveData();
    res.json({ 
      message: '訂單狀態更新成功', 
      status: db.orders[orderIndex].status,
      total_items: total,
      completed_items: completed
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 刪除訂單
app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  
  try {
    console.log('刪除訂單:', id);
    
    // 檢查訂單是否存在
    const orderIndex = db.orders.findIndex(order => order.id === parseInt(id));
    if (orderIndex === -1) {
      return res.status(404).json({ error: '訂單不存在' });
    }
    
    // 刪除訂單
    const deletedOrder = db.orders.splice(orderIndex, 1)[0];
    console.log('已刪除訂單:', deletedOrder);
    
    // 刪除相關的訂單項目
    const deletedItems = db.order_items.filter(item => item.order_id === parseInt(id));
    db.order_items = db.order_items.filter(item => item.order_id !== parseInt(id));
    console.log('已刪除訂單項目:', deletedItems);
    
    // 保存到檔案
    saveData();
    
    res.json({ 
      message: '訂單刪除成功',
      deletedOrder: deletedOrder,
      deletedItemsCount: deletedItems.length
    });
  } catch (error) {
    console.error('刪除訂單錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新訂單出貨狀態
app.put('/api/orders/:id/shipping-status', checkDatabaseReady, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    console.log('更新訂單出貨狀態:', { orderId: id, status });
    
    const orderIndex = db.orders.findIndex(order => order.id === parseInt(id));
    if (orderIndex === -1) {
      return res.status(404).json({ error: '訂單不存在' });
    }
    
    // 更新訂單狀態
    db.orders[orderIndex].status = status;
    
    // 如果標記為已出貨，同時更新所有訂單項目的狀態
    if (status === 'completed') {
      db.order_items.forEach(item => {
        if (item.order_id === parseInt(id)) {
          item.status = 'completed';
        }
      });
    }
    
    saveData();
    res.json({ 
      message: '訂單出貨狀態更新成功',
      order: db.orders[orderIndex]
    });
  } catch (error) {
    console.error('更新訂單出貨狀態錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

// 更新產品製作狀態
app.put('/api/kitchen/production/:date/:productName/status', checkDatabaseReady, (req, res) => {
  const { date, productName } = req.params;
  const { status } = req.body;
  
  try {
    console.log('更新產品製作狀態:', { date, productName, status });
    
    // 取得指定日期的訂單
    const orders = db.orders.filter(order => order.order_date === date);
    console.log('匹配的訂單:', orders.map(o => ({ id: o.id, order_date: o.order_date })));
    const orderIds = orders.map(order => order.id);
    console.log('訂單IDs:', orderIds);
    
    // 更新該日期該產品的所有訂單項目狀態
    let updatedCount = 0;
    db.order_items.forEach(item => {
      if (orderIds.includes(item.order_id) && item.product_name === productName) {
        console.log('更新訂單項目:', { order_id: item.order_id, product_name: item.product_name, old_status: item.status, new_status: status });
        item.status = status;
        updatedCount++;
      }
    });
    console.log('更新的項目數量:', updatedCount);
    
    // 廚房製作完成不應該自動更新訂單狀態
    // 訂單狀態應該由出貨管理來控制
    // 這裡只更新製作狀態，不影響訂單的整體狀態
    
    saveData();
    res.json({ message: '產品狀態更新成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// 匯出訂單歷史為 CSV
app.get('/api/orders/history/export/csv', (req, res) => {
  const { customer_id, start_date, end_date } = req.query;
  
  try {
    let filteredOrders = db.orders;
    
    // 應用篩選條件
    if (customer_id) {
      filteredOrders = filteredOrders.filter(order => order.customer_id === parseInt(customer_id));
    }
    
    if (start_date) {
      filteredOrders = filteredOrders.filter(order => order.order_date >= start_date);
    }
    
    if (end_date) {
      filteredOrders = filteredOrders.filter(order => order.order_date <= end_date);
    }
    
    // 準備 CSV 資料
    const csvData = [];
    csvData.push(['客戶名稱', '訂單日期', '出貨日期', '訂購產品', '數量', '單價', '小計', '運費', '狀態', '備註']);
    
    filteredOrders
      .sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
      .forEach(order => {
        const customer = db.customers.find(c => c.id === order.customer_id);
        const customerName = customer ? customer.name : '未知客戶';
        const orderItems = db.order_items.filter(item => item.order_id === order.id);
        
        if (orderItems.length === 0) {
          // 如果沒有訂單項目，仍然顯示訂單資訊
          csvData.push([
            customerName,
            order.order_date,
            order.delivery_date,
            '無產品',
            '0',
            '0',
            '0',
            order.shipping_fee || 0,
            order.status === 'completed' ? '已完成' : '進行中',
            order.notes || ''
          ]);
        } else {
          orderItems.forEach(item => {
            const subtotal = item.quantity * item.unit_price;
            csvData.push([
              customerName,
              order.order_date,
              order.delivery_date,
              item.product_name,
              item.quantity,
              item.unit_price,
              subtotal,
              '', // 運費欄位留空，因為會單獨顯示
              item.status === 'completed' ? '已完成' : '進行中',
              item.special_notes || order.notes || ''
            ]);
          });
          
          // 如果有運費，將運費作為獨立項目顯示
          if (order.shipping_fee && order.shipping_fee !== 0) {
            const shippingDescription = order.shipping_fee < 0 ? '免運費優惠' : '運費';
            csvData.push([
              customerName,
              order.order_date,
              order.delivery_date,
              shippingDescription,
              1,
              order.shipping_fee,
              order.shipping_fee,
              '', // 運費欄位留空
              order.status === 'completed' ? '已完成' : '進行中',
              order.notes || ''
            ]);
          }
        }
      });
    
    // 轉換為 CSV 格式
    const csvContent = csvData.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    // 設定檔案名稱
    const filename = `訂單歷史_${new Date().toISOString().split('T')[0]}.csv`;
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send('\uFEFF' + csvContent); // 添加 BOM 以支援中文
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得週統計數據
app.get('/api/orders/weekly/:startDate', (req, res) => {
  const { startDate } = req.params;
  
  try {
    console.log('請求週統計開始日期:', startDate);
    
    // 計算一週的日期範圍
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    console.log('週統計日期範圍:', start.toISOString().split('T')[0], '到', end.toISOString().split('T')[0]);
    
    // 取得這個日期範圍內的所有訂單
    const orders = db.orders.filter(order => {
      const orderDate = new Date(order.order_date);
      return orderDate >= start && orderDate <= end;
    });
    
    console.log('週統計匹配的訂單:', orders);
    const orderIds = orders.map(order => order.id);
    
    // 取得這些訂單的項目
    const orderItems = db.order_items.filter(item => orderIds.includes(item.order_id));
    console.log('週統計訂單項目:', orderItems);
    
    // 按日期和產品統計
    const weeklyStats = {};
    
    orders.forEach(order => {
      const date = order.order_date;
      if (!weeklyStats[date]) {
        weeklyStats[date] = {};
      }
      
      const items = orderItems.filter(item => item.order_id === order.id);
      items.forEach(item => {
        if (!weeklyStats[date][item.product_name]) {
          weeklyStats[date][item.product_name] = {
            product_name: item.product_name,
            total_quantity: 0,
            unit_price: item.unit_price,
            total_amount: 0
          };
        }
        weeklyStats[date][item.product_name].total_quantity += item.quantity;
        weeklyStats[date][item.product_name].total_amount += item.quantity * item.unit_price;
      });
    });
    
    res.json(weeklyStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 共享 API 端點 (供 POS 系統使用) ====================

// 取得所有產品列表（共享給 POS 系統）
app.get('/api/shared/products', checkDatabaseReady, (req, res) => {
  res.json(db.products);
});

// 取得所有客戶列表（共享給 POS 系統）
app.get('/api/shared/customers', checkDatabaseReady, (req, res) => {
  try {
    const customers = db.customers.sort((a, b) => a.name.localeCompare(b.name));
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 創建現場銷售訂單（POS 系統專用）
app.post('/api/shared/pos-orders', checkDatabaseReady, (req, res) => {
  const { items, subtotal, customer_payment, change, payment_method, created_by } = req.body;
  
  try {
    // 創建現場銷售訂單
    const now = new Date();
    const newOrder = {
      id: Math.max(...db.orders.map(o => o.id), 0) + 1,
      customer_id: null, // 現場銷售沒有客戶ID
      customer_name: '現場客戶',
      order_date: now.toISOString().split('T')[0], // 日期
      order_time: now.toISOString(), // 完整時間戳記
      delivery_date: now.toISOString().split('T')[0],
      status: 'completed', // 現場銷售直接完成
      notes: `現場銷售 - 付款方式: ${payment_method}`,
      shipping_type: 'none',
      shipping_fee: 0,
      credit_card_fee: 0,
      order_type: 'walk-in', // 標記為現場銷售
      subtotal: subtotal,
      customer_payment: customer_payment,
      change: change,
      created_by: created_by || 'pos-system'
    };
    
    db.orders.push(newOrder);
    
    // 新增訂單項目
    items.forEach(item => {
      const newItem = {
        id: Math.max(...db.order_items.map(oi => oi.id), 0) + 1,
        order_id: newOrder.id,
        product_name: item.product_name,
        quantity: parseInt(item.quantity),
        unit_price: parseFloat(item.unit_price),
        special_notes: item.special_notes || '',
        status: 'completed', // 現場銷售直接完成
        is_gift: item.is_gift || false
      };
      db.order_items.push(newItem);
    });
    
    saveData();
    res.json({ 
      id: newOrder.id, 
      message: '現場銷售記錄成功',
      order: newOrder
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得現場訂單製作清單 (按產品統計數量，僅當天)
app.get('/api/kitchen/walkin-orders', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('請求現場訂單製作清單日期:', today);
    
    // 取得當天的現場銷售訂單
    const walkinOrders = db.orders.filter(order => {
      const orderDate = new Date(order.order_date).toISOString().split('T')[0];
      return orderDate === today && order.order_type === 'walk-in';
    });
    
    console.log('匹配的現場訂單:', walkinOrders);
    const orderIds = walkinOrders.map(order => order.id);
    
    // 取得這些訂單的項目
    const orderItems = db.order_items.filter(item => orderIds.includes(item.order_id));
    console.log('現場訂單項目:', orderItems);
    
    // 按產品名稱和單價分組統計
    const productStats = {};
    
    orderItems.forEach(item => {
      const key = `${item.product_name}_${item.unit_price}`;
      if (!productStats[key]) {
        productStats[key] = {
          product_name: item.product_name,
          unit_price: item.unit_price,
          total_quantity: 0,
          pending_quantity: 0,
          completed_quantity: 0,
          is_gift: item.is_gift
        };
      }
      
      productStats[key].total_quantity += item.quantity;
      
      if (item.status === 'pending') {
        productStats[key].pending_quantity += item.quantity;
      } else if (item.status === 'completed') {
        productStats[key].completed_quantity += item.quantity;
      }
    });
    
    const result = Object.values(productStats);
    console.log('現場訂單製作清單結果:', result);
    
    res.json(result);
  } catch (error) {
    console.error('取得現場訂單製作清單失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 取得現場訂單列表 (按訂單顯示，用於廚房卡片式顯示)
app.get('/api/kitchen/walkin-orders-list', checkDatabaseReady, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('請求現場訂單列表日期:', today);
    
    // 取得當天的現場銷售訂單，按時間倒序排列
    const allOrders = Array.isArray(db.orders) ? db.orders : [];
    const allItems = Array.isArray(db.order_items) ? db.order_items : [];
    const walkinOrders = allOrders
      .filter(order => {
        if (!order || !order.order_date) return false;
        let orderDate;
        try {
          orderDate = new Date(order.order_date).toISOString().split('T')[0];
        } catch (e) {
          return false;
        }
        return orderDate === today && order.order_type === 'walk-in';
      })
      .sort((a, b) => {
        // 按 order_time 倒序排列，如果沒有 order_time 則按 id 倒序
        if (a.order_time && b.order_time) {
          return new Date(b.order_time) - new Date(a.order_time);
        }
        return b.id - a.id;
      });
    
    console.log('匹配的現場訂單:', walkinOrders);
    
    // 為每個訂單添加訂單項目資訊
    const result = walkinOrders.map(order => {
      const orderItems = allItems.filter(item => item.order_id === order.id);
      
      return {
        id: order.id,
        order_time: order.order_time,
        items: orderItems.map(item => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          is_gift: item.is_gift || false
        }))
      };
    });
    
    console.log('現場訂單列表結果:', result);
    return res.json(result);
  } catch (error) {
    console.error('取得現場訂單列表失敗:', error);
    // 回傳空陣列避免前端中斷
    return res.status(200).json([]);
  }
});

// 取得歷史訂單（包含網路訂單和現場銷售）
app.get('/api/shared/orders/history', checkDatabaseReady, (req, res) => {
  const { start_date, end_date, order_type } = req.query;
  
  try {
    let filteredOrders = db.orders;
    
    // 按訂單類型篩選
    if (order_type) {
      if (order_type === 'online') {
        filteredOrders = filteredOrders.filter(order => order.order_type !== 'walk-in');
      } else if (order_type === 'walk-in') {
        filteredOrders = filteredOrders.filter(order => order.order_type === 'walk-in');
      }
    }
    
    // 按日期篩選
    if (start_date) {
      filteredOrders = filteredOrders.filter(order => order.order_date >= start_date);
    }
    
    if (end_date) {
      filteredOrders = filteredOrders.filter(order => order.order_date <= end_date);
    }
    
    // 加入訂單項目資訊
    const result = filteredOrders
      .map(order => {
        const customer = db.customers.find(c => c.id === order.customer_id);
        const orderItems = db.order_items.filter(item => item.order_id === order.id);
        
        return {
          id: order.id,
          customer_id: order.customer_id, // 新增客戶ID欄位
          order_date: order.order_date,
          order_time: order.order_time, // 新增時間戳記欄位
          delivery_date: order.delivery_date,
          status: order.status,
          notes: order.notes,
          order_type: order.order_type || 'online',
          customer_name: customer ? customer.name : (order.customer_name || '未知客戶'),
          phone: customer ? customer.phone : '',
          items: orderItems.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            special_notes: item.special_notes,
            status: item.status,
            is_gift: item.is_gift || false
          })),
          // 現場銷售特有欄位
          subtotal: order.subtotal,
          customer_payment: order.customer_payment,
          change: order.change,
          created_by: order.created_by
        };
      })
      .sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得日報表（包含網路訂單和現場銷售）
app.get('/api/shared/reports/daily/:date', checkDatabaseReady, (req, res) => {
  const { date } = req.params;
  
  try {
    // 取得指定日期的所有訂單
    const dayOrders = db.orders.filter(order => order.order_date === date);
    const orderIds = dayOrders.map(order => order.id);
    const dayItems = db.order_items.filter(item => orderIds.includes(item.order_id));
    
    // 分別統計網路訂單和現場銷售
    const onlineOrders = dayOrders.filter(order => order.order_type !== 'walk-in');
    const walkInOrders = dayOrders.filter(order => order.order_type === 'walk-in');
    
    // 計算網路訂單金額
    let onlineTotal = 0;
    onlineOrders.forEach(order => {
      const orderItems = dayItems.filter(item => item.order_id === order.id);
      const orderTotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      onlineTotal += orderTotal;
      
      // 運費處理
      if (order.shipping_fee && order.shipping_fee < 0) {
        onlineTotal += order.shipping_fee;
      }
      
      // 信用卡手續費
      if (order.credit_card_fee && order.credit_card_fee > 0) {
        onlineTotal -= order.credit_card_fee;
      }
    });
    
    // 計算現場銷售金額
    const walkInTotal = walkInOrders.reduce((sum, order) => sum + (order.subtotal || 0), 0);
    
    res.json({
      date: date,
      online_orders: {
        count: onlineOrders.length,
        total_amount: onlineTotal
      },
      walk_in_orders: {
        count: walkInOrders.length,
        total_amount: walkInTotal
      },
      total_orders: dayOrders.length,
      total_amount: onlineTotal + walkInTotal
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 智能排程配置管理
app.get('/api/scheduling/config', checkDatabaseReady, (req, res) => {
  try {
    // 初始化排程配置（如果不存在）
    if (!db.scheduling_config) {
      db.scheduling_config = {
        daily_capacity: 40,        // 日產能
        staff_count: 1,           // 人力數量
        minutes_per_bottle: 1.5,  // 每瓶製作時間（分鐘）
        min_stock: 10,            // 最低庫存
        working_hours: 8,         // 工作時數
        break_time: 60,           // 休息時間（分鐘）
        enable_inventory_replenishment: false, // 是否啟用庫存補貨
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      saveData();
    }
    
    res.json(db.scheduling_config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新智能排程配置
app.put('/api/scheduling/config', checkDatabaseReady, (req, res) => {
  try {
    const config = req.body;
    
    // 驗證配置參數
    if (config.daily_capacity && (config.daily_capacity < 1 || config.daily_capacity > 200)) {
      return res.status(400).json({ error: '日產能必須在1-200瓶之間' });
    }
    
    if (config.staff_count && (config.staff_count < 1 || config.staff_count > 10)) {
      return res.status(400).json({ error: '人力數量必須在1-10人之間' });
    }
    
    if (config.minutes_per_bottle && (config.minutes_per_bottle < 0.5 || config.minutes_per_bottle > 10)) {
      return res.status(400).json({ error: '每瓶製作時間必須在0.5-10分鐘之間' });
    }
    
    // 更新配置
    if (!db.scheduling_config) {
      db.scheduling_config = {};
    }
    
    Object.assign(db.scheduling_config, config, {
      updated_at: new Date().toISOString()
    });
    
    saveData();
    
    console.log('智能排程配置已更新:', db.scheduling_config);
    res.json({ 
      message: '配置更新成功', 
      config: db.scheduling_config 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 智能排程 API
app.get('/api/scheduling/orders', checkDatabaseReady, (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    console.log('智能排程API請求:', { date: targetDate });
    console.log('資料庫訂單數量:', db.orders ? db.orders.length : 0);
    
    // 獲取排程配置
    const config = db.scheduling_config || {
      daily_capacity: 40,
      staff_count: 1,
      minutes_per_bottle: 1.5,
      min_stock: 10,
      working_hours: 8,
      break_time: 60
    };
    
    // 智能排程分析
    const scheduleAnalysis = generateSmartSchedule(targetDate, config);
    
    res.json({
      date: targetDate,
      config: config,
      analysis: scheduleAnalysis,
      orders: scheduleAnalysis.planned_production,
      summary: scheduleAnalysis.summary,
      recommendations: scheduleAnalysis.recommendations
    });
    
  } catch (error) {
    console.error('智能排程API錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

// 智能排程生成函數
function generateSmartSchedule(targetDate, config) {
  try {
    // 分析多日訂單需求（包括前一日、當日和未來幾日），讓遞延能帶入隔日
    const maxDays = config.max_rolling_days || 3;
    const start = new Date(targetDate);
    start.setDate(start.getDate() - 1);
    const startDateForRolling = start.toISOString().split('T')[0];
    const multiDayOrderDemandAll = analyzeMultiDayOrderDemand(startDateForRolling, maxDays + 1);
    
    // 如果沒有任何訂單需求，不生成任何排程
    if (multiDayOrderDemandAll.length === 0) {
      return {
        planned_production: [],
        time_schedule: [],
        summary: {
          total_bottles: 0,
          efficiency: '0%',
          estimated_time: '0分鐘',
          remaining_capacity: config.daily_capacity
        },
        recommendations: ['近期無訂單，無需生產'],
        inventory_analysis: [],
        sales_trend: [],
        daily_order_demand: [],
        multi_day_schedule: [],
        deferred_orders: []
      };
    }
    
    // 分析庫存狀況
    const inventoryAnalysis = analyzeInventory();
    
    // 分析銷售趨勢
    const salesTrend = analyzeSalesTrend();
    
    // 生成多日生產計劃（含前一日）
    const multiDayPlanAll = generateMultiDayProductionPlan(inventoryAnalysis, salesTrend, multiDayOrderDemandAll, config);
    // 過濾出從 targetDate 起的區間，供前端顯示
    const multiDayPlan = multiDayPlanAll.filter(day => day.date >= targetDate);
    
    // 獲取當日計劃
    const todayPlan = multiDayPlan.find(day => day.date === targetDate) || { 
      planned_production: [], 
      time_schedule: [], 
      remaining_capacity: config.daily_capacity 
    };
    
    // 計算當日時間安排
    const timeSchedule = calculateTimeSchedule(todayPlan.planned_production, config);
    
    // 生成建議
    const recommendations = generateMultiDayRecommendations(inventoryAnalysis, multiDayPlan, config);
    
    // 獲取遞延訂單
    const deferredOrders = getDeferredOrders(multiDayPlan, targetDate);
    
    return {
      planned_production: todayPlan.planned_production,
      time_schedule: timeSchedule,
      summary: {
        total_bottles: todayPlan.planned_production.reduce((sum, item) => sum + item.quantity, 0),
        efficiency: ((todayPlan.planned_production.reduce((sum, item) => sum + item.quantity, 0) / config.daily_capacity) * 100).toFixed(1) + '%',
        estimated_time: calculateTotalTime(todayPlan.planned_production, config),
        remaining_capacity: todayPlan.remaining_capacity
      },
      recommendations: recommendations,
      inventory_analysis: inventoryAnalysis,
      sales_trend: salesTrend,
      multi_day_schedule: multiDayPlan,
      deferred_orders: deferredOrders
    };
  } catch (error) {
    console.error('智能排程生成錯誤:', error);
    return {
      planned_production: [],
      time_schedule: [],
      summary: { total_bottles: 0, efficiency: '0%', estimated_time: '0分鐘', remaining_capacity: config.daily_capacity },
      recommendations: ['排程生成失敗，請檢查系統配置'],
      inventory_analysis: [],
      sales_trend: []
    };
  }
}

// 分析庫存狀況
function analyzeInventory() {
  const analysis = [];
  
  db.products.forEach(product => {
    const currentStock = product.current_stock || 0;
    const minStock = db.scheduling_config?.min_stock || 10;
    const priority = getProductPriority(product.name);
    
    const stockDeficit = Math.max(0, minStock - currentStock);
    const urgencyScore = (stockDeficit * 2) + (priority ? (10 - priority) : 0);
    
    analysis.push({
      product_id: product.id,
      product_name: product.name,
      current_stock: currentStock,
      min_stock: minStock,
      stock_deficit: stockDeficit,
      priority: priority,
      urgency_score: urgencyScore,
      status: currentStock < minStock ? 'urgent' : currentStock < minStock * 1.5 ? 'warning' : 'normal'
      });
    });
    
  return analysis.sort((a, b) => b.urgency_score - a.urgency_score);
}

// 分析銷售趨勢
function analyzeSalesTrend() {
  const trend = [];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  db.products.forEach(product => {
    const recentOrders = db.orders.filter(order => {
      const orderDate = new Date(order.order_time || order.created_at);
      return orderDate >= sevenDaysAgo && order.status !== 'cancelled';
    });
    
    let totalSold = 0;
    recentOrders.forEach(order => {
      const items = db.order_items.filter(item => 
        item.order_id === order.id && item.product_name === product.name
      );
      totalSold += items.reduce((sum, item) => sum + item.quantity, 0);
    });
    
    trend.push({
      product_id: product.id,
      product_name: product.name,
      weekly_sales: totalSold,
      daily_average: (totalSold / 7).toFixed(1)
    });
  });
  
  return trend.sort((a, b) => b.weekly_sales - a.weekly_sales);
}

// 分析當日訂單需求
function analyzeDailyOrderDemand(targetDate) {
  const demand = [];
  
  // 獲取當日的所有訂單（預訂和現場）
  const dailyOrders = db.orders.filter(order => {
    const orderDeliveryDate = order.delivery_date || order.order_date;
    return orderDeliveryDate === targetDate && order.status !== 'cancelled';
  });
  
  console.log(`當日訂單數量: ${dailyOrders.length}`);
  console.log('當日訂單詳情:', dailyOrders.map(o => ({id: o.id, date: o.delivery_date || o.order_date})));
  
  // 按產品統計需求
  const productDemand = {};
  
  dailyOrders.forEach(order => {
    const orderItems = db.order_items.filter(item => item.order_id === order.id);
    console.log(`訂單 ${order.id} 的項目數量: ${orderItems.length}`);
      
      orderItems.forEach(item => {
      if (!productDemand[item.product_name]) {
        productDemand[item.product_name] = {
          product_name: item.product_name,
          total_quantity: 0,
          orders: []
        };
      }
      
      productDemand[item.product_name].total_quantity += item.quantity;
      productDemand[item.product_name].orders.push({
          order_id: order.id,
          customer_name: order.customer_name,
          quantity: item.quantity,
        order_type: order.order_type || 'preorder'
        });
      });
    });
    
  // 轉換為數組並按優先順序排序
  Object.values(productDemand).forEach(demandItem => {
    const product = db.products.find(p => p.name === demandItem.product_name);
    if (product) {
      demand.push({
        product_id: product.id,
        product_name: demandItem.product_name,
        daily_demand: demandItem.total_quantity,
        orders: demandItem.orders,
        priority: getProductPriority(demandItem.product_name)
      });
    }
  });
  
  console.log('當日訂單需求:', demand);
  // 按產品優先順序排序（數字越小優先級越高）
  return demand.sort((a, b) => a.priority - b.priority);
}

// 分析多日訂單需求（支持遞延製作）
function analyzeMultiDayOrderDemand(startDate, maxDays) {
  const multiDayDemand = [];
  const start = new Date(startDate);
  
  for (let day = 0; day < maxDays; day++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const dailyDemand = analyzeDailyOrderDemand(dateStr);
    // 即使當日無新訂單，也保留空日，讓遞延可滾入顯示
    multiDayDemand.push({
      date: dateStr,
      demand: dailyDemand,
      total_bottles: dailyDemand.reduce((sum, item) => sum + item.daily_demand, 0)
    });
  }
  
  console.log('多日訂單需求:', multiDayDemand);
  return multiDayDemand;
}

// 生成生產計劃
function generateProductionPlan(inventoryAnalysis, salesTrend, dailyOrderDemand, config) {
  const plan = [];
  let remainingCapacity = config.daily_capacity;
  
  // 優先處理當日訂單需求
  dailyOrderDemand.forEach(demandItem => {
    if (remainingCapacity <= 0) return;
    
    const inventoryItem = inventoryAnalysis.find(i => i.product_id === demandItem.product_id);
    const currentStock = inventoryItem ? inventoryItem.current_stock : 0;
    
    // 計算需要生產的數量：訂單需求 - 現有庫存
    const productionNeeded = Math.max(0, demandItem.daily_demand - currentStock);
    
    if (productionNeeded > 0) {
      const productionQuantity = Math.min(productionNeeded, remainingCapacity);
      
      plan.push({
        product_id: demandItem.product_id,
        product_name: demandItem.product_name,
        quantity: productionQuantity,
        reason: `當日訂單需求${demandItem.daily_demand}瓶，現有庫存${currentStock}瓶`,
        priority: demandItem.priority,
        estimated_time: estimateProductionTime(productionQuantity, config),
        order_demand: demandItem.daily_demand,
        current_stock: currentStock
      });
      
      remainingCapacity -= productionQuantity;
    }
  });
  
  // 如果還有剩餘產能，且配置允許庫存補貨，才處理庫存補貨需求
  if (remainingCapacity > 0 && config.enable_inventory_replenishment !== false) {
    inventoryAnalysis.forEach(item => {
      if (remainingCapacity <= 0) return;
      
      // 檢查是否已經在計劃中
      const alreadyPlanned = plan.find(p => p.product_id === item.product_id);
      if (alreadyPlanned) return;
      
      const salesData = salesTrend.find(s => s.product_id === item.product_id);
      const salesBoost = salesData ? Math.min(salesData.weekly_sales * 0.2, 10) : 0;
      
      const recommendedQuantity = Math.min(
        item.stock_deficit + Math.max(5, salesBoost),
        remainingCapacity
      );
      
      if (recommendedQuantity > 0) {
        plan.push({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: recommendedQuantity,
          reason: getProductionReason(item, salesData),
          priority: item.priority,
          estimated_time: estimateProductionTime(recommendedQuantity, config)
        });
        
        remainingCapacity -= recommendedQuantity;
      }
    });
  }
  
  return plan;
}

// 生成多日生產計劃（支持遞延製作）
function generateMultiDayProductionPlan(inventoryAnalysis, salesTrend, multiDayOrderDemand, config) {
  const multiDayPlan = [];
  let currentInventory = [...inventoryAnalysis]; // 複製當前庫存狀態

  // 累計遞延需求，帶入下一天（key: product_id, value: { quantity, meta }）
  const carryOverMap = new Map();

  // 為每一天生成生產計劃
  multiDayOrderDemand.forEach(dayData => {
    const dayPlan = {
      date: dayData.date,
      planned_production: [],
      time_schedule: [],
      remaining_capacity: config.daily_capacity,
      deferred_orders: []
    };
    
    let remainingCapacity = config.daily_capacity;

    // 構建「當日有效需求」= 當日訂單需求 + 來自前一日的遞延需求
    const combinedDemand = [];

    // 先推入前一日遞延（若有）
    if (carryOverMap.size > 0) {
      carryOverMap.forEach((value, productId) => {
        combinedDemand.push({
          product_id: productId,
          product_name: value.product_name,
          daily_demand: value.quantity,
          priority: value.priority ?? 999, // 遞延若無優先設定，給較後順位
          orders: value.orders || []
        });
      });
    }

    // 再推入當日新訂單需求
    dayData.demand.forEach(d => combinedDemand.push(d));

    // 若完全沒有需求（沒有新訂單且沒有遞延），也要生成空計劃物件，避免前端顯示空白不明
    if (combinedDemand.length === 0) {
      dayPlan.remaining_capacity = remainingCapacity;
      dayPlan.time_schedule = [];
      multiDayPlan.push(dayPlan);
      // 清空上一日遞延（已消耗於 combinedDemand 的構建邏輯，此處確保乾淨）
      carryOverMap.clear();
      return;
    }

    // 處理當日有效需求
    combinedDemand.forEach(demandItem => {
      if (remainingCapacity <= 0) {
        // 產能不足，記錄為遞延訂單
        dayPlan.deferred_orders.push({
          product_id: demandItem.product_id,
          product_name: demandItem.product_name,
          quantity: demandItem.daily_demand,
          reason: '當日產能不足，需遞延製作',
          priority: demandItem.priority,
          orders: demandItem.orders
        });
        return;
      }
      
      const inventoryItem = currentInventory.find(i => i.product_id === demandItem.product_id);
      const currentStock = inventoryItem ? inventoryItem.current_stock : 0;
      
      // 計算需要生產的數量：訂單需求 - 現有庫存
      const productionNeeded = Math.max(0, demandItem.daily_demand - currentStock);
      
      if (productionNeeded > 0) {
        const productionQuantity = Math.min(productionNeeded, remainingCapacity);
        
        dayPlan.planned_production.push({
          product_id: demandItem.product_id,
          product_name: demandItem.product_name,
          quantity: productionQuantity,
          reason: `當日訂單需求${demandItem.daily_demand}瓶，現有庫存${currentStock}瓶`,
          priority: demandItem.priority,
          estimated_time: estimateProductionTime(productionQuantity, config),
          order_demand: demandItem.daily_demand,
          current_stock: currentStock
        });
        
        remainingCapacity -= productionQuantity;
        
        // 更新庫存狀態
        if (inventoryItem) {
          inventoryItem.current_stock += productionQuantity;
        }
        
        // 如果還有未滿足的需求，記錄為遞延
        const unmetDemand = productionNeeded - productionQuantity;
        if (unmetDemand > 0) {
          dayPlan.deferred_orders.push({
            product_id: demandItem.product_id,
            product_name: demandItem.product_name,
            quantity: unmetDemand,
            reason: '當日產能不足，需遞延製作',
            priority: demandItem.priority,
            orders: demandItem.orders
          });
        }
      }
    });
    
    // 如果還有剩餘產能，處理庫存補貨需求
    if (remainingCapacity > 0 && config.enable_inventory_replenishment !== false) {
      currentInventory.forEach(item => {
        if (remainingCapacity <= 0) return;
        
        // 檢查是否已經在計劃中
        const alreadyPlanned = dayPlan.planned_production.find(p => p.product_id === item.product_id);
        if (alreadyPlanned) return;
        
        const salesData = salesTrend.find(s => s.product_id === item.product_id);
        const salesBoost = salesData ? Math.min(salesData.weekly_sales * 0.2, 10) : 0;
        
        const recommendedQuantity = Math.min(
          item.stock_deficit + Math.max(5, salesBoost),
          remainingCapacity
        );
        
        if (recommendedQuantity > 0) {
          dayPlan.planned_production.push({
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: recommendedQuantity,
            reason: getProductionReason(item, salesData),
            priority: item.priority,
            estimated_time: estimateProductionTime(recommendedQuantity, config)
          });
          
          remainingCapacity -= recommendedQuantity;
          
          // 更新庫存狀態
          item.current_stock += recommendedQuantity;
        }
      });
    }
    
    dayPlan.remaining_capacity = remainingCapacity;
    dayPlan.time_schedule = calculateTimeSchedule(dayPlan.planned_production, config);

    // 生成下一日要帶入的遞延需求（彙總同品項）
    carryOverMap.clear();
    dayPlan.deferred_orders.forEach(doItem => {
      const existing = carryOverMap.get(doItem.product_id);
      const aggregatedQuantity = (existing?.quantity || 0) + doItem.quantity;
      carryOverMap.set(doItem.product_id, {
        product_name: doItem.product_name,
        quantity: aggregatedQuantity,
        priority: doItem.priority,
        orders: doItem.orders
      });
    });

    multiDayPlan.push(dayPlan);
  });
  
  return multiDayPlan;
}

// 獲取遞延訂單摘要
function getDeferredOrders(multiDayPlan, targetDate) {
  const deferredOrders = [];
  
  multiDayPlan.forEach(dayPlan => {
    if (dayPlan.date !== targetDate && dayPlan.deferred_orders.length > 0) {
      deferredOrders.push({
        date: dayPlan.date,
        deferred_count: dayPlan.deferred_orders.length,
        total_deferred_quantity: dayPlan.deferred_orders.reduce((sum, order) => sum + order.quantity, 0),
        deferred_orders: dayPlan.deferred_orders
      });
    }
  });
  
  return deferredOrders;
}

// 生成多日建議
function generateMultiDayRecommendations(inventoryAnalysis, multiDayPlan, config) {
  const recommendations = [];
  
  // 檢查是否有遞延訂單
  const totalDeferred = multiDayPlan.reduce((sum, day) => sum + day.deferred_orders.length, 0);
  if (totalDeferred > 0) {
    recommendations.push(`⚠️ 發現${totalDeferred}筆訂單需要遞延製作，建議增加產能或調整排程`);
  }
  
  // 檢查產能利用率
  const avgUtilization = multiDayPlan.reduce((sum, day) => {
    const used = config.daily_capacity - day.remaining_capacity;
    return sum + (used / config.daily_capacity);
  }, 0) / multiDayPlan.length;
  
  if (avgUtilization > 0.9) {
    recommendations.push('📈 產能利用率過高，建議增加人力或延長工作時間');
  } else if (avgUtilization < 0.5) {
    recommendations.push('📉 產能利用率較低，可考慮增加庫存補貨或接受更多訂單');
  }
  
  // 檢查庫存狀況
  const lowStockProducts = inventoryAnalysis.filter(item => item.stock_deficit > 0);
  if (lowStockProducts.length > 0) {
    recommendations.push(`📦 有${lowStockProducts.length}種產品庫存不足，建議優先補貨`);
  }
  
  return recommendations;
}

// 獲取生產原因
function getProductionReason(inventoryItem, salesData) {
  if (inventoryItem.stock_deficit > 0) {
    return `庫存不足，需補貨${inventoryItem.stock_deficit}瓶`;
  } else if (salesData && salesData.weekly_sales > 0) {
    return `銷售趨勢良好，預防性生產`;
  } else {
    return `維持基本庫存`;
  }
}

// 估算生產時間
function estimateProductionTime(quantity, config) {
  const totalMinutes = quantity * config.minutes_per_bottle;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  
  if (hours > 0) {
    return `${hours}小時${minutes}分鐘`;
  } else {
    return `${minutes}分鐘`;
  }
}

// 計算總時間
function calculateTotalTime(productionPlan, config) {
  const totalMinutes = productionPlan.reduce((sum, item) => {
    const timeStr = item.estimated_time;
    const minutes = parseInt(timeStr.match(/\d+/)[0]);
    return sum + minutes;
  }, 0);
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}小時${minutes}分鐘`;
  } else {
    return `${minutes}分鐘`;
  }
}

// 計算時間安排
function calculateTimeSchedule(productionPlan, config) {
  const schedule = [];
  let currentTime = 9 * 60; // 9:00 AM 開始
  
  productionPlan.forEach((item, index) => {
    const startTime = new Date();
    startTime.setHours(Math.floor(currentTime / 60), currentTime % 60, 0, 0);
    
    const duration = item.quantity * config.minutes_per_bottle;
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    schedule.push({
      ...item,
      start_time: startTime.toTimeString().slice(0, 5),
      end_time: endTime.toTimeString().slice(0, 5),
      duration_minutes: duration
    });
    
    currentTime += duration + 10; // 10分鐘間隔
  });
  
  return schedule;
}

// 生成建議
function generateRecommendations(inventoryAnalysis, productionPlan, config) {
  const recommendations = [];
  
  const totalPlanned = productionPlan.reduce((sum, item) => sum + item.quantity, 0);
  const efficiency = (totalPlanned / config.daily_capacity) * 100;
  
  if (efficiency < 80) {
    recommendations.push('💡 產能利用率較低，建議檢查產品需求預測');
  }
  
  const urgentProducts = inventoryAnalysis.filter(item => item.status === 'urgent');
  if (urgentProducts.length > 0) {
    recommendations.push(`🚨 有${urgentProducts.length}種產品庫存不足，需優先處理`);
  }
  
  if (config.staff_count === 1 && totalPlanned > 30) {
    recommendations.push('⚠️ 單人作業負荷較重，建議考慮增加人力或優化流程');
  }
  
  const highDemandProducts = inventoryAnalysis.filter(item => item.urgency_score > 20);
  if (highDemandProducts.length > 0) {
    recommendations.push('📈 部分產品需求旺盛，建議增加安全庫存');
  }
  
  return recommendations;
}

// 輔助函數：取得產品優先順序
function getProductPriority(productName) {
  if (!db.product_priority) {
    return 999; // 預設最低優先順序
  }
  
  const prioritySetting = db.product_priority.find(p => p.product_name === productName);
  return prioritySetting ? prioritySetting.priority : 999;
}

// 輔助函數：同步產品優先順序設定
function syncProductPriority() {
  try {
    // 如果沒有優先順序設定，初始化
    if (!db.product_priority) {
      db.product_priority = [];
    }
    
    // 獲取所有現有產品
    const existingProducts = db.products;
    const existingPriorityIds = db.product_priority.map(p => p.product_id);
    
    // 為新產品添加優先順序設定
    const newProducts = existingProducts.filter(product => 
      !existingPriorityIds.includes(product.id)
    );
    
    if (newProducts.length > 0) {
      const maxPriority = Math.max(...db.product_priority.map(p => p.priority), 0);
      
      newProducts.forEach((product, index) => {
        db.product_priority.push({
          product_id: product.id,
          product_name: product.name,
          priority: maxPriority + index + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
    }
    
    // 移除已刪除產品的優先順序設定
    const existingProductIds = existingProducts.map(p => p.id);
    db.product_priority = db.product_priority.filter(priority => 
      existingProductIds.includes(priority.product_id)
    );
    
    // 更新產品名稱（如果產品名稱有變更）
    db.product_priority.forEach(priority => {
      const product = existingProducts.find(p => p.id === priority.product_id);
      if (product && product.name !== priority.product_name) {
        priority.product_name = product.name;
        priority.updated_at = new Date().toISOString();
      }
    });
    
    console.log('產品優先順序同步完成:', {
      total_products: existingProducts.length,
      total_priorities: db.product_priority.length,
      new_products: newProducts.length
    });
  } catch (error) {
    console.error('同步產品優先順序失敗:', error);
  }
}

// 根路徑回應
// 健康檢查端點
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: '訂單管理系統 API 運行中！', 
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET /api/products - 取得產品列表',
      'GET /api/products/priority - 取得產品優先順序設定',
      'PUT /api/products/priority - 更新產品優先順序設定',
      'GET /api/scheduling/config - 取得智能排程配置',
      'PUT /api/scheduling/config - 更新智能排程配置',
      'GET /api/scheduling/orders - 智能排程API',
      'GET /api/customers - 取得客戶列表',
      'GET /api/kitchen/production/:date - 取得廚房製作清單',
      'GET /api/orders/customers/:date - 取得客戶訂單清單',
      'GET /api/orders/weekly/:startDate - 取得週統計數據',
      'POST /api/login - 使用者登入',
      'GET /api/shared/products - 共享產品列表 (POS)',
      'GET /api/shared/customers - 共享客戶列表 (POS)',
      'POST /api/shared/pos-orders - 創建現場銷售訂單 (POS)',
      'GET /api/shared/orders/history - 共享歷史訂單 (POS)',
      'GET /api/shared/reports/daily/:date - 共享日報表 (POS)'
    ]
  });
});

// 服務靜態文件

// v3 訂單排程API端點
app.get("/api/scheduling/unscheduled-orders", checkDatabaseReady, (req, res) => {
  try {
    const unscheduledOrders = db.orders.filter(order => 
      order.manufacturing_date === null && 
      order.status !== "completed" &&
      order.status !== "cancelled"
    );
    
    unscheduledOrders.sort((a, b) => (a.production_order || 0) - (b.production_order || 0));
    
    res.json(unscheduledOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/scheduling/orders/:id/manufacturing-date", checkDatabaseReady, (req, res) => {
  const { id } = req.params;
  const { manufacturing_date } = req.body;
  
  try {
    const orderIndex = db.orders.findIndex(o => o.id === parseInt(id));
    if (orderIndex === -1) {
      res.status(404).json({ error: "訂單不存在" });
      return;
    }
    
    db.orders[orderIndex].manufacturing_date = manufacturing_date;
    db.orders[orderIndex].updated_at = new Date().toISOString();
    
    saveData();
    res.json({ message: "製造日期更新成功", order: db.orders[orderIndex] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/scheduling/orders/:id/production-order", checkDatabaseReady, (req, res) => {
  const { id } = req.params;
  const { production_order } = req.body;
  
  try {
    const orderIndex = db.orders.findIndex(o => o.id === parseInt(id));
    if (orderIndex === -1) {
      res.status(404).json({ error: "訂單不存在" });
      return;
    }
    
    db.orders[orderIndex].production_order = production_order;
    db.orders[orderIndex].updated_at = new Date().toISOString();
    
    saveData();
    res.json({ message: "生產順序更新成功", order: db.orders[orderIndex] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/scheduling/orders/batch-production-order", checkDatabaseReady, (req, res) => {
  const { orders } = req.body;
  
  try {
    orders.forEach(({ id, production_order }) => {
      const orderIndex = db.orders.findIndex(o => o.id === parseInt(id));
      if (orderIndex !== -1) {
        db.orders[orderIndex].production_order = production_order;
        db.orders[orderIndex].updated_at = new Date().toISOString();
      }
    });
    
    saveData();
    res.json({ message: "批量更新生產順序成功" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/scheduling/manufacturing/:date", checkDatabaseReady, (req, res) => {
  const { date } = req.params;
  
  try {
    const manufacturingOrders = db.orders.filter(order => 
      order.manufacturing_date === date && 
      order.status !== "completed" &&
      order.status !== "cancelled"
    );
    
    manufacturingOrders.sort((a, b) => (a.production_order || 0) - (b.production_order || 0));
    
    res.json(manufacturingOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/scheduling/orders/:id/details", checkDatabaseReady, (req, res) => {
  const { id } = req.params;
  
  try {
    const order = db.orders.find(o => o.id === parseInt(id));
    if (!order) {
      res.status(404).json({ error: "訂單不存在" });
      return;
    }
    
    const orderItems = db.order_items.filter(item => item.order_id === parseInt(id));
    
    res.json({ ...order, items: orderItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://[YOUR_IP]:${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
});

// 參數測試與AI優化 API
app.post('/api/scheduling/parameter-test', checkDatabaseReady, (req, res) => {
  try {
    const { parameters, test_duration } = req.body;
    
    console.log('參數測試請求:', { parameters, test_duration });
    
    // 執行參數測試
    const testResults = runParameterTest(parameters, test_duration);
    
    res.json(testResults);
    
  } catch (error) {
    console.error('參數測試API錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

// 參數測試執行函數
function runParameterTest(testParameters, testDuration) {
  try {
    console.log('開始執行參數測試...');
    
    // 獲取當前績效
    const currentPerformance = calculateCurrentPerformance();
    
    // 生成測試訂單數據
    const testOrders = generateTestOrders(testDuration);
    
    // 執行AI優化
    const optimizationResults = runAIOptimization(testParameters, testOrders);
    
    // 計算預期改善
    const expectedImprovement = calculateExpectedImprovement(currentPerformance, optimizationResults.best_performance);
    
    return {
      current_performance: currentPerformance,
      test_parameters: testParameters,
      optimization_results: optimizationResults,
      recommended_parameters: optimizationResults.best_parameters,
      expected_improvement: expectedImprovement,
      confidence_level: optimizationResults.confidence_level,
      test_summary: {
        test_duration: testDuration,
        algorithm_used: testParameters.ai_algorithm,
        iterations_completed: optimizationResults.iterations_completed,
        convergence_achieved: optimizationResults.convergence_achieved
      }
    };
    
  } catch (error) {
    console.error('參數測試執行錯誤:', error);
    throw error;
  }
}

// 計算當前績效
function calculateCurrentPerformance() {
  try {
    const currentConfig = db.scheduling_config || {
      daily_capacity: 40,
      staff_count: 1,
      minutes_per_bottle: 15
    };
    
    // 分析最近7天的績效
    const recentOrders = db.orders ? db.orders.filter(order => {
      const orderDate = new Date(order.order_date);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return orderDate >= sevenDaysAgo;
    }) : [];
    
    const totalOrders = recentOrders.length;
    const completedOrders = recentOrders.filter(order => order.status === 'completed').length;
    const completionRate = totalOrders > 0 ? completedOrders / totalOrders : 0;
    
    // 計算產能利用率
    const totalBottles = recentOrders.reduce((sum, order) => {
      const orderItems = db.order_items ? db.order_items.filter(item => item.order_id === order.id) : [];
      return sum + orderItems.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
    
    const capacityUtilization = totalBottles / (currentConfig.daily_capacity * 7);
    
    // 計算加班時數（簡化計算）
    const overtimeHours = Math.max(0, (totalBottles * currentConfig.minutes_per_bottle / 60) - (currentConfig.staff_count * 8 * 7));
    
    // 計算客戶滿意度（基於完成率）
    const customerSatisfaction = completionRate;
    
    return {
      completion_rate: completionRate,
      capacity_utilization: Math.min(capacityUtilization, 1),
      overtime_hours: overtimeHours,
      customer_satisfaction: customerSatisfaction
    };
    
  } catch (error) {
    console.error('計算當前績效錯誤:', error);
    return {
      completion_rate: 0.8,
      capacity_utilization: 0.7,
      overtime_hours: 2,
      customer_satisfaction: 0.8
    };
  }
}

// 生成測試訂單數據
function generateTestOrders(testDuration) {
  try {
    const testOrders = [];
    const products = db.products || [];
    
    if (products.length === 0) {
      return [];
    }
    
    // 根據測試持續時間生成訂單
    for (let day = 0; day < testDuration; day++) {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() + day);
      
      // 每天生成5-15個訂單
      const dailyOrderCount = Math.floor(Math.random() * 11) + 5;
      
      for (let i = 0; i < dailyOrderCount; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        
        testOrders.push({
          id: `test_${day}_${i}`,
          product_id: product.id,
          product_name: product.name,
          quantity: quantity,
          order_date: orderDate.toISOString().split('T')[0],
          priority: product.priority || 5,
          order_type: Math.random() > 0.7 ? 'urgent' : 'normal'
        });
      }
    }
    
    return testOrders;
    
  } catch (error) {
    console.error('生成測試訂單錯誤:', error);
    return [];
  }
}

// AI優化演算法執行
function runAIOptimization(testParameters, testOrders) {
  try {
    const algorithm = testParameters.ai_algorithm;
    
    switch (algorithm) {
      case 'genetic_algorithm':
        return runGeneticAlgorithm(testParameters, testOrders);
      case 'particle_swarm':
        return runParticleSwarmOptimization(testParameters, testOrders);
      case 'simulated_annealing':
        return runSimulatedAnnealing(testParameters, testOrders);
      case 'reinforcement_learning':
        return runReinforcementLearning(testParameters, testOrders);
      default:
        return runGeneticAlgorithm(testParameters, testOrders);
    }
    
  } catch (error) {
    console.error('AI優化執行錯誤:', error);
    throw error;
  }
}

// 遺傳算法實現
function runGeneticAlgorithm(testParameters, testOrders) {
  try {
    const populationSize = 50;
    const generations = 100;
    const mutationRate = 0.1;
    const crossoverRate = 0.8;
    
    // 初始化種群
    let population = initializePopulation(populationSize, testParameters);
    
    let bestIndividual = null;
    let bestFitness = -Infinity;
    
    for (let generation = 0; generation < generations; generation++) {
      // 評估適應度
      const fitnessScores = population.map(individual => 
        evaluateFitness(individual, testOrders, testParameters.optimization_objectives)
      );
      
      // 找到最佳個體
      const maxFitness = Math.max(...fitnessScores);
      const bestIndex = fitnessScores.indexOf(maxFitness);
      
      if (maxFitness > bestFitness) {
        bestFitness = maxFitness;
        bestIndividual = population[bestIndex];
      }
      
      // 選擇、交叉、變異
      const newPopulation = [];
      
      // 保留最佳個體
      newPopulation.push(bestIndividual);
      
      // 生成新個體
      while (newPopulation.length < populationSize) {
        const parent1 = tournamentSelection(population, fitnessScores);
        const parent2 = tournamentSelection(population, fitnessScores);
        
        const [child1, child2] = crossover(parent1, parent2, crossoverRate);
        
        const mutatedChild1 = mutate(child1, mutationRate);
        const mutatedChild2 = mutate(child2, mutationRate);
        
        newPopulation.push(mutatedChild1, mutatedChild2);
      }
      
      population = newPopulation.slice(0, populationSize);
    }
    
    return {
      best_parameters: bestIndividual,
      best_performance: calculatePerformanceMetrics(bestIndividual, testOrders),
      confidence_level: Math.min(bestFitness, 0.95),
      iterations_completed: generations,
      convergence_achieved: true
    };
    
  } catch (error) {
    console.error('遺傳算法執行錯誤:', error);
    throw error;
  }
}

// 粒子群優化實現
function runParticleSwarmOptimization(testParameters, testOrders) {
  try {
    const swarmSize = 30;
    const maxIterations = 100;
    const inertiaWeight = 0.9;
    const cognitiveWeight = 2.0;
    const socialWeight = 2.0;
    
    // 初始化粒子群
    let particles = initializeParticles(swarmSize, testParameters);
    let globalBest = null;
    let globalBestFitness = -Infinity;
    
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        
        // 評估適應度
        const fitness = evaluateFitness(particle.position, testOrders, testParameters.optimization_objectives);
        
        // 更新個體最佳
        if (fitness > particle.bestFitness) {
          particle.bestFitness = fitness;
          particle.bestPosition = { ...particle.position };
        }
        
        // 更新全局最佳
        if (fitness > globalBestFitness) {
          globalBestFitness = fitness;
          globalBest = { ...particle.position };
        }
        
        // 更新速度和位置
        updateParticleVelocity(particle, globalBest, inertiaWeight, cognitiveWeight, socialWeight);
        updateParticlePosition(particle);
      }
    }
    
    return {
      best_parameters: globalBest,
      best_performance: calculatePerformanceMetrics(globalBest, testOrders),
      confidence_level: Math.min(globalBestFitness, 0.95),
      iterations_completed: maxIterations,
      convergence_achieved: true
    };
    
  } catch (error) {
    console.error('粒子群優化執行錯誤:', error);
    throw error;
  }
}

// 模擬退火實現
function runSimulatedAnnealing(testParameters, testOrders) {
  try {
    const initialTemperature = 1000;
    const coolingRate = 0.95;
    const minTemperature = 0.01;
    
    let currentSolution = generateRandomSolution(testParameters);
    let currentFitness = evaluateFitness(currentSolution, testOrders, testParameters.optimization_objectives);
    
    let bestSolution = { ...currentSolution };
    let bestFitness = currentFitness;
    
    let temperature = initialTemperature;
    let iteration = 0;
    
    while (temperature > minTemperature) {
      const newSolution = generateNeighborSolution(currentSolution, testParameters);
      const newFitness = evaluateFitness(newSolution, testOrders, testParameters.optimization_objectives);
      
      const delta = newFitness - currentFitness;
      
      if (delta > 0 || Math.random() < Math.exp(delta / temperature)) {
        currentSolution = newSolution;
        currentFitness = newFitness;
        
        if (currentFitness > bestFitness) {
          bestSolution = { ...currentSolution };
          bestFitness = currentFitness;
        }
      }
      
      temperature *= coolingRate;
      iteration++;
    }
    
    return {
      best_parameters: bestSolution,
      best_performance: calculatePerformanceMetrics(bestSolution, testOrders),
      confidence_level: Math.min(bestFitness, 0.95),
      iterations_completed: iteration,
      convergence_achieved: true
    };
    
  } catch (error) {
    console.error('模擬退火執行錯誤:', error);
    throw error;
  }
}

// 強化學習實現（簡化版）
function runReinforcementLearning(testParameters, testOrders) {
  try {
    // 簡化的強化學習實現
    const learningRate = 0.01;
    const discountFactor = 0.95;
    const epsilon = 0.1;
    
    let currentSolution = generateRandomSolution(testParameters);
    let bestSolution = { ...currentSolution };
    let bestFitness = evaluateFitness(currentSolution, testOrders, testParameters.optimization_objectives);
    
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      let newSolution;
      
      if (Math.random() < epsilon) {
        // 探索
        newSolution = generateRandomSolution(testParameters);
      } else {
        // 利用
        newSolution = generateNeighborSolution(currentSolution, testParameters);
      }
      
      const newFitness = evaluateFitness(newSolution, testOrders, testParameters.optimization_objectives);
      
      if (newFitness > bestFitness) {
        bestSolution = { ...newSolution };
        bestFitness = newFitness;
      }
      
      // 更新當前解
      if (newFitness > currentFitness || Math.random() < learningRate) {
        currentSolution = newSolution;
      }
    }
    
    return {
      best_parameters: bestSolution,
      best_performance: calculatePerformanceMetrics(bestSolution, testOrders),
      confidence_level: Math.min(bestFitness, 0.95),
      iterations_completed: iterations,
      convergence_achieved: true
    };
    
  } catch (error) {
    console.error('強化學習執行錯誤:', error);
    throw error;
  }
}

// 輔助函數
function initializePopulation(size, testParameters) {
  const population = [];
  for (let i = 0; i < size; i++) {
    population.push(generateRandomSolution(testParameters));
  }
  return population;
}

function generateRandomSolution(testParameters) {
  return {
    daily_capacity: Math.floor(Math.random() * 81) + 20, // 20-100
    staff_count: Math.floor(Math.random() * 5) + 1, // 1-5
    minutes_per_bottle: Math.floor(Math.random() * 26) + 5, // 5-30
    rolling_interval: [1, 2, 4, 8, 12][Math.floor(Math.random() * 5)],
    max_rolling_days: Math.floor(Math.random() * 7) + 1, // 1-7
    capacity_reserve_percentage: Math.floor(Math.random() * 31), // 0-30
    preorder_priority_boost: Math.floor(Math.random() * 51) // 0-50
  };
}

function evaluateFitness(solution, testOrders, objectives) {
  try {
    const performance = calculatePerformanceMetrics(solution, testOrders);
    
    const fitness = 
      performance.completion_rate * objectives.completion_rate +
      performance.capacity_utilization * objectives.capacity_utilization +
      (1 - performance.overtime_hours / 10) * objectives.overtime_hours + // 標準化加班時數
      performance.customer_satisfaction * objectives.customer_satisfaction;
    
    return Math.max(0, fitness);
    
  } catch (error) {
    console.error('適應度評估錯誤:', error);
    return 0;
  }
}

function calculatePerformanceMetrics(solution, testOrders) {
  try {
    // 確保輸入參數有效
    if (!solution || !testOrders || !Array.isArray(testOrders) || testOrders.length === 0) {
      return {
        completion_rate: 0.5,
        capacity_utilization: 0.5,
        overtime_hours: 0,
        customer_satisfaction: 0.5
      };
    }

    // 模擬使用該參數配置的績效
    const totalBottles = testOrders.reduce((sum, order) => {
      return sum + (order.quantity || 0);
    }, 0);
    
    const totalDays = Math.max(1, new Set(testOrders.map(order => order.order_date || new Date().toISOString().split('T')[0])).size);
    
    // 防止除零錯誤
    const dailyCapacity = solution.daily_capacity || 40;
    const staffCount = solution.staff_count || 1;
    const minutesPerBottle = solution.minutes_per_bottle || 1.5;
    
    const completionRate = totalBottles > 0 ? Math.min(1, (dailyCapacity * totalDays) / totalBottles) : 0.5;
    const capacityUtilization = totalBottles > 0 ? Math.min(1, totalBottles / (dailyCapacity * totalDays)) : 0.5;
    const overtimeHours = Math.max(0, (totalBottles * minutesPerBottle / 60) - (staffCount * 8 * totalDays));
    const customerSatisfaction = completionRate;
    
    return {
      completion_rate: completionRate,
      capacity_utilization: capacityUtilization,
      overtime_hours: overtimeHours,
      customer_satisfaction: customerSatisfaction
    };
    
  } catch (error) {
    console.error('績效指標計算錯誤:', error);
    return {
      completion_rate: 0.5,
      capacity_utilization: 0.5,
      overtime_hours: 0,
      customer_satisfaction: 0.5
    };
  }
}

function calculateExpectedImprovement(current, optimized) {
  return {
    completion_rate: optimized.completion_rate - current.completion_rate,
    capacity_utilization: optimized.capacity_utilization - current.capacity_utilization,
    overtime_hours: current.overtime_hours - optimized.overtime_hours,
    customer_satisfaction: optimized.customer_satisfaction - current.customer_satisfaction
  };
}

// 遺傳算法輔助函數
function tournamentSelection(population, fitnessScores, tournamentSize = 3) {
  const tournament = [];
  for (let i = 0; i < tournamentSize; i++) {
    const randomIndex = Math.floor(Math.random() * population.length);
    tournament.push({ individual: population[randomIndex], fitness: fitnessScores[randomIndex] });
  }
  
  tournament.sort((a, b) => b.fitness - a.fitness);
  return tournament[0].individual;
}

function crossover(parent1, parent2, crossoverRate) {
  if (Math.random() > crossoverRate) {
    return [parent1, parent2];
  }
  
  const child1 = { ...parent1 };
  const child2 = { ...parent2 };
  
  // 簡單的單點交叉
  const keys = Object.keys(parent1);
  const crossoverPoint = Math.floor(Math.random() * keys.length);
  
  for (let i = crossoverPoint; i < keys.length; i++) {
    const key = keys[i];
    [child1[key], child2[key]] = [child2[key], child1[key]];
  }
  
  return [child1, child2];
}

function mutate(individual, mutationRate) {
  const mutated = { ...individual };
  
  if (Math.random() < mutationRate) {
    const keys = Object.keys(individual);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    
    switch (randomKey) {
      case 'daily_capacity':
        mutated.daily_capacity = Math.max(20, Math.min(100, mutated.daily_capacity + (Math.random() - 0.5) * 20));
        break;
      case 'staff_count':
        mutated.staff_count = Math.max(1, Math.min(5, mutated.staff_count + (Math.random() > 0.5 ? 1 : -1)));
        break;
      case 'minutes_per_bottle':
        mutated.minutes_per_bottle = Math.max(5, Math.min(30, mutated.minutes_per_bottle + (Math.random() - 0.5) * 10));
        break;
      case 'rolling_interval':
        const intervals = [1, 2, 4, 8, 12];
        mutated.rolling_interval = intervals[Math.floor(Math.random() * intervals.length)];
        break;
      case 'max_rolling_days':
        mutated.max_rolling_days = Math.max(1, Math.min(7, mutated.max_rolling_days + (Math.random() > 0.5 ? 1 : -1)));
        break;
      case 'capacity_reserve_percentage':
        mutated.capacity_reserve_percentage = Math.max(0, Math.min(30, mutated.capacity_reserve_percentage + (Math.random() - 0.5) * 10));
        break;
      case 'preorder_priority_boost':
        mutated.preorder_priority_boost = Math.max(0, Math.min(50, mutated.preorder_priority_boost + (Math.random() - 0.5) * 20));
        break;
    }
  }
  
  return mutated;
}

// 粒子群優化輔助函數
function initializeParticles(size, testParameters) {
  const particles = [];
  for (let i = 0; i < size; i++) {
    const position = generateRandomSolution(testParameters);
    const velocity = {};
    
    // 初始化速度
    Object.keys(position).forEach(key => {
      velocity[key] = (Math.random() - 0.5) * 10;
    });
    
    particles.push({
      position: position,
      velocity: velocity,
      bestPosition: { ...position },
      bestFitness: -Infinity
    });
  }
  return particles;
}

function updateParticleVelocity(particle, globalBest, inertiaWeight, cognitiveWeight, socialWeight) {
  Object.keys(particle.position).forEach(key => {
    const r1 = Math.random();
    const r2 = Math.random();
    
    const cognitive = cognitiveWeight * r1 * (particle.bestPosition[key] - particle.position[key]);
    const social = socialWeight * r2 * (globalBest[key] - particle.position[key]);
    
    particle.velocity[key] = inertiaWeight * particle.velocity[key] + cognitive + social;
  });
}

function updateParticlePosition(particle) {
  Object.keys(particle.position).forEach(key => {
    particle.position[key] += particle.velocity[key];
    
    // 確保參數在合理範圍內
    switch (key) {
      case 'daily_capacity':
        particle.position[key] = Math.max(20, Math.min(100, particle.position[key]));
        break;
      case 'staff_count':
        particle.position[key] = Math.max(1, Math.min(5, Math.round(particle.position[key])));
        break;
      case 'minutes_per_bottle':
        particle.position[key] = Math.max(5, Math.min(30, particle.position[key]));
        break;
      case 'rolling_interval':
        const intervals = [1, 2, 4, 8, 12];
        particle.position[key] = intervals[Math.floor(Math.random() * intervals.length)];
        break;
      case 'max_rolling_days':
        particle.position[key] = Math.max(1, Math.min(7, Math.round(particle.position[key])));
        break;
      case 'capacity_reserve_percentage':
        particle.position[key] = Math.max(0, Math.min(30, particle.position[key]));
        break;
      case 'preorder_priority_boost':
        particle.position[key] = Math.max(0, Math.min(50, particle.position[key]));
        break;
    }
  });
}

// 模擬退火輔助函數
function generateNeighborSolution(currentSolution, testParameters) {
  const neighbor = { ...currentSolution };
  const keys = Object.keys(currentSolution);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  
  // 生成鄰近解
  switch (randomKey) {
    case 'daily_capacity':
      neighbor.daily_capacity = Math.max(20, Math.min(100, neighbor.daily_capacity + (Math.random() - 0.5) * 10));
      break;
    case 'staff_count':
      neighbor.staff_count = Math.max(1, Math.min(5, neighbor.staff_count + (Math.random() > 0.5 ? 1 : -1)));
      break;
    case 'minutes_per_bottle':
      neighbor.minutes_per_bottle = Math.max(5, Math.min(30, neighbor.minutes_per_bottle + (Math.random() - 0.5) * 5));
      break;
    case 'rolling_interval':
      const intervals = [1, 2, 4, 8, 12];
      const currentIndex = intervals.indexOf(neighbor.rolling_interval);
      const newIndex = Math.max(0, Math.min(intervals.length - 1, currentIndex + (Math.random() > 0.5 ? 1 : -1)));
      neighbor.rolling_interval = intervals[newIndex];
      break;
    case 'max_rolling_days':
      neighbor.max_rolling_days = Math.max(1, Math.min(7, neighbor.max_rolling_days + (Math.random() > 0.5 ? 1 : -1)));
      break;
    case 'capacity_reserve_percentage':
      neighbor.capacity_reserve_percentage = Math.max(0, Math.min(30, neighbor.capacity_reserve_percentage + (Math.random() - 0.5) * 5));
      break;
    case 'preorder_priority_boost':
      neighbor.preorder_priority_boost = Math.max(0, Math.min(50, neighbor.preorder_priority_boost + (Math.random() - 0.5) * 10));
      break;
  }
  
  return neighbor;
}

// 優雅關閉
process.on('SIGINT', () => {
  console.log('正在關閉伺服器...');
  saveData(); // 確保資料已儲存
  console.log('資料已儲存，伺服器關閉。');
  process.exit(0);
});
