// ✅ 取得星期名稱
export function getWeekdayName(dateStr) {
  const date = new Date(dateStr);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return weekdays[date.getDay()];
}

// ✅ 根據數量獲取顏色
export function getQuantityColor(quantity) {
  if (quantity === 0) return '#e9ecef'; // 淺灰
  if (quantity <= 5) return '#28a745'; // 綠色
  if (quantity <= 15) return '#ffc107'; // 黃色
  return '#dc3545'; // 紅色
}

// ✅ 檢查是否完全完成
export function isFullyCompleted(item) {
  return item.completed_quantity === item.total_quantity;
}

// ✅ 計算總數量
export function getTotalQuantity(productionList) {
  return productionList.reduce((total, item) => total + item.total_quantity, 0);
}

// ✅ 計算待製作總數
export function getTotalPendingQuantity(productionList) {
  return productionList.reduce((total, item) => total + item.pending_quantity, 0);
}

// ✅ 計算已完成總數
export function getTotalCompletedQuantity(productionList) {
  return productionList.reduce((total, item) => total + item.completed_quantity, 0);
}

// ✅ 現場訂單總數量
export function getWalkinTotalQuantity(walkinOrders) {
  return walkinOrders.reduce((total, order) => {
    return total + order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0);
  }, 0);
}

// ✅ 取得庫存建議
export function getInventorySuggestion(productName, totalQuantity, inventoryData) {
  const product = inventoryData.find(p => p.name === productName);
  if (!product) return null;

  const currentStock = product.current_stock;
  const weeklyDemand = totalQuantity;
  
  return {
    type: 'info',
    message: `目前庫存：${currentStock} 瓶，週需求：${weeklyDemand} 瓶`,
    color: '#6c757d'
  };
}

// ✅ 計算選取訂單的產品統計
export function getSelectedOrdersStats(selectedOrders, walkinOrders, inventoryData) {
  const selectedOrdersData = walkinOrders.filter(order => selectedOrders.includes(order.id));
  const productStats = {};
  
  selectedOrdersData.forEach(order => {
    order.items.forEach(item => {
      if (!productStats[item.product_name]) {
        productStats[item.product_name] = 0;
      }
      productStats[item.product_name] += item.quantity;
    });
  });
  
  return Object.entries(productStats).map(([productName, quantity]) => {
    // 查找對應的庫存資料
    const inventoryItem = inventoryData.find(item => item.name === productName);
    const currentStock = inventoryItem ? inventoryItem.current_stock : 0;
    const minStock = inventoryItem ? inventoryItem.min_stock : 0;
    const isLowStock = currentStock <= minStock;
    
    return {
      product_name: productName,
      quantity: quantity,
      current_stock: currentStock,
      min_stock: minStock,
      is_low_stock: isLowStock
    };
  });
}

