import express from "express";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(bodyParser.json());

// 請求日誌中間件
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  if (req.method === 'POST' && req.path.includes('inventory')) {
    console.log(`📦 POST 請求詳情:`, {
      url: req.url,
      path: req.path,
      headers: req.headers,
      body: req.body
    });
  }
  next();
});

// 處理 OPTIONS 預檢請求
app.options('*', (req, res) => {
  console.log(`🔄 OPTIONS 預檢請求: ${req.path}`);
  res.status(200).end();
});

// JSON database
const DATA_PATH = path.join(process.cwd(), "data.local.json");
if (!fs.existsSync(DATA_PATH)) {
  const defaultData = {
    products: [],
    orders: [],
    customers: [],
    order_items: [],
  };
  fs.writeFileSync(DATA_PATH, JSON.stringify(defaultData, null, 2), "utf8");
  console.log("📁 data.local.json created automatically");
}

const readData = () => {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  } catch (error) {
    console.error("讀取資料失敗:", error);
    return { products: [], orders: [], customers: [], order_items: [] };
  }
};

const writeData = (data) => {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("寫入資料失敗:", error);
  }
};

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: "JSON" });
});

app.get("/api/orders", (req, res) => {
  const db = readData();
  res.json(db.orders || []);
});

// 取得客戶訂單清單 (按客戶分組)
app.get("/api/orders/customers/:date", (req, res) => {
  const { date } = req.params;
  
  try {
    console.log('請求客戶訂單日期:', date);
    const db = readData();
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

// 取得週統計數據（基於訂單建立日期）
app.get("/api/orders/weekly/:startDate", (req, res) => {
  const { startDate } = req.params;
  
  try {
    console.log('請求週統計開始日期:', startDate);
    
    // 計算一週的日期範圍
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    console.log('週統計日期範圍:', start.toISOString().split('T')[0], '到', end.toISOString().split('T')[0]);
    
    const db = readData();
    const weeklyStats = {};
    
    // 遍歷一週的每一天
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // 查詢該日期的訂單（基於 order_date）
      const dayOrders = db.orders.filter(order => {
        if (!order || !order.order_date) return false;
        const orderDate = new Date(order.order_date).toISOString().split('T')[0];
        return orderDate === dateStr;
      });
      
      if (dayOrders.length > 0) {
        console.log(`日期 ${dateStr} 找到 ${dayOrders.length} 個訂單`);
        weeklyStats[dateStr] = {};
        
        // 統計每個產品的數量
        dayOrders.forEach(order => {
          const orderItems = db.order_items.filter(item => item.order_id === order.id);
          orderItems.forEach(item => {
            if (!weeklyStats[dateStr][item.product_name]) {
              weeklyStats[dateStr][item.product_name] = {
                product_name: item.product_name,
                total_quantity: 0,
                unit_price: item.unit_price,
                total_amount: 0
              };
            }
            weeklyStats[dateStr][item.product_name].total_quantity += item.quantity || 0;
            weeklyStats[dateStr][item.product_name].total_amount += (item.quantity || 0) * (item.unit_price || 0);
          });
        });
      } else {
        console.log(`日期 ${dateStr} 沒有訂單數據`);
        weeklyStats[dateStr] = {};
      }
    }
    
    // 返回前端期望的格式
    res.json({
      weekly_data: Object.values(weeklyStats).map((dayData, index) => {
        const date = new Date(start);
        date.setDate(start.getDate() + index);
        const dateStr = date.toISOString().split('T')[0];
        
        // 計算該日期的總數量和總金額
        let totalQuantity = 0;
        let totalAmount = 0;
        let orderCount = 0;
        
        if (weeklyStats[dateStr] && Object.keys(weeklyStats[dateStr]).length > 0) {
          Object.values(weeklyStats[dateStr]).forEach(product => {
            totalQuantity += product.total_quantity || 0;
            totalAmount += product.total_amount || 0;
            orderCount += 1;
          });
        }
        
        return {
          date: dateStr,
          total_quantity: totalQuantity,
          total_amount: totalAmount,
          order_count: orderCount,
          products: weeklyStats[dateStr] || {}
        };
      })
    });
  } catch (error) {
    console.error('週統計錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/orders", (req, res) => {
  try {
    const orderData = req.body;
    const db = readData();
    
    // 生成新 ID
    const newId = Date.now();
    const newOrder = {
      id: newId,
      ...orderData,
      status: orderData.status || 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.orders = db.orders || [];
    db.orders.push(newOrder);
    writeData(db);
    
    console.log(`✅ 新增訂單: ${newOrder.customer_name || '客戶'} (ID: ${newId})`);
    res.json({ success: true, order: newOrder });
  } catch (error) {
    console.error("新增訂單錯誤:", error);
    res.status(500).json({ success: false, message: "新增訂單失敗" });
  }
});

app.put("/api/orders/:id", (req, res) => {
  try {
    const { id } = req.params;
    const orderData = req.body;
    const db = readData();
    
    const orderIndex = db.orders.findIndex(o => o.id == id);
    if (orderIndex === -1) {
      return res.status(404).json({ success: false, message: "訂單不存在" });
    }
    
    db.orders[orderIndex] = {
      ...db.orders[orderIndex],
      ...orderData,
      updated_at: new Date().toISOString()
    };
    
    writeData(db);
    console.log(`✅ 更新訂單: ${db.orders[orderIndex].customer_name || '客戶'} (ID: ${id})`);
    res.json({ success: true, order: db.orders[orderIndex] });
  } catch (error) {
    console.error("更新訂單錯誤:", error);
    res.status(500).json({ success: false, message: "更新訂單失敗" });
  }
});

app.delete("/api/orders/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = readData();
    
    const orderIndex = db.orders.findIndex(o => o.id == id);
    if (orderIndex === -1) {
      return res.status(404).json({ success: false, message: "訂單不存在" });
    }
    
    const deletedOrder = db.orders[orderIndex];
    db.orders.splice(orderIndex, 1);
    writeData(db);
    
    console.log(`✅ 刪除訂單: ${deletedOrder.customer_name || '客戶'} (ID: ${id})`);
    res.json({ success: true, message: "訂單已刪除" });
  } catch (error) {
    console.error("刪除訂單錯誤:", error);
    res.status(500).json({ success: false, message: "刪除訂單失敗" });
  }
});

app.get("/api/orders/history", (req, res) => {
  const db = readData();
  res.json(db.orders || []);
});

app.get("/api/products", (req, res) => {
  const db = readData();
  res.json(db.products || []);
});

app.post("/api/products", (req, res) => {
  try {
    const productData = req.body;
    const db = readData();
    
    // 生成新 ID
    const newId = Date.now();
    const newProduct = {
      id: newId,
      name: productData.name || productData.product_name || "未命名產品",
      price: productData.price || 0,
      description: productData.description || "",
      current_stock: productData.current_stock || 0,
      min_stock: productData.min_stock || 0,
      max_stock: productData.max_stock || 1000,
      unit: productData.unit || "個",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.products = db.products || [];
    db.products.push(newProduct);
    writeData(db);
    
    console.log(`✅ 新增產品: ${newProduct.name} (ID: ${newId})`);
    res.json({ success: true, product: newProduct });
  } catch (error) {
    console.error("新增產品錯誤:", error);
    res.status(500).json({ success: false, message: "新增產品失敗" });
  }
});

app.put("/api/products/:id", (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;
    const db = readData();
    
    const productIndex = db.products.findIndex(p => p.id == id);
    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: "產品不存在" });
    }
    
    db.products[productIndex] = {
      ...db.products[productIndex],
      ...productData,
      updated_at: new Date().toISOString()
    };
    
    writeData(db);
    console.log(`✅ 更新產品: ${db.products[productIndex].name} (ID: ${id})`);
    res.json({ success: true, product: db.products[productIndex] });
  } catch (error) {
    console.error("更新產品錯誤:", error);
    res.status(500).json({ success: false, message: "更新產品失敗" });
  }
});

app.delete("/api/products/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = readData();
    
    const productIndex = db.products.findIndex(p => p.id == id);
    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: "產品不存在" });
    }
    
    const deletedProduct = db.products[productIndex];
    db.products.splice(productIndex, 1);
    writeData(db);
    
    console.log(`✅ 刪除產品: ${deletedProduct.name} (ID: ${id})`);
    res.json({ success: true, message: "產品已刪除" });
  } catch (error) {
    console.error("刪除產品錯誤:", error);
    res.status(500).json({ success: false, message: "刪除產品失敗" });
  }
});

app.get("/api/customers", (req, res) => {
  const db = readData();
  res.json(db.customers || []);
});

app.post("/api/customers", (req, res) => {
  try {
    const customerData = req.body;
    const db = readData();
    
    // 生成新 ID
    const newId = Date.now();
    const newCustomer = {
      id: newId,
      ...customerData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.customers = db.customers || [];
    db.customers.push(newCustomer);
    writeData(db);
    
    console.log(`✅ 新增客戶: ${newCustomer.name || newCustomer.customer_name} (ID: ${newId})`);
    res.json({ success: true, customer: newCustomer });
  } catch (error) {
    console.error("新增客戶錯誤:", error);
    res.status(500).json({ success: false, message: "新增客戶失敗" });
  }
});

app.put("/api/customers/:id", (req, res) => {
  try {
    const { id } = req.params;
    const customerData = req.body;
    const db = readData();
    
    const customerIndex = db.customers.findIndex(c => c.id == id);
    if (customerIndex === -1) {
      return res.status(404).json({ success: false, message: "客戶不存在" });
    }
    
    db.customers[customerIndex] = {
      ...db.customers[customerIndex],
      ...customerData,
      updated_at: new Date().toISOString()
    };
    
    writeData(db);
    console.log(`✅ 更新客戶: ${db.customers[customerIndex].name || db.customers[customerIndex].customer_name} (ID: ${id})`);
    res.json({ success: true, customer: db.customers[customerIndex] });
  } catch (error) {
    console.error("更新客戶錯誤:", error);
    res.status(500).json({ success: false, message: "更新客戶失敗" });
  }
});

app.delete("/api/customers/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = readData();
    
    const customerIndex = db.customers.findIndex(c => c.id == id);
    if (customerIndex === -1) {
      return res.status(404).json({ success: false, message: "客戶不存在" });
    }
    
    const deletedCustomer = db.customers[customerIndex];
    db.customers.splice(customerIndex, 1);
    writeData(db);
    
    console.log(`✅ 刪除客戶: ${deletedCustomer.name || deletedCustomer.customer_name} (ID: ${id})`);
    res.json({ success: true, message: "客戶已刪除" });
  } catch (error) {
    console.error("刪除客戶錯誤:", error);
    res.status(500).json({ success: false, message: "刪除客戶失敗" });
  }
});

app.get("/api/order-items", (req, res) => {
  const db = readData();
  res.json(db.order_items || []);
});

app.post("/api/order-items", (req, res) => {
  try {
    const orderItemData = req.body;
    const db = readData();
    
    // 生成新 ID
    const newId = Date.now();
    const newOrderItem = {
      id: newId,
      ...orderItemData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    db.order_items = db.order_items || [];
    db.order_items.push(newOrderItem);
    writeData(db);
    
    console.log(`✅ 新增訂單項目: ${newOrderItem.product_name} (ID: ${newId})`);
    res.json({ success: true, orderItem: newOrderItem });
  } catch (error) {
    console.error("新增訂單項目錯誤:", error);
    res.status(500).json({ success: false, message: "新增訂單項目失敗" });
  }
});

app.put("/api/order-items/:id", (req, res) => {
  try {
    const { id } = req.params;
    const orderItemData = req.body;
    const db = readData();
    
    const orderItemIndex = db.order_items.findIndex(oi => oi.id == id);
    if (orderItemIndex === -1) {
      return res.status(404).json({ success: false, message: "訂單項目不存在" });
    }
    
    db.order_items[orderItemIndex] = {
      ...db.order_items[orderItemIndex],
      ...orderItemData,
      updated_at: new Date().toISOString()
    };
    
    writeData(db);
    console.log(`✅ 更新訂單項目: ${db.order_items[orderItemIndex].product_name} (ID: ${id})`);
    res.json({ success: true, orderItem: db.order_items[orderItemIndex] });
  } catch (error) {
    console.error("更新訂單項目錯誤:", error);
    res.status(500).json({ success: false, message: "更新訂單項目失敗" });
  }
});

app.delete("/api/order-items/:id", (req, res) => {
  try {
    const { id } = req.params;
    const db = readData();
    
    const orderItemIndex = db.order_items.findIndex(oi => oi.id == id);
    if (orderItemIndex === -1) {
      return res.status(404).json({ success: false, message: "訂單項目不存在" });
    }
    
    const deletedOrderItem = db.order_items[orderItemIndex];
    db.order_items.splice(orderItemIndex, 1);
    writeData(db);
    
    console.log(`✅ 刪除訂單項目: ${deletedOrderItem.product_name} (ID: ${id})`);
    res.json({ success: true, message: "訂單項目已刪除" });
  } catch (error) {
    console.error("刪除訂單項目錯誤:", error);
    res.status(500).json({ success: false, message: "刪除訂單項目失敗" });
  }
});

app.get("/api/orders/uncompleted", (req, res) => {
  const db = readData();
  const uncompleted = (db.orders || []).filter((o) => o.status !== "completed");
  res.json(uncompleted);
});

app.get("/api/shipping-fee", (req, res) => {
  // 預設運費設定
  const shippingFee = {
    free_shipping_threshold: 1000, // 免運門檻
    standard_fee: 100, // 標準運費
    express_fee: 200, // 急件運費
    pickup_fee: 0 // 自取免運費
  };
  res.json(shippingFee);
});

app.post("/api/shipping-fee", (req, res) => {
  try {
    const feeData = req.body;
    const db = readData();
    
    // 儲存運費設定到資料庫
    db.shipping_fee = {
      ...feeData,
      updated_at: new Date().toISOString()
    };
    
    writeData(db);
    console.log("✅ 運費設定已更新");
    res.json({ success: true, message: "運費設定已更新" });
  } catch (error) {
    console.error("更新運費設定錯誤:", error);
    res.status(500).json({ success: false, message: "更新運費設定失敗" });
  }
});

app.put("/api/shipping-fee", (req, res) => {
  try {
    const feeData = req.body;
    const db = readData();
    
    // 儲存運費設定到資料庫
    db.shipping_fee = {
      ...feeData,
      updated_at: new Date().toISOString()
    };
    
    writeData(db);
    console.log("✅ 運費設定已更新 (PUT)");
    res.json({ success: true, message: "運費設定已更新" });
  } catch (error) {
    console.error("更新運費設定錯誤:", error);
    res.status(500).json({ success: false, message: "更新運費設定失敗" });
  }
});

// 庫存交易 API
// 新增或異動庫存（含同步更新 products）- 支援多種格式
app.post("/api/inventory/transaction", (req, res) => {
  try {
    const { product_name, change, note, product_id, transaction_type, quantity, notes } = req.body;

    let productName, changeAmount, noteText;

    // 支援兩種格式：新格式 (product_name, change) 和舊格式 (product_id, transaction_type, quantity)
    if (product_name && typeof change === "number") {
      // 新格式
      productName = product_name;
      changeAmount = change;
      noteText = note || "";
    } else if (product_id && transaction_type && quantity) {
      // 舊格式 - 前端 AdminPanel 使用的格式
      const db = readData();
      const product = db.products.find(p => p.id === parseInt(product_id));
      if (!product) {
        return res.status(404).json({ error: "產品不存在" });
      }
      productName = product.name;
      const quantityNum = parseInt(quantity);
      changeAmount = transaction_type === 'in' ? quantityNum : -quantityNum;
      noteText = notes || "";
    } else {
      return res.status(400).json({ error: "Missing or invalid parameters" });
    }

    const db = readData();
    db.products = db.products || [];

    // 找出目標產品
    let product = db.products.find(
      (p) => p.name === productName || p.product_name === productName
    );

    if (!product) {
      // 若不存在則新增一筆產品（確保同步）
      product = {
        id: Date.now(),
        name: productName,
        product_name: productName,
        current_stock: 0,
        scheduled: 0,
        price: 0,
        min_stock: 0,
        max_stock: 1000,
        unit: "個",
        description: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.products.push(product);
      console.log(`🆕 新增產品：${productName}`);
    }

    // 更新庫存數
    const oldStock = Number(product.current_stock || 0);
    product.current_stock = oldStock + Number(changeAmount);
    product.last_update = new Date().toISOString();
    product.note = noteText;

    // 同步更新 db 內其他欄位（確保 products API 也會即時反映）
    db.last_sync = new Date().toISOString();
    writeData(db);

    console.log(
      `📦 庫存異動 → ${productName} (${changeAmount > 0 ? "+" : ""}${changeAmount})，目前庫存：${product.current_stock}`
    );

    res.json({
      success: true,
      product_name: productName,
      old_stock: oldStock,
      new_stock: product.current_stock,
      last_update: product.last_update,
      last_sync: db.last_sync,
    });
  } catch (err) {
    console.error("❌ 庫存異動失敗:", err);
    res.status(500).json({ error: "Failed to update inventory" });
  }
});

// 庫存交易 GET 方法（前端可能錯誤使用 GET）
app.get("/api/inventory/transaction", (req, res) => {
  console.log(`⚠️ 前端使用了錯誤的 GET 方法，應該使用 POST`);
  res.status(405).json({ 
    success: false, 
    message: "請使用 POST 方法進行庫存交易",
    correct_method: "POST",
    example: {
      method: "POST",
      url: "/api/inventory/transaction",
      body: {
        product_name: "產品名稱",
        quantity: 10,
        type: "in",
        reason: "進貨"
      }
    }
  });
});

// 庫存查詢 API
app.get("/api/inventory", (req, res) => {
  try {
    const db = readData();
    const inventory = (db.products || []).map(p => ({
      id: p.id,
      product_name: p.name, // 前端可能期望 product_name
      name: p.name, // 保留 name 欄位
      current_stock: p.current_stock || 0,
      min_stock: p.min_stock || 0,
      max_stock: p.max_stock || 1000,
      unit: p.unit || '個',
      price: p.price || 0,
      description: p.description || '',
      updated_at: p.updated_at || p.created_at,
      last_updated: p.updated_at || p.created_at // 前端可能期望 last_updated
    }));
    
    console.log(`📦 庫存查詢: ${inventory.length} 個產品`);
    res.json(inventory);
  } catch (error) {
    console.error("查詢庫存錯誤:", error);
    res.status(500).json({ success: false, message: "查詢庫存失敗" });
  }
});

// 批量更新庫存
app.put("/api/inventory", (req, res) => {
  try {
    const { updates } = req.body; // 期望格式: [{product_name, current_stock}, ...]
    const db = readData();
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({ success: false, message: "更新資料格式錯誤" });
    }
    
    let updatedCount = 0;
    updates.forEach(update => {
      const product = db.products.find(p => p.name === update.product_name);
      if (product) {
        product.current_stock = update.current_stock || 0;
        product.updated_at = new Date().toISOString();
        updatedCount++;
        console.log(`📦 更新庫存: ${product.name} → ${product.current_stock}`);
      }
    });
    
    writeData(db);
    console.log(`✅ 批量更新庫存: ${updatedCount} 個產品`);
    res.json({ success: true, message: `已更新 ${updatedCount} 個產品的庫存` });
  } catch (error) {
    console.error("批量更新庫存錯誤:", error);
    res.status(500).json({ success: false, message: "批量更新庫存失敗" });
  }
});

// 重置所有庫存為 0
// 重置所有庫存
app.post("/api/inventory/reset", (req, res) => {
  try {
    const db = readData();
    db.products = (db.products || []).map((p) => ({
      ...p,
      current_stock: 0,
      scheduled: 0,
      last_update: new Date().toISOString(),
    }));

    db.last_sync = new Date().toISOString();
    writeData(db);

    console.log("🧹 所有產品庫存已重置為 0");
    res.json({
      success: true,
      message: "所有產品庫存已重置為 0",
      total: db.products.length,
      last_sync: db.last_sync,
    });
  } catch (err) {
    console.error("❌ 重置庫存失敗:", err);
    res.status(500).json({ error: "Failed to reset inventory" });
  }
});

// 重置所有庫存
app.delete("/api/inventory", (req, res) => {
  try {
    const db = readData();
    let resetCount = 0;
    
    db.products.forEach(product => {
      product.current_stock = 0;
      product.updated_at = new Date().toISOString();
      resetCount++;
    });
    
    writeData(db);
    console.log(`✅ 已重置所有庫存: ${resetCount} 個產品`);
    res.json({ success: true, message: `已重置 ${resetCount} 個產品的庫存` });
  } catch (error) {
    console.error("重置庫存錯誤:", error);
    res.status(500).json({ success: false, message: "重置庫存失敗" });
  }
});

// 修復產品資料結構（添加缺少的欄位）
app.post("/api/products/fix", (req, res) => {
  try {
    const db = readData();
    let fixedCount = 0;
    
    db.products.forEach(product => {
      // 添加缺少的欄位
      if (product.min_stock === undefined) {
        product.min_stock = 0;
        fixedCount++;
      }
      if (product.max_stock === undefined) {
        product.max_stock = 1000;
        fixedCount++;
      }
      if (product.unit === undefined) {
        product.unit = "個";
        fixedCount++;
      }
      if (product.current_stock === undefined) {
        product.current_stock = 0;
        fixedCount++;
      }
      product.updated_at = new Date().toISOString();
    });
    
    writeData(db);
    console.log(`✅ 修復產品資料: ${fixedCount} 個欄位`);
    res.json({ success: true, message: `已修復 ${fixedCount} 個產品欄位` });
  } catch (error) {
    console.error("修復產品資料錯誤:", error);
    res.status(500).json({ success: false, message: "修復產品資料失敗" });
  }
});

// 更新產品清單（新增或修改）
app.post("/api/products/update", (req, res) => {
  try {
    const { products } = req.body;
    if (!Array.isArray(products)) {
      return res.status(400).json({ error: "Invalid products format" });
    }

    const db = readData();
    db.products = products.map((p) => ({
      ...p,
      current_stock: Number(p.current_stock || 0),
      scheduled: Number(p.scheduled || 0),
      last_update: new Date().toISOString(),
    }));

    writeData(db);

    console.log(`🧩 產品資料已更新 (${products.length} 項)`);
    res.json({ success: true, total: products.length });
  } catch (err) {
    console.error("❌ 更新產品失敗:", err);
    res.status(500).json({ error: "Failed to update products" });
  }
});

// 庫存交易歷史
app.get("/api/inventory/transactions", (req, res) => {
  try {
    const db = readData();
    const transactions = db.inventory_transactions || [];
    res.json(transactions.reverse()); // 最新的在前
  } catch (error) {
    console.error("查詢庫存交易歷史錯誤:", error);
    res.status(500).json({ success: false, message: "查詢庫存交易歷史失敗" });
  }
});

// 重置庫存交易歷史
app.delete("/api/inventory/transactions/reset", (req, res) => {
  try {
    const db = readData();
    const transactionCount = (db.inventory_transactions || []).length;
    
    db.inventory_transactions = [];
    writeData(db);
    
    console.log(`✅ 已重置庫存交易歷史，清除 ${transactionCount} 筆記錄`);
    res.json({ 
      success: true, 
      message: `已清除 ${transactionCount} 筆庫存交易記錄`,
      cleared_count: transactionCount
    });
  } catch (error) {
    console.error("重置庫存交易歷史錯誤:", error);
    res.status(500).json({ success: false, message: "重置庫存交易歷史失敗" });
  }
});

app.get("/api/inventory/scheduling", (req, res) => {
  try {
    const db = readData();
    const products = Array.isArray(db.products) ? db.products : [];

    // 確保每個產品都有基本欄位
    const inventory = products.map((p) => ({
      id: p.id || null,
      name: p.name || p.product_name || "未命名商品",
      product_name: p.name || p.product_name || "未命名商品",
      current_stock: Number(p.current_stock || 0),
      scheduled: Number(p.scheduled || 0),
      last_update: p.last_update || "-",
      status:
        Number(p.current_stock || 0) > 0
          ? "庫存正常"
          : "⚠️ 庫存不足",
    }));

    console.log(`📦 /api/inventory/scheduling → ${inventory.length} items`);
    res.json(inventory);
  } catch (err) {
    console.error("❌ 讀取庫存發生錯誤:", err);
    res.status(500).json({
      error: "Failed to load inventory",
      message: err.message,
    });
  }
});

// 取得指定日期的訂單列表
app.get("/api/scheduling/dates/:date/orders", (req, res) => {
  try {
    const date = req.params.date;
    const db = readData();
    const orders = Array.isArray(db.orders) ? db.orders : [];
    const customers = Array.isArray(db.customers) ? db.customers : [];
    
    // 篩選該日期的訂單（優先使用production_date，如果沒有則使用order_date）
    // 只排除明確完成的訂單，允許 scheduled 狀態顯示
    const dayOrders = orders.filter(order => 
      (order.production_date === date || order.order_date === date) &&
      order.scheduling_status !== 'completed'  // 只排除明確標記為 completed 的排程
    );
    
    console.log(`📅 ${date} 找到 ${dayOrders.length} 個訂單，狀態分布:`, 
      dayOrders.map(o => ({ id: o.id, status: o.status, scheduling_status: o.scheduling_status }))
    );
    
    // 合併客戶資料和訂單項目
    const ordersWithCustomer = dayOrders.map(order => {
      const customer = customers.find(c => String(c.id) === String(order.customer_id));
      
      // 優先使用訂單中的 items 欄位，如果沒有則從 order_items 表查找
      let orderItems = [];
      if (order.items && Array.isArray(order.items)) {
        orderItems = order.items;
      } else {
        orderItems = Array.isArray(db.order_items) ? 
          db.order_items.filter(item => item.order_id === order.id) : [];
        orderItems = orderItems.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          special_notes: item.special_notes,
          is_gift: item.is_gift || false
        }));
      }
      
      return {
        ...order,
        customer_name: customer ? customer.name : '現場訂單',
        items: orderItems
      };
    });
    
    res.json({ orders: ordersWithCustomer });
  } catch (error) {
    console.error('取得日期訂單失敗:', error);
    res.status(500).json({ error: '取得日期訂單失敗' });
  }
});

// 刪除指定日期的排程
app.delete("/api/scheduling/delete/:date", (req, res) => {
  try {
    const date = req.params.date;
    
    console.log(`🗑️ 刪除日期 ${date} 的排程`);
    
    const db = readData();
    
    // 找到該日期的所有排程訂單（包括主排程單）
    const scheduledOrders = db.orders.filter(order => 
      order.production_date === date
    );
    
    // 找到主排程單
    const masterSchedules = scheduledOrders.filter(order => 
      order.id && order.id.toString().startsWith('schedule_')
    );
    
    // 找到被主排程單合併的客戶訂單
    const mergedOrders = [];
    masterSchedules.forEach(master => {
      if (master.merged_orders) {
        master.merged_orders.forEach(orderId => {
          const order = db.orders.find(o => o.id === orderId);
          if (order) {
            mergedOrders.push(order);
          }
        });
      }
    });
    
    console.log(`找到 ${masterSchedules.length} 個主排程單`);
    console.log(`找到 ${mergedOrders.length} 個被合併的客戶訂單`);
    
    // 完全刪除主排程單
    db.orders = db.orders.filter(order => 
      !(order.id && order.id.toString().startsWith('schedule_') && order.production_date === date)
    );
    
    // 重置被合併的客戶訂單狀態（但保留訂單本身）
    mergedOrders.forEach(order => {
      order.status = 'pending';
      order.scheduling_status = 'unscheduled';
      order.production_date = null;
      order.linked_schedule_id = null;
      delete order.scheduled_items;
      delete order.scheduled_at;
    });
    
    // 清除該日期的排程記錄
    if (db.scheduled_orders) {
      db.scheduled_orders = db.scheduled_orders.filter(scheduled => 
        scheduled.production_date !== date
      );
    }
    
    // 清除該日期的庫存交易記錄
    if (db.inventory_transactions) {
      db.inventory_transactions = db.inventory_transactions.filter(transaction => 
        transaction.date !== date || transaction.type !== 'manufacturing'
      );
    }
    
    // 清除該日期的排程數據
    if (db.scheduling && db.scheduling[date]) {
      delete db.scheduling[date];
      console.log(`清除排程數據: ${date}`);
    }
    
    // 儲存資料
    writeData(db);
    console.log(`🗑️ 已完全刪除 ${date} 的排程：${masterSchedules.length} 個主排程單 + ${mergedOrders.length} 個客戶訂單`);
    
    res.json({ 
      success: true, 
      message: `已刪除日期 ${date} 的所有排程`,
      deletedOrders: scheduledOrders.length
    });
    
  } catch (error) {
    console.error('刪除排程失敗:', error);
    res.status(500).json({ error: '刪除排程失敗' });
  }
});

// 合併訂單排程 API（最終穩定版）
app.post("/api/scheduling/confirm", (req, res) => {
  try {
    const { orderIds, selectedDate, manufacturingQuantities } = req.body;
    console.log('🚀 [Confirm] 開始排程:', { orderIds, selectedDate, manufacturingQuantities });

    if (!orderIds?.length) {
      return res.status(400).json({ success: false, message: '請選擇要排程的訂單' });
    }
    if (!selectedDate) {
      return res.status(400).json({ success: false, message: '請選擇生產日期' });
    }

    // 1️⃣ 載入最新資料
    const db = readData();
    if (!db.orders) db.orders = [];

    // 2️⃣ 清除同日期舊主排程單（防止重複）
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

    // 3️⃣ 找出要排程的訂單
    const ordersToSchedule = db.orders.filter(o => orderIds.includes(o.id));
    if (!ordersToSchedule.length) {
      return res.status(400).json({ success: false, message: '找不到要排程的訂單' });
    }

    // 4️⃣ 建立合併後的排程項目
    const mergedScheduledItems = Object.entries(manufacturingQuantities).map(([productName, qty]) => ({
      product_name: productName,
      scheduled_quantity: Number(qty) || 0,
      completed_quantity: 0,
      status: 'scheduled'
    }));

    // 5️⃣ 建立主排程單
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

    // 6️⃣ 更新子訂單狀態
    ordersToSchedule.forEach(o => {
      o.status = 'scheduled';
      o.scheduling_status = 'merged';
      o.linked_schedule_id = masterSchedule.id;
      o.production_date = selectedDate;
      o.scheduled_at = new Date().toISOString();
    });

    // 7️⃣ 實際保存
    writeData(db);

    // ✅ Debug 確認：查看主排程是否成功寫入
    const verify = db.orders.filter(o =>
      o.production_date === selectedDate &&
      Array.isArray(o.merged_orders) &&
      o.merged_orders.length > 0 &&
      !o.linked_schedule_id
    );
    console.log(`✅ [Confirm] 已建立主排程 ${masterSchedule.id}，驗證結果：`, verify);

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

app.get("/api/kitchen/production/:date", (req, res) => {
  try {
    const { date } = req.params;
    const db = readData();
    
    // 只抓主排程單
    const schedules = db.orders.filter(o =>
      o.production_date === date &&
      Array.isArray(o.merged_orders) &&
      o.merged_orders.length > 0 &&
      !o.linked_schedule_id
    );

    console.log(`🍳 [Kitchen] ${date} 主排程檢查結果：${schedules.length} 筆`);
    schedules.forEach(s =>
      console.log(`→ ${s.id}: ${s.scheduled_items?.map(i => `${i.product_name}×${i.scheduled_quantity}`).join(', ')}`)
    );

    if (!schedules.length) {
      console.log('沒有主排程單');
      return res.json([]);
    }

    // 統計產品總數
    const productStats = {};
    schedules.forEach(schedule => {
      schedule.scheduled_items.forEach(item => {
        const name = item.product_name;
        if (!productStats[name]) {
          productStats[name] = {
            product_name: name,
            total_quantity: 0,
            completed_quantity: 0,
          };
        }
        productStats[name].total_quantity += Number(item.scheduled_quantity || 0);
        productStats[name].completed_quantity += Number(item.completed_quantity || 0);
      });
    });

    Object.values(productStats).forEach(p => {
      p.pending_quantity = Math.max(0, p.total_quantity - p.completed_quantity);
    });

    console.log('🍳 [Kitchen] 產品統計:', Object.values(productStats));
    res.json(Object.values(productStats));
  } catch (error) {
    console.error("廚房生產查詢錯誤:", error);
    res.status(500).json([]);
  }
});

app.put("/api/kitchen/production/:date/:productName/status", (req, res) => {
  try {
    const { date, productName } = req.params;
    const { status } = req.body;
    const decodedProductName = decodeURIComponent(productName);
    
    console.log('📦 Kitchen 標記完成請求:', { date, productName: decodedProductName, status });
    
    const db = readData();
    const orders = db.orders || [];
    const products = db.products || [];
    
    // 找出主排程單
    const mainSchedules = orders.filter(o =>
      o.production_date === date &&
      Array.isArray(o.merged_orders) &&
      o.merged_orders.length > 0 &&
      !o.linked_schedule_id
    );
    
    console.log(`🔍 找到 ${mainSchedules.length} 個主排程單`);
    
    if (!mainSchedules.length) {
      console.warn(`⚠️ 找不到 ${date} 的主排程單`);
      return res.status(400).json({ error: '找不到主排程單' });
    }
    
    // 計算該產品的總排程數量
    let totalScheduledQuantity = 0;
    mainSchedules.forEach(order => {
      order.scheduled_items?.forEach(item => {
        if (item.product_name === decodedProductName) {
          totalScheduledQuantity += item.scheduled_quantity || 0;
        }
      });
    });
    
    console.log(`📦 ${date} ${decodedProductName} 總排程數量 = ${totalScheduledQuantity}`);
    
    // 更新主排程狀態
    mainSchedules.forEach(order => {
      order.status = status;
      order.scheduling_status = status;
      order.scheduled_items?.forEach(item => {
        if (item.product_name === decodedProductName) {
          item.status = status;
          if (status === 'completed') {
            item.completed_quantity = item.scheduled_quantity;
          }
        }
      });
    });
    
    // 若標記完成，更新庫存
    if (status === 'completed') {
      const product = products.find(p => p.name === decodedProductName);
      if (product) {
        const oldStock = product.current_stock || 0;
        product.current_stock = oldStock + totalScheduledQuantity;
        console.log(`✅ 庫存更新: ${decodedProductName} 從 ${oldStock} → ${product.current_stock} (+${totalScheduledQuantity})`);
      }
    }
    
    writeData(db);
    
    res.json({
      success: true,
      message: `${decodedProductName} 狀態更新成功`,
      added: status === 'completed' ? totalScheduledQuantity : 0
    });
  } catch (error) {
    console.error('❌ Kitchen API 錯誤:', error);
    res.status(500).json({ error: error.message });
  }
});

// 取得現場訂單列表 (按訂單顯示，用於廚房卡片式顯示)
app.get('/api/kitchen/walkin-orders-list', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('請求現場訂單列表日期:', today);
    
    const db = readData();
    const allOrders = Array.isArray(db.orders) ? db.orders : [];
    const allItems = Array.isArray(db.order_items) ? db.order_items : [];
    
    // 取得當天的現場銷售訂單，按時間倒序排列
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

// 取得出貨訂單（按配送日期）
app.get('/api/orders/delivery/:date', (req, res) => {
  try {
    const { date } = req.params;
    console.log('請求出貨訂單日期:', date);
    
    const db = readData();
    const allOrders = Array.isArray(db.orders) ? db.orders : [];
    const allItems = Array.isArray(db.order_items) ? db.order_items : [];
    
    // 取得指定配送日期的訂單
    const deliveryOrders = allOrders.filter(order => {
      if (!order || !order.delivery_date) return false;
      return order.delivery_date === date;
    });
    
    console.log(`找到 ${deliveryOrders.length} 個配送訂單`);
    
    // 為每個訂單添加訂單項目資訊
    const result = deliveryOrders.map(order => {
      // 優先使用訂單本身的 items，否則從 order_items 表查找
      let orderItems = [];
      if (order.items && Array.isArray(order.items)) {
        orderItems = order.items;
      } else {
        orderItems = allItems.filter(item => item.order_id === order.id);
      }
      
      return {
        id: order.id,
        customer_name: order.customer_name || '未知客戶',
        order_date: order.order_date,
        delivery_date: order.delivery_date,
        status: order.status,
        shipping_type: order.shipping_type,
        shipping_fee: order.shipping_fee || 0,
        total_amount: order.total_amount || 0,
        items: orderItems.map(item => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          is_gift: item.is_gift || false
        }))
      };
    });
    
    console.log('出貨訂單結果:', result);
    res.json(result);
  } catch (error) {
    console.error('取得出貨訂單失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 取得週出貨概覽
app.get('/api/orders/shipping-weekly/:startDate', (req, res) => {
  try {
    const { startDate } = req.params;
    console.log('請求週出貨概覽開始日期:', startDate);
    
    const db = readData();
    const allOrders = Array.isArray(db.orders) ? db.orders : [];
    
    // 計算一週的日期範圍
    const start = new Date(startDate);
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      weekDates.push(date.toISOString().split('T')[0]);
    }
    
    // 統計每週的配送訂單
    const weeklyStats = weekDates.map(date => {
      const dayOrders = allOrders.filter(order => order.delivery_date === date);
      const totalAmount = dayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const totalShippingFee = dayOrders.reduce((sum, order) => sum + (order.shipping_fee || 0), 0);
      
      return {
        date,
        order_count: dayOrders.length,
        total_amount: totalAmount,
        total_shipping_fee: totalShippingFee,
        orders: dayOrders.map(order => ({
          id: order.id,
          customer_name: order.customer_name || '未知客戶',
          status: order.status,
          shipping_type: order.shipping_type,
          total_amount: order.total_amount || 0
        }))
      };
    });
    
    res.json(weeklyStats);
  } catch (error) {
    console.error('取得週出貨概覽失敗:', error);
    res.status(500).json({ error: error.message });
  }
});

// 404 處理器 - 捕獲所有未找到的 API 路由（在靜態文件之前）
app.use('/api/*', (req, res) => {
  console.log(`❌ API 路由未找到: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false, 
    message: `API 路由未找到: ${req.method} ${req.originalUrl}`,
    available_routes: [
      'GET /api/health',
      'GET /api/inventory',
      'POST /api/inventory/transaction',
      'PUT /api/inventory',
      'DELETE /api/inventory',
      'GET /api/inventory/transactions',
      'DELETE /api/inventory/transactions/reset'
    ]
  });
});

// Serve frontend
const CLIENT_BUILD_PATH = path.join(process.cwd(), "../client/build");
app.use(express.static(CLIENT_BUILD_PATH));

app.get("*", (req, res) => {
  res.sendFile(path.join(CLIENT_BUILD_PATH, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`
🌍 環境設定:
  NODE_ENV: ${process.env.NODE_ENV || 'development'}
  PORT: ${PORT}
🗂 使用本地 JSON 儲存

📡 API 端點已就緒:
  GET  /api/health ✅ ready
  GET  /api/orders ✅ ready
  GET  /api/orders/customers/:date ✅ ready
  GET  /api/orders/weekly/:startDate ✅ ready
  GET  /api/orders/delivery/:date ✅ ready
  GET  /api/orders/shipping-weekly/:startDate ✅ ready
  POST /api/orders ✅ ready
  PUT  /api/orders/:id ✅ ready
  DELETE /api/orders/:id ✅ ready
  GET  /api/orders/history ✅ ready
  GET  /api/scheduling/dates/:date/orders ✅ ready
  DELETE /api/scheduling/delete/:date ✅ ready
  POST /api/scheduling/confirm ✅ ready
  GET  /api/kitchen/production/:date ✅ ready
  PUT  /api/kitchen/production/:date/:productName/status ✅ ready
  GET  /api/kitchen/walkin-orders-list ✅ ready
  GET  /api/inventory/scheduling ✅ ready
  GET  /api/inventory ✅ ready
  PUT  /api/inventory ✅ ready
  DELETE /api/inventory ✅ ready
  POST /api/inventory/reset ✅ ready
  POST /api/inventory/transaction ✅ ready
  GET  /api/inventory/transaction ✅ ready (錯誤方法提示)
  GET  /api/inventory/transactions ✅ ready
  DELETE /api/inventory/transactions/reset ✅ ready
  GET  /api/products ✅ ready
  POST /api/products ✅ ready
  PUT  /api/products/:id ✅ ready
  DELETE /api/products/:id ✅ ready
  POST /api/products/fix ✅ ready
  POST /api/products/update ✅ ready
  GET  /api/customers ✅ ready
  POST /api/customers ✅ ready
  PUT  /api/customers/:id ✅ ready
  DELETE /api/customers/:id ✅ ready
  GET  /api/order-items ✅ ready
  POST /api/order-items ✅ ready
  PUT  /api/order-items/:id ✅ ready
  DELETE /api/order-items/:id ✅ ready
  GET  /api/orders/uncompleted ✅ ready
  GET  /api/shipping-fee ✅ ready
  POST /api/shipping-fee ✅ ready
  PUT  /api/shipping-fee ✅ ready

🚀 Server running on port ${PORT}
📡 Mode: JSON
🌐 Local access: http://localhost:${PORT}
📡 API Base: http://localhost:${PORT}/api
`);
});
