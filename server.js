const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// 靜態檔案處理
if (process.env.NODE_ENV === 'production') {
  // 在 Vercel 上，靜態檔案由 Vercel 處理
  app.use(express.static(path.join(__dirname, 'client/build')));
} else {
  // 本地開發
  app.use(express.static(path.join(__dirname, 'client/build')));
}

// JSON 檔案資料庫
const DATA_FILE = path.join(__dirname, 'data.json');
let db = {};

// 檔案讀寫函數
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      db = JSON.parse(data);
      console.log('資料已從 JSON 檔案載入');
    } else {
      // 如果檔案不存在，創建預設資料
      db = {
        users: [
          { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
          { id: 2, username: 'kitchen', password: 'kitchen123', role: 'kitchen' }
        ],
        customers: [],
        products: [
          { id: 1, name: '蔬果73-元氣綠', price: 120.00, description: '綠色蔬果系列，富含維生素' },
          { id: 2, name: '蔬果73-活力紅', price: 120.00, description: '紅色蔬果系列，抗氧化' },
          { id: 3, name: '蔬果73-亮妍莓', price: 130.00, description: '莓果系列，美容養顏' },
          { id: 4, name: '蔬菜73-幸運果', price: 120.00, description: '黃橘色蔬果系列，提升免疫力' },
          { id: 5, name: '蔬菜100-順暢綠', price: 150.00, description: '100% 綠色蔬菜，促進消化' },
          { id: 6, name: '蔬菜100-養生黑', price: 160.00, description: '100% 黑色養生，滋補強身' },
          { id: 7, name: '蔬菜100-養眼晶(有機枸杞)', price: 180.00, description: '100% 有機枸杞，護眼明目' },
          { id: 8, name: '蔬菜100-法國黑巧70', price: 200.00, description: '100% 法國黑巧克力，濃郁香醇' }
        ],
        orders: [],
        order_items: []
      };
      saveData();
      console.log('已創建預設資料並儲存到 JSON 檔案');
    }
  } catch (error) {
    console.error('載入資料時發生錯誤:', error);
    // 使用預設資料
    db = {
      users: [
        { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
        { id: 2, username: 'kitchen', password: 'kitchen123', role: 'kitchen' }
      ],
      customers: [],
      products: [
        { id: 1, name: '蔬果73-元氣綠', price: 120.00, description: '綠色蔬果系列，富含維生素' },
        { id: 2, name: '蔬果73-活力紅', price: 120.00, description: '紅色蔬果系列，抗氧化' },
        { id: 3, name: '蔬果73-亮妍莓', price: 130.00, description: '莓果系列，美容養顏' },
        { id: 4, name: '蔬菜73-幸運果', price: 120.00, description: '黃橘色蔬果系列，提升免疫力' },
        { id: 5, name: '蔬菜100-順暢綠', price: 150.00, description: '100% 綠色蔬菜，促進消化' },
        { id: 6, name: '蔬菜100-養生黑', price: 160.00, description: '100% 黑色養生，滋補強身' },
        { id: 7, name: '蔬菜100-養眼晶(有機枸杞)', price: 180.00, description: '100% 有機枸杞，護眼明目' },
        { id: 8, name: '蔬菜100-法國黑巧70', price: 200.00, description: '100% 法國黑巧克力，濃郁香醇' }
      ],
      orders: [],
      order_items: []
    };
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
    console.log('資料已儲存到 JSON 檔案');
  } catch (error) {
    console.error('儲存資料時發生錯誤:', error);
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

// 新增產品
app.post('/api/products', (req, res) => {
  const { name, price, description } = req.body;
  
  try {
    const newProduct = {
      id: Math.max(...db.products.map(p => p.id), 0) + 1,
      name,
      price: parseFloat(price),
      description
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
  const { name, price, description } = req.body;
  
  try {
    const productIndex = db.products.findIndex(p => p.id === parseInt(id));
    if (productIndex === -1) {
      res.status(404).json({ error: '產品不存在' });
      return;
    }
    
    db.products[productIndex] = {
      ...db.products[productIndex],
      name,
      price: parseFloat(price),
      description
    };
    
    saveData();
    res.json({ message: '產品更新成功' });
  } catch (error) {
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
    
    db.products.splice(productIndex, 1);
    saveData();
    res.json({ message: '產品刪除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得廚房製作清單 (按產品統計數量)
app.get('/api/kitchen/production/:date', (req, res) => {
  const { date } = req.params;
  
  try {
    // 取得指定日期的訂單
    const orders = db.orders.filter(order => order.order_date === date);
    const orderIds = orders.map(order => order.id);
    
    // 取得這些訂單的項目
    const orderItems = db.order_items.filter(item => orderIds.includes(item.order_id));
    
    // 按產品名稱和單價分組統計
    const productStats = {};
    
    orderItems.forEach(item => {
      const key = `${item.product_name}_${item.unit_price}`;
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
          completed_count: 0
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
    // 取得指定日期的訂單
    const orders = db.orders.filter(order => order.order_date === date);
    const orderIds = orders.map(order => order.id);
    
    // 取得這些訂單的項目
    const orderItems = db.order_items.filter(item => orderIds.includes(item.order_id));
    
    // 按客戶分組並計算金額
    const groupedOrders = {};
    let totalDailyAmount = 0;
    
    orders.forEach(order => {
      const customer = db.customers.find(c => c.id === order.customer_id);
      if (!customer) return;
      
      const customerId = customer.id;
      if (!groupedOrders[customerId]) {
        groupedOrders[customerId] = {
          customer_id: customerId,
          customer_name: customer.name,
          phone: customer.phone,
          address: customer.address,
          source: customer.source,
          order_id: order.id,
          delivery_date: order.delivery_date,
          status: order.status,
          order_notes: order.notes,
          items: [],
          customer_total: 0,
          all_items_completed: true
        };
      }
      
      // 取得該訂單的項目
      const items = orderItems.filter(item => item.order_id === order.id);
      items.forEach(item => {
        const itemTotal = item.quantity * item.unit_price;
        groupedOrders[customerId].items.push({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          item_total: itemTotal,
          special_notes: item.special_notes,
          item_status: item.status
        });
        
        // 檢查是否有未完成的項目
        if (item.status !== 'completed') {
          groupedOrders[customerId].all_items_completed = false;
        }
        
        groupedOrders[customerId].customer_total += itemTotal;
        totalDailyAmount += itemTotal;
      });
    });
    
    res.json({
      orders: Object.values(groupedOrders),
      total_daily_amount: totalDailyAmount
    });
  } catch (error) {
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
  const { name, phone, address, source } = req.body;
  
  try {
    const newCustomer = {
      id: Math.max(...db.customers.map(c => c.id), 0) + 1,
      name,
      phone,
      address,
      source: source || '一般客戶'
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
  const { name, phone, address, source } = req.body;
  
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
      source
    };
    
    saveData();
    res.json({ id: parseInt(id), name, phone, address, source });
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

// 新增訂單
app.post('/api/orders', (req, res) => {
  const { customer_id, order_date, delivery_date, items, notes } = req.body;
  
  try {
    const newOrder = {
      id: Math.max(...db.orders.map(o => o.id), 0) + 1,
      customer_id: parseInt(customer_id),
      order_date,
      delivery_date,
      status: 'pending',
      notes
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
        status: 'pending'
      };
      db.order_items.push(newItem);
    });
    
    saveData();
    res.json({ id: newOrder.id, message: '訂單建立成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新訂單狀態
app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const orderIndex = db.orders.findIndex(o => o.id === parseInt(id));
    if (orderIndex === -1) {
      res.status(404).json({ error: '訂單不存在' });
      return;
    }
    
    db.orders[orderIndex].status = status;
    saveData();
    res.json({ message: '訂單狀態更新成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新產品製作狀態
app.put('/api/kitchen/production/:date/:productName/status', checkDatabaseReady, (req, res) => {
  const { date, productName } = req.params;
  const { status } = req.body;
  
  try {
    // 取得指定日期的訂單
    const orders = db.orders.filter(order => order.order_date === date);
    const orderIds = orders.map(order => order.id);
    
    // 更新該日期該產品的所有訂單項目狀態
    db.order_items.forEach(item => {
      if (orderIds.includes(item.order_id) && item.product_name === productName) {
        item.status = status;
      }
    });
    
    // 檢查該訂單的所有產品是否都已完成，如果是則更新訂單狀態
    orders.forEach(order => {
      const orderItems = db.order_items.filter(item => item.order_id === order.id);
      const total = orderItems.length;
      const completed = orderItems.filter(item => item.status === 'completed').length;
      
      // 如果所有產品都已完成，更新訂單狀態為 completed
      if (total === completed && order.status !== 'completed') {
        const orderIndex = db.orders.findIndex(o => o.id === order.id);
        if (orderIndex !== -1) {
          db.orders[orderIndex].status = 'completed';
        }
      }
    });
    
    saveData();
    res.json({ message: '產品狀態更新成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 取得訂單歷史
app.get('/api/orders/history', (req, res) => {
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
    
    // 加入客戶資訊並排序
    const result = filteredOrders
      .map(order => {
        const customer = db.customers.find(c => c.id === order.customer_id);
        return {
          id: order.id,
          order_date: order.order_date,
          delivery_date: order.delivery_date,
          status: order.status,
          notes: order.notes,
          customer_name: customer ? customer.name : '未知客戶',
          phone: customer ? customer.phone : ''
        };
      })
      .sort((a, b) => new Date(b.order_date) - new Date(a.order_date));
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 根路徑回應
app.get('/', (req, res) => {
  res.json({ 
    message: '訂單管理系統 API 運行中！', 
    version: '1.0.0',
    endpoints: [
      'GET /api/products - 取得產品列表',
      'GET /api/customers - 取得客戶列表',
      'GET /api/kitchen/production/:date - 取得廚房製作清單',
      'GET /api/orders/customers/:date - 取得客戶訂單清單',
      'POST /api/login - 使用者登入'
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
