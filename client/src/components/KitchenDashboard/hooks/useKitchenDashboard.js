import { useState, useEffect } from 'react';
import {
  fetchProductionList as fetchProductionListApi,
  fetchInventoryData as fetchInventoryDataApi,
  fetchScheduledDates as fetchScheduledDatesApi,
  fetchWalkinOrders as fetchWalkinOrdersApi,
  fetchWeeklyData as fetchWeeklyDataApi,
  fetchWeeklyDetailData as fetchWeeklyDetailDataApi,
  updateOrderStatus as updateOrderStatusApi,
} from '../api/kitchenDashboardApi';
import {
  getTotalQuantity,
  getTotalPendingQuantity,
  getTotalCompletedQuantity,
  getWalkinTotalQuantity,
  getSelectedOrdersStats as getSelectedOrdersStatsUtil,
  getInventorySuggestion,
} from '../utils/kitchenDashboardUtils';

export function useKitchenDashboard() {
  const [productionList, setProductionList] = useState([]);
  const [walkinOrders, setWalkinOrders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduledDates, setScheduledDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [showWeeklyView, setShowWeeklyView] = useState(false);
  const [weeklyData, setWeeklyData] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [inventoryData, setInventoryData] = useState([]);
  const [showWeeklyDetailModal, setShowWeeklyDetailModal] = useState(false);
  const [weeklyDetailData, setWeeklyDetailData] = useState([]);
  const [activeTab, setActiveTab] = useState('preorder'); // 'preorder' | 'walkin'
  const [selectedOrders, setSelectedOrders] = useState([]); // 選取的訂單ID陣列
  const [showStatsModal, setShowStatsModal] = useState(false); // 統計視窗顯示狀態

  const fetchProductionList = async (date) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchProductionListApi(date);
      setProductionList(data);
    } catch (err) {
      setError('載入製作清單失敗: ' + err.message);
      setProductionList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryData = async () => {
    try {
      const data = await fetchInventoryDataApi();
      setInventoryData(data);
    } catch (err) {
      console.error('載入庫存資料失敗:', err);
      setInventoryData([]);
    }
  };

  const fetchScheduledDates = async () => {
    try {
      const dates = await fetchScheduledDatesApi();
      setScheduledDates(dates);
      
      // 如果有排程日期，自動選擇第一個
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
      }
    } catch (err) {
      console.error('載入排程日期失敗:', err);
    }
  };

  const fetchWalkinOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchWalkinOrdersApi();
      setWalkinOrders(data);
    } catch (err) {
      console.error('❌ 載入現場訂單失敗:', err);
      setError('載入現場訂單失敗: ' + err.message);
      setWalkinOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyData = async () => {
    try {
      const weekdays = await fetchWeeklyDataApi(selectedDate);
      setWeeklyData(weekdays);
    } catch (err) {
      console.error('載入週數據失敗:', err);
      setWeeklyData([]);
    }
  };

  const fetchWeeklyDetailData = async () => {
    try {
      const sortedProducts = await fetchWeeklyDetailDataApi(selectedDate);
      setWeeklyDetailData(sortedProducts);
    } catch (err) {
      console.error('載入週詳細數據失敗:', err);
      setWeeklyDetailData([]);
    }
  };

  const handleRefresh = () => {
    setLastRefresh(new Date());
    if (activeTab === 'preorder') {
      fetchProductionList(selectedDate);
      if (showWeeklyView) {
        fetchWeeklyData();
      }
    } else if (activeTab === 'walkin') {
      fetchWalkinOrders();
    }
    fetchInventoryData();
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // 多選功能處理函數
  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  // 計算選取訂單的產品統計
  const getSelectedOrdersStats = () => {
    return getSelectedOrdersStatsUtil(selectedOrders, walkinOrders, inventoryData);
  };

  // 清除所有選取
  const clearSelection = () => {
    setSelectedOrders([]);
  };

  const toggleWeeklyView = () => {
    if (!showWeeklyView) {
      fetchWeeklyData();
    }
    setShowWeeklyView(!showWeeklyView);
  };

  const handleShowWeeklyDetail = async () => {
    await fetchWeeklyDetailData();
    setShowWeeklyDetailModal(true);
  };

  const handleStatusUpdate = async (productName, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [productName]: true }));
    
    try {
      await updateOrderStatusApi(selectedDate, productName, newStatus);
      // 重新載入製作清單
      await fetchProductionList(selectedDate);
    } catch (err) {
      setError('更新狀態失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [productName]: false }));
    }
  };

  // 計算函數（使用 utils）
  const getTotalQuantityValue = () => getTotalQuantity(productionList);
  const getTotalPendingQuantityValue = () => getTotalPendingQuantity(productionList);
  const getTotalCompletedQuantityValue = () => getTotalCompletedQuantity(productionList);
  const getWalkinTotalQuantityValue = () => getWalkinTotalQuantity(walkinOrders);
  const getInventorySuggestionValue = (productName, totalQuantity) => 
    getInventorySuggestion(productName, totalQuantity, inventoryData);

  useEffect(() => {
    if (activeTab === 'preorder') {
      fetchProductionList(selectedDate);
    } else if (activeTab === 'walkin') {
      fetchWalkinOrders();
    }
    fetchInventoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, activeTab]);

  // 載入排程日期
  useEffect(() => {
    if (activeTab === 'preorder') {
      fetchScheduledDates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return {
    // 狀態
    productionList,
    walkinOrders,
    selectedDate,
    setSelectedDate,
    scheduledDates,
    loading,
    error,
    updatingStatus,
    showWeeklyView,
    setShowWeeklyView,
    weeklyData,
    lastRefresh,
    inventoryData,
    showWeeklyDetailModal,
    setShowWeeklyDetailModal,
    weeklyDetailData,
    activeTab,
    setActiveTab,
    selectedOrders,
    showStatsModal,
    setShowStatsModal,
    // 方法
    handleRefresh,
    handleDateChange,
    toggleOrderSelection,
    getSelectedOrdersStats,
    clearSelection,
    toggleWeeklyView,
    handleShowWeeklyDetail,
    handleStatusUpdate,
    // 計算函數
    getTotalQuantity: getTotalQuantityValue,
    getTotalPendingQuantity: getTotalPendingQuantityValue,
    getTotalCompletedQuantity: getTotalCompletedQuantityValue,
    getWalkinTotalQuantity: getWalkinTotalQuantityValue,
    getInventorySuggestion: getInventorySuggestionValue,
  };
}

