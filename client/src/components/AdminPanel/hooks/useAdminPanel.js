// ==========================================================
//  useAdminPanel.js (CLEANED SECTION 1/7)
//  ✅ 保持邏輯完全不變
//  ✅ 格式化 import 區
// ==========================================================

import { useState, useEffect, useCallback } from "react";

import {
  fetchShippingFee as fetchShippingFeeApi,
  fetchCustomers as fetchCustomersApi,
  fetchProducts as fetchProductsApi,
  updateCustomer as updateCustomerApi,
  deleteCustomer as deleteCustomerApi,
  addCustomer as addCustomerApi,
} from "../api/adminPanelApi";

import {
  filterCustomersUtil,
} from "../utils/filters";

import config from "../../../config";

import useCustomers from "./useCustomers";
import useOrders from "./useOrders";
import useShipping from "./useShipping";
import useInventory from "./useInventory";
import useHistoryIO from "./useHistoryIO";

// ==========================================================
// ✅ useAdminPanel — 主 Hook
// ==========================================================

export function useAdminPanel(user) {

  // ======================================================
  // ✅ Section: Global UI State
  // ======================================================

  const [activeTab, setActiveTab] = useState(user?.role === "kitchen" ? "shipping-management" : "new-order");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ======================================================
  // ✅ Section: Products State
  // ======================================================

  const [products, setProducts] = useState([]);

  const [shippingFee, setShippingFee] = useState(120);

  const [idMappings, setIdMappings] = useState({
    customers: new Map(),
    products: new Map()
  });

  // ======================================================
  // ✅ Section: API Fetch Functions (Other)
  // ======================================================

  const fetchProducts = async () => {
    try {
      const data = await fetchProductsApi();
      setProducts(data);
    } catch (err) {
      console.error('載入產品列表失敗:', err);
      // API 模組已處理備用產品
      setProducts([]);
    }
  };

  // ======================================================
  // ✅ Section: History I/O Module (from useHistoryIO hook)
  //   注意：必須在 customersModule 之前，因為需要 customers
  //   但 customersModule 需要 setFilteredHistoryCustomers，所以我們需要先創建一個臨時 state
  // ======================================================

  // 臨時 state，用於初始化
  const [tempFilteredHistoryCustomers, setTempFilteredHistoryCustomers] = useState([]);

  // ======================================================
  // ✅ Section: Customers Module (from useCustomers hook)
  // ======================================================

  const customersModule = useCustomers({
    setLoading,
    setError,
    setSuccess,
    setActiveTab,
    setFilteredHistoryCustomers: setTempFilteredHistoryCustomers,
  });

  const {
    customers,
    setCustomers,
    filteredCustomers,
    setFilteredCustomers,
    customerSearchTerm,
    setCustomerSearchTerm,
    customerSourceFilter,
    setCustomerSourceFilter,
    editingCustomer,
    setEditingCustomer,
    editCustomerForm,
    setEditCustomerForm,
    newCustomer,
    setNewCustomer,
    handleCustomerSearch,
    handleSourceFilter,
    handleAddCustomer,
    startEditCustomer,
    cancelEditCustomer,
    handleUpdateCustomer,
    handleDeleteCustomer,
    fetchCustomers,
  } = customersModule;

  // 現在創建 historyIOModule，它會覆蓋臨時的 setFilteredHistoryCustomers
  const historyIOModule = useHistoryIO({
    customers,
    setFilteredHistoryCustomers: setTempFilteredHistoryCustomers,
  });

  // 初始化依賴（通過 _initDeps 注入 setLoading, setError 等）
  historyIOModule._initDeps({
    setLoading,
    setError,
    setSuccess,
    activeTab,
    fetchCustomers,
    fetchProducts,
  });

  const {
    orderHistory,
    setOrderHistory,
    orderHistoryLoaded,
    setOrderHistoryLoaded,
    historyFilters,
    setHistoryFilters,
    historyCustomerSearchTerm,
    setHistoryCustomerSearchTerm,
    filteredHistoryCustomers,
    setFilteredHistoryCustomers,
    downloadOptions,
    setDownloadOptions,
    uploadOptions,
    setUploadOptions,
    fetchOrderHistory,
    handleHistoryCustomerSearch,
    exportToCSV,
    deleteOrderHistory,
    handleSeparateDownload,
    handleBatchDownload,
    handleSeparateUpload,
    handleBatchUpload,
  } = historyIOModule;

  // ======================================================
  // ✅ Section: Inventory Module (from useInventory hook)
  // ======================================================

  const inventoryModule = useInventory({
    setLoading,
    setError,
    setSuccess,
  });

  const {
    inventoryData,
    setInventoryData,
    inventoryTransactions,
    setInventoryTransactions,
    inventoryForm,
    setInventoryForm,
    fetchInventoryData,
    fetchInventoryTransactions,
    handleInventoryTransaction,
    handleDeleteInventoryTransaction,
    handleResetInventoryTransactions,
    handleResetAllStock,
  } = inventoryModule;

  // ======================================================
  // ✅ Section: Orders Module (from useOrders hook)
  // ======================================================

  const ordersModule = useOrders({
    setLoading,
    setError,
    setSuccess,
    activeTab,
    setActiveTab,
    customers,
    shippingFee,
    fetchProducts,
    fetchOrderHistory,
  });

  const {
    newOrder,
    setNewOrder,
    editOrderForm,
    setEditOrderForm,
    editingOrder,
    setEditingOrder,
    handleAddOrder,
    handleEditOrder,
    handleUpdateOrder,
    handleDeleteOrder,
    updateEditOrderItem,
    addEditOrderItem,
    removeEditOrderItem,
    addOrderItem,
    removeOrderItem,
    updateOrderItem,
    addGiftItem,
    calculateTotalAmount,
    calculateCreditCardFee,
    calculateShopeeFee,
    calculateEditCreditCardFee,
    calculateEditShopeeFee,
  } = ordersModule;

  // ======================================================
  // ✅ Section: Shipping Module (from useShipping hook)
  // ======================================================

  const shippingModule = useShipping({
    setLoading,
    setError,
    setSuccess,
    activeTab,
    fetchInventoryData,
    fetchOrderHistory,
  });

  const {
    shippingOrders,
    setShippingOrders,
    shippingDate,
    setShippingDate,
    showWeeklyOverview,
    setShowWeeklyOverview,
    weeklyShippingData,
    setWeeklyShippingData,
    fetchShippingOrders,
    handleUpdateShippingStatus,
    fetchWeeklyShippingData,
  } = shippingModule;

  // ======================================================
  // ✅ Section: Shipping Fee Management
  // ======================================================

  // ----------------------------------------------------------
  // ✅ 取得運費設定
  // ----------------------------------------------------------
  const fetchShippingFee = async () => {
    try {
      const fee = await fetchShippingFeeApi();
      setShippingFee(fee);
    } catch (err) {
      console.error("載入運費設定失敗:", err);
    }
  };


  // ======================================================
  // ✅ Section: useEffect Hooks
  // ======================================================

  // ----------------------------------------------------------
  // ✅ Effect：初始資料載入
  // ----------------------------------------------------------
  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    fetchShippingFee();
    fetchInventoryData();
    fetchInventoryTransactions();
  }, []);


  // ----------------------------------------------------------
  // ✅ Effect：當 activeTab 切換到 new-order 時重新載入資料
  // ----------------------------------------------------------
  useEffect(() => {
    if (activeTab === "new-order") {
      fetchCustomers();
      fetchProducts();
    }
  }, [activeTab]);

  // ----------------------------------------------------------
  // ✅ Effect：載入 Order History（僅第一次）
  //   原本就用 orderHistoryLoaded 避免重複 fetch
  //   ✅ 行為保留（從 useHistoryIO 移到這裡，因為需要 activeTab）
  // ----------------------------------------------------------
  useEffect(() => {
    if (activeTab === "order-history" && !orderHistoryLoaded) {
      fetchOrderHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);


  // ==================== Return ====================

  return {
    // 狀態
    activeTab,
    setActiveTab,
    customers,
    products,
    loading,
    error,
    success,
    setError,
    setSuccess,
    newOrder,
    setNewOrder,
    shippingFee,
    setShippingFee,
    newCustomer,
    setNewCustomer,
    orderHistory,
    setOrderHistory,
    orderHistoryLoaded,
    setOrderHistoryLoaded,
    historyFilters,
    setHistoryFilters,
    historyCustomerSearchTerm,
    setHistoryCustomerSearchTerm,
    filteredHistoryCustomers,
    setFilteredHistoryCustomers,
    shippingOrders,
    setShippingOrders,
    shippingDate,
    setShippingDate,
    weeklyShippingData,
    setWeeklyShippingData,
    showWeeklyOverview,
    setShowWeeklyOverview,
    customerSearchTerm,
    setCustomerSearchTerm,
    customerSourceFilter,
    setCustomerSourceFilter,
    filteredCustomers,
    inventoryData,
    setInventoryData,
    inventoryTransactions,
    setInventoryTransactions,
    inventoryForm,
    setInventoryForm,
    editingCustomer,
    setEditingCustomer,
    editCustomerForm,
    setEditCustomerForm,
    editingOrder,
    setEditingOrder,
    editOrderForm,
    setEditOrderForm,
    downloadOptions,
    setDownloadOptions,
    uploadOptions,
    setUploadOptions,
    idMappings,
    setIdMappings,
    // 方法
    fetchCustomers,
    fetchProducts,
    fetchShippingOrders,
    handleUpdateShippingStatus,
    fetchWeeklyShippingData,
    fetchInventoryData,
    fetchInventoryTransactions,
    handleInventoryTransaction,
    handleDeleteInventoryTransaction,
    handleResetInventoryTransactions,
    handleResetAllStock,
    handleCustomerSearch,
    handleSourceFilter,
    handleHistoryCustomerSearch,
    startEditCustomer,
    cancelEditCustomer,
    handleUpdateCustomer,
    handleDeleteCustomer,
    fetchOrderHistory,
    handleAddOrder,
    handleAddCustomer,
    handleEditOrder,
    handleUpdateOrder,
    handleDeleteOrder,
    updateEditOrderItem,
    addEditOrderItem,
    removeEditOrderItem,
    addOrderItem,
    addGiftItem,
    removeOrderItem,
    updateOrderItem,
    calculateTotalAmount,
    calculateCreditCardFee,
    calculateShopeeFee,
    calculateEditCreditCardFee,
    calculateEditShopeeFee,
    handleSeparateDownload,
    handleBatchDownload,
    handleSeparateUpload,
    handleBatchUpload,
    exportToCSV,
    deleteOrderHistory,
    user,
  };
}
