const fs = require('fs');
const path = require('path');

// 讀取 JSON 資料
function loadData() {
  const dataFile = path.join(__dirname, 'data.json');
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  return data;
}

// 分析函數
function analyzeData() {
  const db = loadData();
  
  console.log('=== 訂單系統分析報告 ===\n');
  
  // 1. 基本統計
  console.log('📊 基本統計:');
  console.log(`- 客戶總數: ${db.customers.length}`);
  console.log(`- 產品總數: ${db.products.length}`);
  console.log(`- 訂單總數: ${db.orders.length}`);
  console.log(`- 訂單項目總數: ${db.order_items.length}\n`);
  
  // 2. 銷售分析
  console.log('💰 銷售分析:');
  const totalRevenue = db.order_items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);
  console.log(`- 總營業額: $${totalRevenue.toFixed(2)}`);
  
  // 平均訂單金額
  const orderTotals = {};
  db.order_items.forEach(item => {
    if (!orderTotals[item.order_id]) {
      orderTotals[item.order_id] = 0;
    }
    orderTotals[item.order_id] += item.quantity * item.unit_price;
  });
  const avgOrderValue = Object.values(orderTotals).reduce((sum, total) => sum + total, 0) / Object.keys(orderTotals).length;
  console.log(`- 平均訂單金額: $${avgOrderValue.toFixed(2)}\n`);
  
  // 3. 產品銷售排行
  console.log('🏆 產品銷售排行:');
  const productSales = {};
  db.order_items.forEach(item => {
    if (!productSales[item.product_name]) {
      productSales[item.product_name] = {
        quantity: 0,
        revenue: 0
      };
    }
    productSales[item.product_name].quantity += item.quantity;
    productSales[item.product_name].revenue += item.quantity * item.unit_price;
  });
  
  const sortedProducts = Object.entries(productSales)
    .sort((a, b) => b[1].revenue - a[1].revenue);
  
  sortedProducts.forEach(([product, stats], index) => {
    console.log(`${index + 1}. ${product}: ${stats.quantity}個, $${stats.revenue.toFixed(2)}`);
  });
  console.log('');
  
  // 4. 客戶分析
  console.log('👥 客戶分析:');
  const customerOrders = {};
  db.orders.forEach(order => {
    const customer = db.customers.find(c => c.id === order.customer_id);
    if (customer) {
      if (!customerOrders[customer.name]) {
        customerOrders[customer.name] = {
          orderCount: 0,
          totalSpent: 0,
          source: customer.source
        };
      }
      customerOrders[customer.name].orderCount++;
      
      // 計算該客戶的總消費
      const customerOrderItems = db.order_items.filter(item => item.order_id === order.id);
      const orderTotal = customerOrderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      customerOrders[customer.name].totalSpent += orderTotal;
    }
  });
  
  Object.entries(customerOrders).forEach(([name, stats]) => {
    console.log(`- ${name}: ${stats.orderCount}筆訂單, $${stats.totalSpent.toFixed(2)}, 來源: ${stats.source}`);
  });
  console.log('');
  
  // 5. 客戶來源分析
  console.log('📈 客戶來源分析:');
  const sourceStats = {};
  db.customers.forEach(customer => {
    if (!sourceStats[customer.source]) {
      sourceStats[customer.source] = 0;
    }
    sourceStats[customer.source]++;
  });
  
  Object.entries(sourceStats).forEach(([source, count]) => {
    console.log(`- ${source}: ${count}位客戶`);
  });
  console.log('');
  
  // 6. 訂單狀態分析
  console.log('📋 訂單狀態分析:');
  const statusStats = {};
  db.orders.forEach(order => {
    if (!statusStats[order.status]) {
      statusStats[order.status] = 0;
    }
    statusStats[order.status]++;
  });
  
  Object.entries(statusStats).forEach(([status, count]) => {
    const statusText = status === 'completed' ? '已完成' : status === 'pending' ? '進行中' : status;
    console.log(`- ${statusText}: ${count}筆訂單`);
  });
}

// 執行分析
analyzeData();
