// ==========================================================
//  useShipping.js
//  ✅ 抽取自 useAdminPanel.js Section 5: Shipping Management
//  ✅ 保持邏輯完全不變
// ==========================================================

import { useState, useEffect, useCallback } from "react";

import {
  fetchShippingOrders as fetchShippingOrdersApi,
  updateShippingStatus as updateShippingStatusApi,
  fetchWeeklyShippingData as fetchWeeklyShippingDataApi,
} from "../api/adminPanelApi";

import { runWithStatus } from "../api/runWithStatus";

// ==========================================================
// ✅ useShipping — Shipping Management Hook
// ==========================================================

export default function useShipping({
  setLoading,
  setError,
  setSuccess,
  activeTab,
  fetchInventoryData,
  fetchOrderHistory,
}) {
  // ======================================================
  // ✅ Section: Shipping State
  // ======================================================

  const [shippingOrders, setShippingOrders] = useState([]);
  const [shippingDate, setShippingDate] = useState(new Date().toISOString().split("T")[0]);
  const [weeklyShippingData, setWeeklyShippingData] = useState([]);
  const [showWeeklyOverview, setShowWeeklyOverview] = useState(true);

  // ======================================================
  // ✅ Section: Shipping Management Handlers
  // ======================================================

  // ----------------------------------------------------------
  // ✅ 重新取得出貨訂單
  // ----------------------------------------------------------
  const fetchShippingOrders = useCallback(async () => {
    await runWithStatus(
      async () => {
        const orders = await fetchShippingOrdersApi(shippingDate);
        setShippingOrders(orders);
        if (setSuccess) setSuccess(`已載入 ${orders?.length || 0} 筆出貨訂單`);
        await fetchInventoryData();
        return orders;
      },
      {
        setLoading,
        setError,
        setSuccess: null, // 在 async 函數內部手動設置
        okMsg: null,
        errMsg: "載入出貨訂單失敗",
      }
    ).catch((err) => {
      setShippingOrders([]);
      if (setError) setError("載入出貨訂單失敗: " + (err.response?.data?.error || err.message));
    });
  }, [shippingDate, setLoading, setError, setSuccess, fetchInventoryData]);

  // ----------------------------------------------------------
  // ✅ 更新出貨狀態（例如：已出貨/未出貨）
  // ----------------------------------------------------------
  const handleUpdateShippingStatus = async (orderId, status) => {
    await runWithStatus(
      async () => {
        await updateShippingStatusApi(orderId, status);
        if (setSuccess) setSuccess(`訂單狀態已更新為：${status === "shipped" ? "已出貨" : "待出貨"}`);
        await fetchShippingOrders();
        if (showWeeklyOverview) {
          await fetchWeeklyShippingData();
        }
        if (activeTab === "order-history") {
          await fetchOrderHistory(true);
        }
      },
      {
        setLoading,
        setError,
        setSuccess: null, // 在 async 函數內部手動設置
        okMsg: null,
        errMsg: "更新出貨狀態失敗",
      }
    ).catch((err) => {
      if (setError) setError("更新出貨狀態失敗: " + (err.response?.data?.error || err.message));
    });
  };

  // ----------------------------------------------------------
  // ✅ 載入週出貨數據（依照 shippingDate）
  // ----------------------------------------------------------
  const fetchWeeklyShippingData = useCallback(async () => {
    await runWithStatus(
      async () => {
        const data = await fetchWeeklyShippingDataApi(shippingDate);
        setWeeklyShippingData(data);
        if (setSuccess) setSuccess(`已載入週出貨概覽數據`);
        return data;
      },
      {
        setLoading,
        setError,
        setSuccess: null, // 在 async 函數內部手動設置
        okMsg: null,
        errMsg: "載入週出貨概覽失敗",
      }
    ).catch((err) => {
      setWeeklyShippingData([]);
      if (setError) setError("載入週出貨概覽失敗: " + (err.response?.data?.error || err.message));
    });
  }, [shippingDate, setLoading, setError, setSuccess]);

  // ======================================================
  // ✅ Section: useEffect Hooks (Shipping Related)
  // ======================================================

  // ----------------------------------------------------------
  // ✅ Effect：載入 Shipping Orders 和 Weekly Data
  //   當 activeTab 切換到 shipping-management 時載入
  // ----------------------------------------------------------
  useEffect(() => {
    if (activeTab === "shipping-management") {
      fetchShippingOrders();
      fetchWeeklyShippingData();
    }
  }, [activeTab, shippingDate, fetchShippingOrders, fetchWeeklyShippingData]);

  // ======================================================
  // ✅ Return
  // ======================================================

  return {
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
  };
}

