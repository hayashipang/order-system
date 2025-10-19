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

// 靜態檔案處理
if (process.env.NODE_ENV === 'production') {
  // 在 Vercel 上，靜態檔案由 Vercel 處理
  app.use(express.static(path.join(__dirname, 'client/build')));
} else {
  // 本地開發
  app.use(express.static(path.join(__dirname, 'client/build')));
}

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
app.get('/api/kitchen/production/:date', (req, res) => {
  const { date } = req.params;
  
  try {
    console.log('請求製作清單日期:', date);
    console.log('所有訂單:', db.orders);
    console.log('所有訂單項目:', db.order_items);
    
    // 取得指定日期的訂單（支援多種日期格式），排除現場訂單
    const orders = db.orders.filter(order => {
      const orderDate = new Date(order.order_date).toISOString().split('T')[0];
      const requestDate = new Date(date).toISOString().split('T')[0];
      const directMatch = order.order_date === date;
      const dateMatch = orderDate === requestDate;
      const isNotWalkin = order.order_type !== 'walk-in'; // 排除現場訂單
      console.log(`訂單 ${order.id}: order_date=${order.order_date}, 直接匹配=${directMatch}, 日期匹配=${dateMatch}, 非現場訂單=${isNotWalkin}`);
      return (directMatch || dateMatch) && isNotWalkin;
    });
    
    console.log('匹配的訂單:', orders);
    const orderIds = orders.map(order => order.id);
    
    // 取得這些訂單的項目
    const orderItems = db.order_items.filter(item => orderIds.includes(item.order_id));
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
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得客戶訂單清單 (按客戶分組)
app.get('/api/orders/customers/:date', (req, res) => {
  const { date } = req.params;
  
  try {
    console.log('請求客戶訂單日期:', date);
    console.log('所有訂單:', db.orders);
    
    // 取得指定日期的訂單（支援多種日期格式）
    const orders = db.orders.filter(order => {
      const orderDate = new Date(order.order_date).toISOString().split('T')[0];
      const requestDate = new Date(date).toISOString().split('T')[0];
      return orderDate === requestDate || order.order_date === date;
    });
    
    console.log('匹配的訂單:', orders);
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
    
    res.json({
      orders: Object.values(groupedOrders),
      totalAmount: totalDailyAmount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
  const { customer_id, order_date, delivery_date, items, notes, shipping_type, shipping_fee, credit_card_fee, shopee_fee } = req.body;
  
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
app.get('/api/kitchen/walkin-orders-list', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('請求現場訂單列表日期:', today);
    
    // 取得當天的現場銷售訂單，按時間倒序排列
    const walkinOrders = db.orders
      .filter(order => {
        const orderDate = new Date(order.order_date).toISOString().split('T')[0];
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
      const orderItems = db.order_items.filter(item => item.order_id === order.id);
      
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
    res.json(result);
  } catch (error) {
    console.error('取得現場訂單列表失敗:', error);
    res.status(500).json({ error: error.message });
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

// 智能排程 API
app.get('/api/scheduling/orders', checkDatabaseReady, (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // 收集所有訂單（預訂訂單 + 現場訂單）
    const allOrders = [];
    
    // 1. 收集預訂訂單
    const preOrders = db.orders.filter(order => 
      order.delivery_date === targetDate && order.status !== 'cancelled'
    );
    
    preOrders.forEach(order => {
      order.items.forEach(item => {
        allOrders.push({
          order_id: order.id,
          order_type: 'preorder',
          customer_name: order.customer_name,
          order_time: order.created_at,
          product_name: item.product_name,
          quantity: item.quantity,
          is_gift: item.is_gift || false,
          priority: getProductPriority(item.product_name)
        });
      });
    });
    
    // 2. 收集現場訂單
    const walkinOrders = db.orders.filter(order => 
      order.order_type === 'walkin' && 
      order.created_at && 
      order.created_at.startsWith(targetDate) &&
      order.status !== 'cancelled'
    );
    
    walkinOrders.forEach(order => {
      order.items.forEach(item => {
        allOrders.push({
          order_id: order.id,
          order_type: 'walkin',
          customer_name: order.customer_name || '現場客戶',
          order_time: order.created_at,
          product_name: item.product_name,
          quantity: item.quantity,
          is_gift: item.is_gift || false,
          priority: getProductPriority(item.product_name)
        });
      });
    });
    
    // 3. 智能排序：先進先出 + 產品優先順序
    const sortedOrders = allOrders.sort((a, b) => {
      // 先按產品優先順序排序（數字越小優先級越高）
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // 相同優先順序時，按訂單時間排序（先進先出）
      return new Date(a.order_time) - new Date(b.order_time);
    });
    
    // 4. 按產品分組
    const productGroups = {};
    sortedOrders.forEach(order => {
      if (!productGroups[order.product_name]) {
        productGroups[order.product_name] = {
          product_name: order.product_name,
          priority: order.priority,
          total_quantity: 0,
          orders: []
        };
      }
      productGroups[order.product_name].total_quantity += order.quantity;
      productGroups[order.product_name].orders.push(order);
    });
    
    // 5. 轉換為陣列並按優先順序排序
    const schedulingResult = Object.values(productGroups).sort((a, b) => a.priority - b.priority);
    
    res.json({
      date: targetDate,
      total_orders: allOrders.length,
      total_products: schedulingResult.length,
      scheduling: schedulingResult
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 輔助函數：取得產品優先順序
function getProductPriority(productName) {
  if (!db.product_priority) {
    return 999; // 預設最低優先順序
  }
  
  const prioritySetting = db.product_priority.find(p => p.product_name === productName);
  return prioritySetting ? prioritySetting.priority : 999;
}

// 根路徑回應
app.get('/', (req, res) => {
  res.json({ 
    message: '訂單管理系統 API 運行中！', 
    version: '1.0.0',
    endpoints: [
      'GET /api/products - 取得產品列表',
      'GET /api/products/priority - 取得產品優先順序設定',
      'PUT /api/products/priority - 更新產品優先順序設定',
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
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  console.log(`Network access: http://[YOUR_IP]:${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
});

// 優雅關閉
process.on('SIGINT', () => {
  console.log('正在關閉伺服器...');
  saveData(); // 確保資料已儲存
  console.log('資料已儲存，伺服器關閉。');
  process.exit(0);
});
