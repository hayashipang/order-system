const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

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

// 初始化資料庫
let db;
// 暫時使用 SQLite 確保系統正常運作
if (process.env.NODE_ENV === 'production') {
  // 在 Vercel 上使用記憶體資料庫
  db = new sqlite3.Database(':memory:');
} else {
  // 本地開發使用檔案資料庫
  db = new sqlite3.Database('./orders.db');
}

// 資料庫初始化函數
function initializeDatabase() {
  // 使用 SQLite 初始化
  db.serialize(() => {
  // 使用者表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'kitchen',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 客戶表
  db.run(`CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    source TEXT DEFAULT '一般客戶',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 產品表
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 訂單表
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    order_date DATE NOT NULL,
    delivery_date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
  )`);

  // 訂單明細表
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    special_notes TEXT,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY (order_id) REFERENCES orders (id)
  )`);

  // 插入預設使用者資料
  db.run(`INSERT OR IGNORE INTO users (id, username, password, role) VALUES 
    (1, 'admin', 'admin123', 'admin'),
    (2, 'kitchen', 'kitchen123', 'kitchen')`);

  // 插入預設產品資料
  const products = [
    { name: '蔬果73-元氣綠', price: 120.00, description: '綠色蔬果系列，富含維生素' },
    { name: '蔬果73-活力紅', price: 120.00, description: '紅色蔬果系列，抗氧化' },
    { name: '蔬果73-亮妍莓', price: 130.00, description: '莓果系列，美容養顏' },
    { name: '蔬菜73-幸運果', price: 120.00, description: '黃橘色蔬果系列，提升免疫力' },
    { name: '蔬菜100-順暢綠', price: 150.00, description: '100% 綠色蔬菜，促進消化' },
    { name: '蔬菜100-養生黑', price: 160.00, description: '100% 黑色養生，滋補強身' },
    { name: '蔬菜100-養眼晶(有機枸杞)', price: 180.00, description: '100% 有機枸杞，護眼明目' },
    { name: '蔬菜100-法國黑巧70', price: 200.00, description: '100% 法國黑巧克力，濃郁香醇' }
  ];

  products.forEach(product => {
    db.run(`INSERT OR IGNORE INTO products (name, price, description) VALUES (?, ?, ?)`, 
      [product.name, product.price, product.description]);
  });

  // 不再插入預設測試資料，讓使用者自行新增真實客戶和訂單
  });
  console.log('SQLite 資料庫初始化完成');
}

// 資料庫初始化狀態
let dbReady = false;

// 初始化資料庫
initializeDatabase().then(() => {
  console.log('資料庫初始化完成');
  dbReady = true;
}).catch((error) => {
  console.error('資料庫初始化失敗:', error);
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
  
  db.get(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, user) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      if (user) {
        res.json({ 
          success: true, 
          user: { id: user.id, username: user.username, role: user.role }
        });
      } else {
        res.status(401).json({ error: '帳號或密碼錯誤' });
      }
    }
  );
});

// 取得所有產品列表（包含價格）
app.get('/api/products', checkDatabaseReady, (req, res) => {
  db.all('SELECT * FROM products ORDER BY name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 新增產品
app.post('/api/products', (req, res) => {
  const { name, price, description } = req.body;
  
  db.run(
    'INSERT INTO products (name, price, description) VALUES (?, ?, ?)',
    [name, price, description],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, name, price, description });
    }
  );
});

// 更新產品
app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, description } = req.body;
  
  db.run(
    'UPDATE products SET name = ?, price = ?, description = ? WHERE id = ?',
    [name, price, description, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: '產品更新成功' });
    }
  );
});

// 刪除產品
app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: '產品刪除成功' });
  });
});

// 取得廚房製作清單 (按產品統計數量)
app.get('/api/kitchen/production/:date', (req, res) => {
  const { date } = req.params;
  
  const query = `
    SELECT 
      oi.product_name,
      SUM(oi.quantity) as total_quantity,
      oi.unit_price,
      SUM(oi.quantity * oi.unit_price) as total_amount,
      o.order_date,
      o.delivery_date,
      o.status as order_status,
      SUM(CASE WHEN oi.status = 'pending' THEN oi.quantity ELSE 0 END) as pending_quantity,
      SUM(CASE WHEN oi.status = 'completed' THEN oi.quantity ELSE 0 END) as completed_quantity,
      COUNT(CASE WHEN oi.status = 'pending' THEN 1 END) as pending_count,
      COUNT(CASE WHEN oi.status = 'completed' THEN 1 END) as completed_count
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.order_date = ?
    GROUP BY oi.product_name, oi.unit_price
    ORDER BY oi.product_name
  `;
  
  db.all(query, [date], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 取得客戶訂單清單 (按客戶分組)
app.get('/api/orders/customers/:date', (req, res) => {
  const { date } = req.params;
  
  const query = `
    SELECT 
      c.id as customer_id,
      c.name as customer_name,
      c.phone,
      c.address,
      c.source,
      o.id as order_id,
      o.order_date,
      o.delivery_date,
      o.status as order_status,
      o.notes as order_notes,
      oi.product_name,
      oi.quantity,
      oi.unit_price,
      oi.special_notes,
      oi.status as item_status
    FROM customers c
    JOIN orders o ON c.id = o.customer_id
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.order_date = ?
    ORDER BY c.name, oi.product_name
  `;
  
  db.all(query, [date], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 按客戶分組並計算金額
    const groupedOrders = {};
    let totalDailyAmount = 0;
    
    rows.forEach(row => {
      if (!groupedOrders[row.customer_id]) {
        groupedOrders[row.customer_id] = {
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          phone: row.phone,
          address: row.address,
          source: row.source,
          order_id: row.order_id,
          delivery_date: row.delivery_date,
          status: row.order_status,
          order_notes: row.order_notes,
          items: [],
          customer_total: 0,
          all_items_completed: true // 預設為 true，如果有任何項目未完成則設為 false
        };
      }
      
      const itemTotal = row.quantity * row.unit_price;
      groupedOrders[row.customer_id].items.push({
        product_name: row.product_name,
        quantity: row.quantity,
        unit_price: row.unit_price,
        item_total: itemTotal,
        special_notes: row.special_notes,
        item_status: row.item_status
      });
      
      // 檢查是否有未完成的項目
      if (row.item_status !== 'completed') {
        groupedOrders[row.customer_id].all_items_completed = false;
      }
      
      groupedOrders[row.customer_id].customer_total += itemTotal;
      totalDailyAmount += itemTotal;
    });
    
    res.json({
      orders: Object.values(groupedOrders),
      total_daily_amount: totalDailyAmount
    });
  });
});

// 取得一週訂單數量概覽
app.get('/api/orders/weekly/:startDate', (req, res) => {
  const { startDate } = req.params;
  
  // 計算一週的日期範圍
  const start = new Date(startDate);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  // 查詢每一天的訂單數量
  const query = `
    SELECT 
      o.order_date,
      COUNT(DISTINCT o.id) as order_count,
      COUNT(oi.id) as item_count,
      SUM(oi.quantity) as total_quantity
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    WHERE o.order_date IN (${dates.map(() => '?').join(',')})
    GROUP BY o.order_date
    ORDER BY o.order_date
  `;
  
  db.all(query, dates, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
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
    
    // 填入實際資料
    rows.forEach(row => {
      result[row.order_date] = {
        date: row.order_date,
        order_count: row.order_count,
        item_count: row.item_count,
        total_quantity: row.total_quantity
      };
    });
    
    res.json({
      start_date: startDate,
      dates: dates,
      weekly_data: Object.values(result)
    });
  });
});

// 取得所有客戶
// 匯出當日訂單 CSV
app.get('/api/orders/export/:date', (req, res) => {
  const { date } = req.params;
  
  const query = `
    SELECT 
      c.id as customer_id,
      c.name as customer_name,
      c.phone,
      c.address,
      c.source,
      o.id as order_id,
      o.order_date,
      o.delivery_date,
      o.status as order_status,
      o.notes as order_notes,
      oi.product_name,
      oi.quantity,
      oi.unit_price,
      oi.special_notes,
      oi.status as item_status
    FROM customers c
    JOIN orders o ON c.id = o.customer_id
    JOIN order_items oi ON o.id = oi.order_id
    WHERE o.order_date = ?
    ORDER BY c.name, oi.product_name
  `;
  
  db.all(query, [date], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 按客戶分組
    const groupedOrders = {};
    rows.forEach(row => {
      if (!groupedOrders[row.customer_id]) {
        groupedOrders[row.customer_id] = {
          customer_name: row.customer_name,
          phone: row.phone,
          address: row.address,
          source: row.source,
          order_notes: row.order_notes,
          items: []
        };
      }
      
      groupedOrders[row.customer_id].items.push({
        product_name: row.product_name,
        quantity: row.quantity,
        unit_price: row.unit_price,
        item_total: row.quantity * row.unit_price,
        special_notes: row.special_notes,
        item_status: row.item_status
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
  });
});

app.get('/api/customers', checkDatabaseReady, (req, res) => {
  db.all('SELECT * FROM customers ORDER BY name', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 新增客戶
app.post('/api/customers', (req, res) => {
  const { name, phone, address, source } = req.body;
  
  db.run(
    'INSERT INTO customers (name, phone, address, source) VALUES (?, ?, ?, ?)',
    [name, phone, address, source || '一般客戶'],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, name, phone, address, source: source || '一般客戶' });
    }
  );
});

// 更新客戶
app.put('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  const { name, phone, address, source } = req.body;
  
  db.run(
    'UPDATE customers SET name = ?, phone = ?, address = ?, source = ? WHERE id = ?',
    [name, phone, address, source, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: '客戶不存在' });
        return;
      }
      res.json({ id: parseInt(id), name, phone, address, source });
    }
  );
});

// 刪除客戶
app.delete('/api/customers/:id', (req, res) => {
  const { id } = req.params;
  
  // 開始事務
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    // 1. 先刪除該客戶的所有訂單項目
    db.run('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE customer_id = ?)', [id], function(err) {
      if (err) {
        db.run('ROLLBACK');
        res.status(500).json({ error: '刪除訂單項目失敗: ' + err.message });
        return;
      }
    });
    
    // 2. 刪除該客戶的所有訂單
    db.run('DELETE FROM orders WHERE customer_id = ?', [id], function(err) {
      if (err) {
        db.run('ROLLBACK');
        res.status(500).json({ error: '刪除訂單失敗: ' + err.message });
        return;
      }
    });
    
    // 3. 最後刪除客戶
    db.run('DELETE FROM customers WHERE id = ?', [id], function(err) {
      if (err) {
        db.run('ROLLBACK');
        res.status(500).json({ error: '刪除客戶失敗: ' + err.message });
        return;
      }
      
      if (this.changes === 0) {
        db.run('ROLLBACK');
        res.status(404).json({ error: '客戶不存在' });
        return;
      }
      
      // 提交事務
      db.run('COMMIT', function(err) {
        if (err) {
          res.status(500).json({ error: '提交事務失敗: ' + err.message });
          return;
        }
        res.json({ message: '客戶及相關訂單刪除成功' });
      });
    });
  });
});

// 新增訂單
app.post('/api/orders', (req, res) => {
  const { customer_id, order_date, delivery_date, items, notes } = req.body;
  
  db.run(
    'INSERT INTO orders (customer_id, order_date, delivery_date, notes) VALUES (?, ?, ?, ?)',
    [customer_id, order_date, delivery_date, notes],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      const orderId = this.lastID;
      
      // 插入訂單明細
      const stmt = db.prepare('INSERT INTO order_items (order_id, product_name, quantity, unit_price, special_notes) VALUES (?, ?, ?, ?, ?)');
      
      items.forEach(item => {
        stmt.run([orderId, item.product_name, item.quantity, item.unit_price, item.special_notes]);
      });
      
      stmt.finalize();
      
      res.json({ id: orderId, message: '訂單建立成功' });
    }
  );
});

// 更新訂單狀態
app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  db.run(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ message: '訂單狀態更新成功' });
    }
  );
});

// 更新產品製作狀態
app.put('/api/kitchen/production/:date/:productName/status', (req, res) => {
  const { date, productName } = req.params;
  const { status } = req.body;
  
  // 更新該日期該產品的所有訂單項目狀態
  const query = `
    UPDATE order_items 
    SET status = ? 
    WHERE id IN (
      SELECT oi.id 
      FROM order_items oi 
      JOIN orders o ON oi.order_id = o.id 
      WHERE o.order_date = ? AND oi.product_name = ?
    )
  `;
  
  db.run(query, [status, date, productName], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 檢查該訂單的所有產品是否都已完成，如果是則更新訂單狀態
    const checkOrderQuery = `
      SELECT DISTINCT o.id, o.status
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.order_date = ? AND oi.product_name = ?
    `;
    
    db.all(checkOrderQuery, [date, productName], (err, orders) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 檢查每個訂單的所有產品是否都已完成
      orders.forEach(order => {
        const checkAllItemsQuery = `
          SELECT COUNT(*) as total, 
                 COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
          FROM order_items 
          WHERE order_id = ?
        `;
        
        db.get(checkAllItemsQuery, [order.id], (err, result) => {
          if (err) return;
          
          // 如果所有產品都已完成，更新訂單狀態為 completed
          if (result.total === result.completed && order.status !== 'completed') {
            db.run('UPDATE orders SET status = ? WHERE id = ?', ['completed', order.id]);
          }
        });
      });
      
      res.json({ message: '產品狀態更新成功' });
    });
  });
});

// 取得訂單歷史
app.get('/api/orders/history', (req, res) => {
  const { customer_id, start_date, end_date } = req.query;
  
  let query = `
    SELECT 
      o.id,
      o.order_date,
      o.delivery_date,
      o.status,
      o.notes,
      c.name as customer_name,
      c.phone
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (customer_id) {
    query += ' AND o.customer_id = ?';
    params.push(customer_id);
  }
  
  if (start_date) {
    query += ' AND o.order_date >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    query += ' AND o.order_date <= ?';
    params.push(end_date);
  }
  
  query += ' ORDER BY o.order_date DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to view the application`);
});

// 優雅關閉
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});
