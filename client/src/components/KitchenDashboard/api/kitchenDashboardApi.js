import axios from 'axios';
import config from '../../../config';

// ✅ 取得製作清單
export async function fetchProductionList(date) {
  try {
    const response = await axios.get(`${config.apiUrl}/api/kitchen/production/${date}`);
    return response.data;
  } catch (err) {
    console.error('載入製作清單失敗:', err);
    throw err;
  }
}

// ✅ 取得庫存資料
export async function fetchInventoryData() {
  try {
    const response = await axios.get(`${config.apiUrl}/api/inventory/scheduling`);
    return response.data || [];
  } catch (err) {
    console.error('載入庫存資料失敗:', err);
    return [];
  }
}

// ✅ 取得排程日期
export async function fetchScheduledDates() {
  try {
    // 檢查未來7天內有排程的日期
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      try {
        const response = await axios.get(`${config.apiUrl}/api/kitchen/production/${dateStr}`);
        if (response.data && response.data.length > 0) {
          dates.push(dateStr);
        }
      } catch (err) {
        // 忽略錯誤，繼續檢查下一個日期
      }
    }
    
    return dates;
  } catch (err) {
    console.error('載入排程日期失敗:', err);
    return [];
  }
}

// ✅ 取得現場訂單列表
export async function fetchWalkinOrders() {
  try {
    const response = await axios.get(`${config.apiUrl}/api/kitchen/walkin-orders-list`);
    console.log('✅ 現場訂單載入成功:', response.data?.length || 0, '筆');
    return response.data || [];
  } catch (err) {
    console.error('❌ 載入現場訂單失敗:', err);
    throw err;
  }
}

// ✅ 取得週數據
export async function fetchWeeklyData(selectedDate) {
  try {
    // 從今天開始的未來一週（包含今天）
    const today = new Date(selectedDate);
    const weekdays = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      try {
        // 廚房製作清單的週視圖
        const response = await axios.get(`${config.apiUrl}/api/kitchen/production/${dateString}`);
        const totalQuantity = response.data.reduce((sum, item) => sum + item.total_quantity, 0);
        
        weekdays.push({
          date: dateString,
          total_quantity: totalQuantity,
          order_count: 0,
          total_amount: 0
        });
      } catch (err) {
        console.error(`載入 ${dateString} 的數據失敗:`, err);
        weekdays.push({
          date: dateString,
          total_quantity: 0,
          order_count: 0,
          total_amount: 0
        });
      }
    }
    
    return weekdays;
  } catch (err) {
    console.error('載入週數據失敗:', err);
    return [];
  }
}

// ✅ 取得週詳細數據
export async function fetchWeeklyDetailData(selectedDate) {
  try {
    const today = new Date(selectedDate);
    
    // 收集一週內所有產品的詳細數據
    const productSummary = {};
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      try {
        const response = await axios.get(`${config.apiUrl}/api/kitchen/production/${dateString}`);
        
        response.data.forEach(item => {
          if (!productSummary[item.product_name]) {
            productSummary[item.product_name] = {
              product_name: item.product_name,
              total_quantity: 0,
              days: []
            };
          }
          productSummary[item.product_name].total_quantity += item.total_quantity;
          productSummary[item.product_name].days.push({
            date: dateString,
            quantity: item.total_quantity
          });
        });
      } catch (err) {
        console.error(`載入 ${dateString} 的詳細數據失敗:`, err);
      }
    }
    
    // 轉換為陣列並排序
    const sortedProducts = Object.values(productSummary)
      .sort((a, b) => b.total_quantity - a.total_quantity);
    
    return sortedProducts;
  } catch (err) {
    console.error('載入週詳細數據失敗:', err);
    return [];
  }
}

// ✅ 更新訂單狀態
export async function updateOrderStatus(date, productName, newStatus) {
  try {
    await axios.put(`${config.apiUrl}/api/kitchen/production/${date}/${encodeURIComponent(productName)}/status`, {
      status: newStatus
    });
    return true;
  } catch (err) {
    console.error('更新狀態失敗:', err);
    throw err;
  }
}

