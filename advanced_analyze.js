const fs = require('fs');
const path = require('path');

// 讀取 JSON 資料
function loadData() {
  const dataFile = path.join(__dirname, 'data.json');
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  return data;
}

// 進階分析函數
function advancedAnalysis() {
  const db = loadData();
  
  console.log('=== 進階分析報告 ===\n');
  
  // 1. 時間序列分析（如果有更多資料）
  console.log('📅 時間序列分析:');
  const ordersByDate = {};
  db.orders.forEach(order => {
    if (!ordersByDate[order.order_date]) {
      ordersByDate[order.order_date] = {
        orderCount: 0,
        revenue: 0
      };
    }
    ordersByDate[order.order_date].orderCount++;
    
    // 計算該日期的營業額
    const dayOrderItems = db.order_items.filter(item => {
      const order = db.orders.find(o => o.id === item.order_id);
      return order && order.order_date === order.order_date;
    });
    const dayRevenue = dayOrderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    ordersByDate[order.order_date].revenue += dayRevenue;
  });
  
  Object.entries(ordersByDate).forEach(([date, stats]) => {
    console.log(`${date}: ${stats.orderCount}筆訂單, $${stats.revenue.toFixed(2)}`);
  });
  console.log('');
  
  // 2. 產品利潤分析
  console.log('💎 產品利潤分析:');
  const productProfit = {};
  db.order_items.forEach(item => {
    if (!productProfit[item.product_name]) {
      productProfit[item.product_name] = {
        totalQuantity: 0,
        totalRevenue: 0,
        avgPrice: 0
      };
    }
    productProfit[item.product_name].totalQuantity += item.quantity;
    productProfit[item.product_name].totalRevenue += item.quantity * item.unit_price;
  });
  
  // 計算平均價格
  Object.keys(productProfit).forEach(product => {
    productProfit[product].avgPrice = productProfit[product].totalRevenue / productProfit[product].totalQuantity;
  });
  
  Object.entries(productProfit).forEach(([product, stats]) => {
    console.log(`${product}: 平均單價 $${stats.avgPrice.toFixed(2)}, 總銷售 ${stats.totalQuantity}個`);
  });
  console.log('');
  
  // 3. 客戶價值分析
  console.log('⭐ 客戶價值分析:');
  const customerValue = {};
  db.orders.forEach(order => {
    const customer = db.customers.find(c => c.id === order.customer_id);
    if (customer) {
      if (!customerValue[customer.name]) {
        customerValue[customer.name] = {
          orderCount: 0,
          totalSpent: 0,
          avgOrderValue: 0,
          lastOrderDate: order.order_date
        };
      }
      customerValue[customer.name].orderCount++;
      
      // 計算該訂單金額
      const orderItems = db.order_items.filter(item => item.order_id === order.id);
      const orderTotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      customerValue[customer.name].totalSpent += orderTotal;
      
      // 更新最後訂單日期
      if (order.order_date > customerValue[customer.name].lastOrderDate) {
        customerValue[customer.name].lastOrderDate = order.order_date;
      }
    }
  });
  
  // 計算平均訂單金額
  Object.keys(customerValue).forEach(customer => {
    customerValue[customer].avgOrderValue = customerValue[customer].totalSpent / customerValue[customer].orderCount;
  });
  
  // 按總消費排序
  const sortedCustomers = Object.entries(customerValue)
    .sort((a, b) => b[1].totalSpent - a[1].totalSpent);
  
  sortedCustomers.forEach(([name, stats]) => {
    console.log(`${name}: $${stats.totalSpent.toFixed(2)} (${stats.orderCount}筆訂單, 平均 $${stats.avgOrderValue.toFixed(2)})`);
  });
  console.log('');
  
  // 4. 匯出 CSV 格式的資料
  console.log('📊 可匯出的資料格式:');
  console.log('1. 客戶清單 CSV');
  console.log('2. 產品銷售 CSV');
  console.log('3. 訂單明細 CSV');
  console.log('4. 每日銷售報表 CSV');
  console.log('');
  
  // 5. 建議的報表功能
  console.log('💡 建議增加的報表功能:');
  console.log('- 每日銷售報表');
  console.log('- 客戶消費排行');
  console.log('- 產品熱銷分析');
  console.log('- 客戶來源統計');
  console.log('- 訂單完成率分析');
  console.log('- 平均訂單金額趨勢');
}

// 執行進階分析
advancedAnalysis();
