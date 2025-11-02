import axios from "axios";
import config from "../../../config";
import { parseOrderItems } from "../utils/orderSchedulingUtils";

const apiUrl = config.apiUrl;

// ✅ 取得有訂單的日期
export async function fetchDates() {
  try {
    const res = await axios.get(`${apiUrl}/api/scheduling/dates`);
    // 後端返回格式：{ dates: [{date, count}, ...] }，轉換為字符串數組
    const dates = (res.data.dates || []).map(d => d.date || d);
    return dates;
  } catch (err) {
    console.error("❌ 載入日期清單失敗:", err);
    return [];
  }
}

// ✅ 取得未排程訂單（單一日期 - 保留用於向後兼容）
export async function fetchUnScheduledOrders(date) {
  if (!date) {
    return [];
  }
  try {
    const res = await axios.get(`${apiUrl}/api/scheduling/orders/${date}`);
    const orders = (res.data.orders || []).map(order => ({
      ...order,
      items: parseOrderItems(order.items)
    }));
    return orders;
  } catch (err) {
    console.error("❌ 取得未排程訂單失敗:", err);
    return [];
  }
}

// ✅ 取得過去10天和未來4天所有未排程訂單（按日期分組）
export async function fetchAllUnScheduledOrders() {
  try {
    const today = new Date();
    const ordersByDate = {};
    
    // 獲取過去10天到未來4天（總共15天，包含今天）
    // i = -10 到 4：過去10天 + 今天 + 未來4天
    for (let i = -10; i <= 4; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      try {
        const res = await axios.get(`${apiUrl}/api/scheduling/orders/${dateString}`);
        const orders = (res.data.orders || []).map(order => ({
          ...order,
          items: parseOrderItems(order.items)
        }));
        
        if (orders.length > 0) {
          // 按建立時間排序（created_at，由早到晚，由左至右）
          orders.sort((a, b) => {
            const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return timeA - timeB;
          });
          
          ordersByDate[dateString] = orders;
        }
      } catch (err) {
        console.error(`載入 ${dateString} 的未排程訂單失敗:`, err);
      }
    }
    
    return ordersByDate;
  } catch (err) {
    console.error("❌ 取得過去10天和未來4天未排程訂單失敗:", err);
    return {};
  }
}

// ✅ 根據 selectedOrderIds 查詢所有選中的訂單詳情（跨日期）
export async function fetchSelectedOrders(orderIds, allUnScheduledOrders) {
  if (orderIds.length === 0) {
    return [];
  }
  
  try {
    // 從所有未排程訂單中過濾出已選的訂單
    const selected = allUnScheduledOrders.filter(o => orderIds.includes(o.id));
    
    // 如果有訂單不在 allUnScheduledOrders 中，需要從後端查詢
    const missingIds = orderIds.filter(id => !allUnScheduledOrders.find(o => o.id === id));
    
    if (missingIds.length > 0) {
      // 查詢缺失的訂單
      const promises = missingIds.map(async (id) => {
        try {
          const res = await axios.get(`${apiUrl}/api/orders/${id}`);
          return {
            ...res.data,
            items: parseOrderItems(res.data.items)
          };
        } catch (err) {
          console.error(`❌ 查詢訂單 ${id} 失敗:`, err);
          return null;
        }
      });
      
      const missingOrders = (await Promise.all(promises)).filter(o => o !== null);
      return [...selected, ...missingOrders];
    }
    
    return selected;
  } catch (err) {
    console.error("❌ 查詢已選訂單失敗:", err);
    return [];
  }
}

// ✅ 取得可用庫存概覽（真實庫存，不扣訂單/預約/排程）
export async function fetchAvailability(asOf) {
  try {
    const q = asOf ? `?as_of=${encodeURIComponent(asOf)}` : '';
    const res = await axios.get(`${apiUrl}/api/inventory/availability${q}`);
    const data = res.data;
    
    // ✅ 使用 current_stock（真實庫存），不使用 available_for_scheduling
    // 轉 map：name -> { current, committed, available }
    const stockMap = {};
    (data.availability || []).forEach(x => {
      stockMap[x.product_name] = {
        current: x.current_stock || 0, // 真實庫存
        committed: x.committed_outstanding || 0,
        available: x.current_stock || 0 // 可用庫存 = 真實庫存（不扣任何東西）
      };
    });
    
    const stockMapObj = new Map(Object.entries(stockMap));
    console.log('✅ 可用庫存載入完成（真實庫存），產品數量:', Object.keys(stockMap).length);
    return stockMapObj;
  } catch (err) {
    console.error('❌ 載入可用庫存失敗:', err);
    return new Map(); // 失敗時設為空 Map
  }
}

// ✅ 取得生產計畫（產品為中心，不是訂單）
export async function fetchScheduledByProductionDate(date) {
  if (!date) {
    return [];
  }
  try {
    const res = await axios.get(`${apiUrl}/api/scheduling/production/${date}/orders`);
    // ✅ 返回的是生產計畫（產品列表），不是訂單
    const productionPlan = res.data.production_plan || res.data.orders || [];
    console.log(`✅ 載入 ${date} 的生產計畫:`, productionPlan.length, '個產品');
    return productionPlan;
  } catch (err) {
    console.error("❌ 取得生產計畫失敗:", err);
    return [];
  }
}

// ✅ 取得所有產品列表
export async function fetchAllProducts() {
  try {
    const res = await axios.get(`${apiUrl}/api/products`);
    // 按名稱排序
    const sortedProducts = (res.data || []).sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
    return sortedProducts;
  } catch (err) {
    console.error("❌ 取得產品列表失敗:", err);
    return [];
  }
}

// ✅ 取得過去10天和未來4天有未排程訂單的日期
export async function fetchWeeklyData() {
  try {
    const today = new Date();
    const weekdays = [];
    
    // 獲取過去10天到未來4天（總共15天，包含今天）
    for (let i = -10; i <= 4; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      try {
        // 取得該日期的未排程訂單
        const response = await axios.get(`${apiUrl}/api/scheduling/orders/${dateString}`);
        const orders = response.data.orders || [];
        
        // 計算未排程訂單數量
        const orderCount = orders.length;
        
        weekdays.push({
          date: dateString,
          order_count: orderCount
        });
      } catch (err) {
        console.error(`載入 ${dateString} 的未排程訂單數據失敗:`, err);
        weekdays.push({
          date: dateString,
          order_count: 0
        });
      }
    }
    
    return weekdays;
  } catch (err) {
    console.error('❌ 載入過去10天和未來4天未排程訂單數據失敗:', err);
    return [];
  }
}

// ✅ 排程 API
export async function submitScheduling(productionDate, deliveryDate, orderIds, manufacturingQuantities) {
  if (!productionDate || !deliveryDate) {
    throw new Error("請選擇製造日期和出貨日期！");
  }

  if (orderIds.length === 0) {
    throw new Error("請至少選擇一筆訂單！");
  }

  console.log('📋 [前端] 準備提交排程:', {
    production_date: productionDate,
    delivery_date: deliveryDate,
    orderIds: orderIds,
    manufacturingQuantities,
  });

  const res = await axios.post(`${apiUrl}/api/scheduling/confirm`, {
    production_date: productionDate,
    delivery_date: deliveryDate,
    manufacturingQuantities,
    orderIds: orderIds,
  });

  console.log('✅ [前端] 排程確認成功（已建立生產計畫）:', res.data);
  return res.data;
}

// ✅ 刪除上次的生產計畫（不再使用 scheduleId，改為使用 production_date）
export async function undoLastSchedule(productionDate) {
  if (!productionDate) {
    throw new Error("無效的生產日期");
  }
  await axios.delete(`${apiUrl}/api/scheduling/delete/${productionDate}`);
}

// ✅ 取消當日所有排程
export async function deleteDaySchedule(productionDate) {
  if (!productionDate) {
    throw new Error("請先選擇欲取消的製造日期");
  }
  await axios.delete(`${apiUrl}/api/scheduling/delete/${productionDate}`);
}

// ✅ 刪除所有歷史排程
export async function deleteAllHistorySchedules() {
  const response = await axios.delete(`${apiUrl}/api/scheduling/delete-all`);
  return response.data;
}

