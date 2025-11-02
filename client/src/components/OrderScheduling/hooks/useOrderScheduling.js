import { useState, useEffect } from "react";
import { parseOrderItems } from "../utils/orderSchedulingUtils";
import {
  fetchDates as fetchDatesApi,
  fetchUnScheduledOrders as fetchUnScheduledOrdersApi,
  fetchAllUnScheduledOrders as fetchAllUnScheduledOrdersApi,
  fetchSelectedOrders as fetchSelectedOrdersApi,
  fetchAvailability as fetchAvailabilityApi,
  fetchScheduledByProductionDate as fetchScheduledByProductionDateApi,
  fetchAllProducts as fetchAllProductsApi,
  fetchWeeklyData as fetchWeeklyDataApi,
  submitScheduling as submitSchedulingApi,
  undoLastSchedule as undoLastScheduleApi,
  deleteDaySchedule as deleteDayScheduleApi,
  deleteAllHistorySchedules as deleteAllHistorySchedulesApi,
} from "../api/orderSchedulingApi";

export function useOrderScheduling() {
  const [selectedOrderDate, setSelectedOrderDate] = useState("");
  const [unScheduledOrders, setUnScheduledOrders] = useState([]);
  const [scheduledOrders, setScheduledOrders] = useState([]);
  
  // ✅ 所有未排程訂單（按日期分組）
  const [allUnScheduledOrdersByDate, setAllUnScheduledOrdersByDate] = useState({});
  
  // ✅ 所有產品列表（用於test表格）
  const [allProducts, setAllProducts] = useState([]);

  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [productSummary, setProductSummary] = useState([]);
  
  // ✅ 儲存所有未排程訂單（跨所有日期）
  const [allUnScheduledOrders, setAllUnScheduledOrders] = useState([]);

  const [selectedProductionDate, setSelectedProductionDate] = useState("");
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState("");
  // ✅ 最近一次排程（用於快速撤銷）
  const [lastSchedule, setLastSchedule] = useState(null); // { scheduleId, production_date }

  // ✅ 手動加量狀態
  const [manualAdjustments, setManualAdjustments] = useState({});

  // ✅ 可用庫存概覽 Map：product_name -> { current, committed, available }
  const [availMap, setAvailMap] = useState(new Map());

  // ✅ 未來一週排程概覽數據
  const [weeklyData, setWeeklyData] = useState([]);
  
  // ✅ 蝦皮優先排序狀態
  const [shopeePriority, setShopeePriority] = useState(false);

  // ✅ 取得有訂單的日期
  const fetchDates = async () => {
    try {
      const dates = await fetchDatesApi();
      // 如果沒有選中日期，自動選第一個
      if (!selectedOrderDate && dates.length > 0) {
        setSelectedOrderDate(dates[0]);
      }
    } catch (err) {
      console.error("❌ 載入日期清單失敗:", err);
    }
  };

  // ✅ 取得未排程訂單（單一日期 - 保留用於向後兼容）
  const fetchUnScheduledOrders = async (date) => {
    if (!date) {
      setUnScheduledOrders([]);
      return;
    }
    try {
      const orders = await fetchUnScheduledOrdersApi(date);
      setUnScheduledOrders(orders);
      
      // ✅ 更新所有未排程訂單列表（累積不同日期的訂單）
      setAllUnScheduledOrders(prev => {
        // 移除該日期的舊訂單
        const filtered = prev.filter(o => o.order_date !== date);
        // 添加新日期的訂單
        return [...filtered, ...orders];
      });
    } catch (err) {
      console.error("❌ 取得未排程訂單失敗:", err);
      setUnScheduledOrders([]);
    }
  };

  // ✅ 取得過去10天和未來4天所有未排程訂單（按日期分組）
  const fetchAllUnScheduledOrders = async () => {
    try {
      const ordersByDate = await fetchAllUnScheduledOrdersApi();
      setAllUnScheduledOrdersByDate(ordersByDate);
      
      // 更新 allUnScheduledOrders（用於選中訂單的統計）
      const allOrders = Object.values(ordersByDate).flat();
      setAllUnScheduledOrders(allOrders);
    } catch (err) {
      console.error("❌ 取得過去10天和未來4天未排程訂單失敗:", err);
      setAllUnScheduledOrdersByDate({});
    }
  };
  
  // ✅ 根據 selectedOrderIds 查詢所有選中的訂單詳情（跨日期）
  const fetchSelectedOrders = async () => {
    if (selectedOrderIds.length === 0) {
      setAllUnScheduledOrders(prev => prev.filter(o => !selectedOrderIds.includes(o.id)));
      return;
    }
    
    try {
      const selected = await fetchSelectedOrdersApi(selectedOrderIds, allUnScheduledOrders);
      setAllUnScheduledOrders(prev => {
        const existing = prev.filter(o => !selectedOrderIds.includes(o.id));
        return [...existing, ...selected];
      });
    } catch (err) {
      console.error("❌ 查詢已選訂單失敗:", err);
    }
  };

  // ✅ 取得可用庫存概覽（真實庫存，不扣訂單/預約/排程）
  const fetchAvailability = async (asOf) => {
    try {
      const stockMap = await fetchAvailabilityApi(asOf);
      setAvailMap(stockMap);
    } catch (err) {
      console.error('❌ 載入可用庫存失敗:', err);
      setAvailMap(new Map()); // 失敗時設為空 Map
    }
  };

  // ✅ 取得生產計畫（產品為中心，不是訂單）
  const fetchScheduledByProductionDate = async (date) => {
    if (!date) {
      setScheduledOrders([]);
      return;
    }
    try {
      const productionPlan = await fetchScheduledByProductionDateApi(date);
      setScheduledOrders(productionPlan);
    } catch (err) {
      console.error("❌ 取得生產計畫失敗:", err);
      setScheduledOrders([]);
    }
  };

  // ✅ 取得所有產品列表
  const fetchAllProducts = async () => {
    try {
      const sortedProducts = await fetchAllProductsApi();
      setAllProducts(sortedProducts);
    } catch (err) {
      console.error("❌ 取得產品列表失敗:", err);
      setAllProducts([]);
    }
  };

  // ✅ 取得過去10天和未來4天有未排程訂單的日期
  const fetchWeeklyData = async () => {
    try {
      const weekdays = await fetchWeeklyDataApi();
      setWeeklyData(weekdays);
    } catch (err) {
      console.error('❌ 載入過去10天和未來4天未排程訂單數據失敗:', err);
      setWeeklyData([]);
    }
  };

  // ✅ 跨日期統計所有已選訂單的數量
  useEffect(() => {
    fetchSelectedOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrderIds]);

  // ✅ 更新產出彙總（跨日期）
  useEffect(() => {
    // ✅ 跨日期統計所有已選訂單（不再只統計某一天）
    const selectedOrders = allUnScheduledOrders.filter(o => selectedOrderIds.includes(o.id));
    
    // ✅ 重新加總所有產品數量（跨日）
    const aggregatedSelected = {};
    selectedOrders.forEach(order => {
      const items = parseOrderItems(order.items);
      items.forEach(item => {
        const name = item.product_name || item.name;
        const qty = Number(item.quantity) || 0;
        if (!name || qty <= 0) return;
        if (!aggregatedSelected[name]) aggregatedSelected[name] = 0;
        aggregatedSelected[name] += qty;
      });
    });

    const arr = Object.entries(aggregatedSelected).map(([product_name, quantity]) => ({
      product_name,
      quantity,
    }));

    setProductSummary(arr);
  }, [selectedOrderIds, allUnScheduledOrders]);

  // ✅ 初始化載入
  useEffect(() => {
    fetchDates();
    fetchWeeklyData(); // 載入一週排程數據
    fetchAllUnScheduledOrders(); // 載入過去10天和未來4天所有未排程訂單
    fetchAllProducts(); // 載入所有產品
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 切換訂單日期（保留用於向後兼容）
  useEffect(() => {
    if (selectedOrderDate) {
      fetchUnScheduledOrders(selectedOrderDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrderDate]);

  // ✅ 當排程完成後，重新載入一週所有未排程訂單
  useEffect(() => {
    fetchAllUnScheduledOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrderDate, scheduledOrders]);

  // ✅ 切換生產日期
  useEffect(() => {
    if (selectedProductionDate) {
      fetchScheduledByProductionDate(selectedProductionDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProductionDate]);

  // ✅ 當訂單選擇改變或排程完成後，重新載入一週數據
  useEffect(() => {
    fetchWeeklyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOrderDate, unScheduledOrders]);

  // ✅ 載入頁面時獲取可用庫存（以今天為基準）
  useEffect(() => {
    fetchAvailability(); // 預設使用今天
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 排程 API
  const submitScheduling = async () => {
    if (!selectedProductionDate || !selectedDeliveryDate) {
      alert("請選擇製造日期和出貨日期！");
      return;
    }

    if (selectedOrderIds.length === 0) {
      alert("請至少選擇一筆訂單！");
      return;
    }

    // ✅ 整理最終製造量（需要製造瓶/包數，已扣除可用庫存）
    const manufacturingQuantities = {};
    
    // 計算跨日期統計和可用庫存
    const selectedOrders = allUnScheduledOrders.filter(o => selectedOrderIds.includes(o.id));
    const aggregatedSelected = {};
    selectedOrders.forEach(order => {
      const items = parseOrderItems(order.items);
      items.forEach(item => {
        const name = item.product_name || item.name;
        const qty = Number(item.quantity) || 0;
        if (!name || qty <= 0) return;
        if (!aggregatedSelected[name]) aggregatedSelected[name] = 0;
        aggregatedSelected[name] += qty;
      });
    });
    
    // 從可用庫存 Map 獲取庫存值
    const availableStockMap = {};
    availMap.forEach((value, name) => {
      availableStockMap[name] = value.available || 0;
    });
    
    productSummary.forEach((item) => {
      // 訂單總需求（基礎訂單數量，不含手動調整）
      const baseQty = aggregatedSelected[item.product_name] || item.quantity || 0;
      const totalOrderRequired = baseQty;
      
      // 原始可用庫存
      const stock = availableStockMap[item.product_name] || 0;
      
      // ✅ 基礎製造量 = 訂單總需求 - 原始可用庫存（不能為負數）
      const baseManufacturingQty = Math.max(totalOrderRequired - stock, 0);
      
      // 加上製造量的手動調整
      const manufacturingQty = baseManufacturingQty + (manualAdjustments[item.product_name] || 0);
      
      manufacturingQuantities[item.product_name] = Math.max(manufacturingQty, 0);
    });

    try {
      const res = await submitSchedulingApi(
        selectedProductionDate,
        selectedDeliveryDate,
        selectedOrderIds,
        manufacturingQuantities
      );
      
      alert(`✅ 生產計畫已建立！\n製造日期：${selectedProductionDate}\n產品數量：${res.inserted_products} 個`);
      
      // ✅ 排程完成後，只重新載入生產計畫相關數據
      // 訂單不會改變，所以不需要重新載入訂單列表
      fetchScheduledByProductionDate(selectedProductionDate);
      
      // 清空選中的訂單和手動調整（但訂單不會消失，仍然顯示在 UI 中）
      setSelectedOrderIds([]);
      setManualAdjustments({});
      
      // 記錄最後一次排程
      setLastSchedule({
        scheduleId: res.scheduleId || res.id,
        production_date: selectedProductionDate
      });
    } catch (err) {
      console.error("❌ 排程失敗:", err);
      alert(`排程失敗：${err.response?.data?.error || err.message}`);
    }
  };

  // ✅ 刪除上次的生產計畫（不再使用 scheduleId，改為使用 production_date）
  const undoLastSchedule = async () => {
    if (!lastSchedule?.production_date) return;
    const ok = window.confirm(`確定要刪除「${lastSchedule.production_date}」的生產計畫嗎？`);
    if (!ok) return;
    try {
      await undoLastScheduleApi(lastSchedule.production_date);
      alert('已刪除生產計畫');
      fetchScheduledByProductionDate(lastSchedule.production_date);
      setLastSchedule(null);
    } catch (err) {
      console.error('❌ 刪除生產計畫失敗:', err);
      alert(`刪除失敗：${err.response?.data?.error || err.message}`);
    }
  };

  // ✅ 取消當日所有排程
  const deleteDaySchedule = async () => {
    if (!selectedProductionDate) {
      alert("請先選擇欲取消的製造日期");
      return;
    }
    const ok = window.confirm(`確定要刪除「${selectedProductionDate}」的生產計畫嗎？\n此操作將清除該日的生產計畫與完成紀錄。`);
    if (!ok) return;
    try {
      await deleteDayScheduleApi(selectedProductionDate);
      alert("🗑️ 已刪除該日排程");
      // 重新載入
      fetchScheduledByProductionDate(selectedProductionDate);
      fetchWeeklyData(); // 重新載入一週數據（顯示未排程訂單數量）
      fetchDates();
    } catch (err) {
      console.error("❌ 刪除當日排程失敗:", err);
      alert(`刪除排程失敗：${err.response?.data?.error || err.message}`);
    }
  };

  // ✅ 刪除所有歷史排程
  const deleteAllHistorySchedules = async () => {
    const ok = window.confirm(
      `⚠️ 確定要刪除「所有歷史排程」嗎？\n\n` +
      `此操作將：\n` +
      `• 刪除所有日期的生產計畫（production_plan）\n` +
      `• 刪除所有日期的廚房完成紀錄（kitchen_production_status）\n\n` +
      `此操作無法復原，請確認！`
    );
    if (ok) {
      try {
        const response = await deleteAllHistorySchedulesApi();
        alert(`✅ 已刪除所有歷史排程！\n共刪除 ${response.deleted_count || 0} 筆記錄`);
        // 重新載入數據
        if (selectedProductionDate) {
          fetchScheduledByProductionDate(selectedProductionDate);
        }
        fetchWeeklyData(); // 重新載入一週數據
        fetchDates(); // 重新載入日期列表
      } catch (err) {
        console.error("❌ 刪除所有歷史排程失敗:", err);
        alert(`刪除失敗：${err.response?.data?.error || err.message}`);
      }
    }
  };

  return {
    // 狀態
    selectedOrderDate,
    setSelectedOrderDate,
    unScheduledOrders,
    scheduledOrders,
    allUnScheduledOrdersByDate,
    allProducts,
    selectedOrderIds,
    setSelectedOrderIds,
    productSummary,
    allUnScheduledOrders,
    selectedProductionDate,
    setSelectedProductionDate,
    selectedDeliveryDate,
    setSelectedDeliveryDate,
    lastSchedule,
    manualAdjustments,
    setManualAdjustments,
    availMap,
    weeklyData,
    shopeePriority,
    setShopeePriority,
    // 方法
    submitScheduling,
    undoLastSchedule,
    deleteDaySchedule,
    deleteAllHistorySchedules,
    fetchScheduledByProductionDate,
    fetchWeeklyData,
  };
}

