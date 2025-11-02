// ==========================================================
//  useHistoryIO.js
//  ✅ 抽取自 useAdminPanel.js Section 7: History / Exports / Data Download & Upload / Misc
//  ✅ 保持邏輯完全不變
// ==========================================================

import { useState, useEffect, useRef } from "react";

import {
  fetchOrderHistory as fetchOrderHistoryApi,
  deleteOrderHistory as deleteOrderHistoryApi,
  exportToCSV as exportToCSVApi,
  downloadData as downloadDataApi,
  batchDownload as batchDownloadApi,
  batchUpload as batchUploadApi,
  separateUpload as separateUploadApi,
} from "../api/adminPanelApi";

import { getTodayDateString } from "../utils/date";
import {
  filterHistoryCustomersUtil,
} from "../utils/filters";

import { runWithStatus } from "../api/runWithStatus";

// ==========================================================
// ✅ useHistoryIO — History / Exports / Data I/O Hook
// ==========================================================

export default function useHistoryIO({ customers, setFilteredHistoryCustomers }) {
  // ======================================================
  // ✅ Section: History & Downloads State
  // ======================================================

  const [orderHistory, setOrderHistory] = useState([]);
  const [orderHistoryLoaded, setOrderHistoryLoaded] = useState(false);

  const today = getTodayDateString();
  const [historyFilters, setHistoryFilters] = useState({
    customer_id: "",
    start_date: today,
    end_date: today,
    order_type: ""
  });

  const [historyCustomerSearchTerm, setHistoryCustomerSearchTerm] = useState("");
  const [filteredHistoryCustomers, setFilteredHistoryCustomersInternal] = useState([]);

  const [downloadOptions, setDownloadOptions] = useState({
    customers: true,
    products: true,
    orders: true,
    posOrders: false
  });

  const [uploadOptions, setUploadOptions] = useState({
    customers: false,
    products: false,
    orders: false,
    posOrders: false
  });

  // 注意：以下函數需要使用 setLoading, setError, setSuccess, activeTab, fetchCustomers, fetchProducts
  // 這些將通過 closure 從 useAdminPanel 中獲取（見 useAdminPanel.js 中的調用方式）
  // 由於簽名簡化，這些依賴需要在 useAdminPanel.js 中通過 closure 提供

  // ======================================================
  // ✅ Section: History Management Handlers
  // ======================================================

  // 使用 ref 來存儲從外部獲取的依賴
  const depsRef = useRef({
    setLoading: null,
    setError: null,
    setSuccess: null,
    activeTab: null,
    fetchCustomers: null,
    fetchProducts: null,
  });

  // 初始化依賴的函數（由 useAdminPanel.js 通過 closure 調用）
  const _initDeps = (deps) => {
    depsRef.current = {
      setLoading: deps.setLoading,
      setError: deps.setError,
      setSuccess: deps.setSuccess,
      activeTab: deps.activeTab,
      fetchCustomers: deps.fetchCustomers,
      fetchProducts: deps.fetchProducts,
    };
  };

  // ----------------------------------------------------------
  // ✅ 取得訂單歷史（可強制重新整理）
  // ----------------------------------------------------------
  const fetchOrderHistory = async (forceReload = false) => {
    if (orderHistoryLoaded && !forceReload) {
      console.log("🔄 訂單歷史已載入，跳過重複載入");
      return;
    }
    const { setLoading, setError } = depsRef.current;
    if (!setLoading || !setError) {
      console.error("useHistoryIO: setLoading, setError 未初始化");
      return;
    }
    await runWithStatus(
      async () => {
        const data = await fetchOrderHistoryApi(historyFilters);
        setOrderHistory(data);
        setOrderHistoryLoaded(true);
        return data;
      },
      {
        setLoading,
        setError,
        setSuccess: null,
        okMsg: null,
        errMsg: "載入訂單歷史失敗",
      }
    ).catch((err) => {
      setOrderHistory([]);
      if (setError) setError("載入訂單歷史失敗: " + err.message);
    });
  };

  // ----------------------------------------------------------
  // ✅ 訂單歷史客戶搜尋
  // ----------------------------------------------------------
  const handleHistoryCustomerSearch = (searchTerm) => {
    setHistoryCustomerSearchTerm(searchTerm);
    const filtered = filterHistoryCustomersUtil(customers, searchTerm);
    setFilteredHistoryCustomersInternal(filtered);
    setFilteredHistoryCustomers(filtered);
    
    // 如果當前選中的客戶不在新的搜尋結果中，清除選擇
    if (historyFilters.customer_id) {
      const selectedCustomerExists = filtered.some(customer => customer.id === parseInt(historyFilters.customer_id));
      if (!selectedCustomerExists) {
        setHistoryFilters({ ...historyFilters, customer_id: "" });
      }
    }
  };

  // ----------------------------------------------------------
  // ✅ 匯出訂單歷史（CSV）
  // ----------------------------------------------------------
  const exportToCSV = async () => {
    const { setSuccess } = depsRef.current;
    if (!setSuccess) {
      console.error("useHistoryIO: setSuccess 未初始化");
      return;
    }
    await runWithStatus(
      async () => {
        await exportToCSVApi(historyFilters);
        if (setSuccess) setSuccess("CSV 匯出成功！");
      },
      {
        setLoading: null,
        setError: null,
        setSuccess: null, // 在 async 函數內部手動設置
        okMsg: null,
        errMsg: null,
      }
    ).catch(() => {
      alert("匯出失敗，請稍後再試");
    });
  };

  // ----------------------------------------------------------
  // ✅ 刪除訂單歷史（依篩選條件）
  // ----------------------------------------------------------
  const deleteOrderHistory = async () => {
    const confirmMessage = `確定要刪除符合當前篩選條件的所有訂單嗎？\n\n此操作無法復原！\n\n篩選條件：\n` +
      `${historyFilters.customer_id ? `客戶：${filteredHistoryCustomers.find(c => c.id == historyFilters.customer_id)?.name || "已選客戶"}\n` : ""}` +
      `${historyFilters.order_type ? `訂單類型：${historyFilters.order_type === "online" ? "網路訂單" : "現場銷售"}\n` : ""}` +
      `${historyFilters.start_date ? `開始日期：${historyFilters.start_date}\n` : ""}` +
      `${historyFilters.end_date ? `結束日期：${historyFilters.end_date}\n` : ""}` +
      `符合條件的訂單數量：${orderHistory.length} 筆\n\n請輸入「確認刪除」以繼續：`;
    
    const userInput = prompt(confirmMessage);
    if (userInput !== "確認刪除") {
      alert("已取消刪除操作");
      return;
    }
    if (!window.confirm("⚠️ 最後確認：您真的要刪除這些訂單嗎？此操作無法復原！")) {
      return;
    }
    const { setLoading, setError, setSuccess } = depsRef.current;
    if (!setLoading || !setError || !setSuccess) {
      console.error("useHistoryIO: setLoading, setError, setSuccess 未初始化");
      return;
    }
    await runWithStatus(
      async () => {
        const response = await deleteOrderHistoryApi(historyFilters);
        if (response.success) {
          if (setSuccess) setSuccess(`✅ ${response.message}`);
          await fetchOrderHistory(true);
          setTimeout(() => {
            if (setSuccess) setSuccess("");
          }, 3000);
        } else {
          if (setError) setError("刪除失敗：" + (response.message || "未知錯誤"));
        }
        return response;
      },
      {
        setLoading,
        setError,
        setSuccess: null, // 在 async 函數內部手動設置
        okMsg: null,
        errMsg: "刪除失敗",
      }
    ).catch((error) => {
      if (setError) setError("刪除失敗：" + (error.response?.data?.error || error.message));
    });
  };

  // ======================================================
  // ✅ Section: Data Download/Upload Handlers
  // ======================================================

  // ----------------------------------------------------------
  // ✅ 單項資料下載
  // ----------------------------------------------------------
  const handleSeparateDownload = async (dataType) => {
    const { setLoading, setError, setSuccess } = depsRef.current;
    if (!setLoading || !setError || !setSuccess) {
      console.error("useHistoryIO: setLoading, setError, setSuccess 未初始化");
      return;
    }
    await runWithStatus(
      async () => {
        const data = await downloadDataApi(dataType);
        
        let fileName, dataKey;
        switch (dataType) {
          case "customers":
            fileName = `customers_${new Date().toISOString().split("T")[0]}.json`;
            dataKey = "customers";
            break;
          case "products":
            fileName = `products_${new Date().toISOString().split("T")[0]}.json`;
            dataKey = "products";
            break;
          case "orders":
            fileName = `orders_${new Date().toISOString().split("T")[0]}.json`;
            dataKey = "orders";
            break;
          case "posOrders":
            fileName = `pos_orders_${new Date().toISOString().split("T")[0]}.json`;
            dataKey = "posOrders";
            break;
          default:
            throw new Error("無效的資料類型");
        }

        const backupData = {
          backup_date: new Date().toISOString(),
          data_type: dataType,
          [dataKey]: data
        };

        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        if (setSuccess) setSuccess(`${dataType} 資料下載成功！`);
        return data;
      },
      {
        setLoading,
        setError,
        setSuccess: null, // 在 async 函數內部手動設置
        okMsg: null,
        errMsg: `下載 ${dataType} 資料失敗`,
      }
    ).catch((err) => {
      if (setError) setError(`下載 ${dataType} 資料失敗: ` + (err.response?.data?.error || err.message));
    });
  };

  // ----------------------------------------------------------
  // ✅ 批量資料下載
  // ----------------------------------------------------------
  const handleBatchDownload = async () => {
    const { setLoading, setError, setSuccess } = depsRef.current;
    if (!setLoading || !setError || !setSuccess) {
      console.error("useHistoryIO: setLoading, setError, setSuccess 未初始化");
      return;
    }
    await runWithStatus(
      async () => {
        const backupData = await batchDownloadApi(downloadOptions);
        
        const dataStr = JSON.stringify(backupData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `backup_${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        if (setSuccess) setSuccess(`批量下載成功！包含: ${backupData.download_types.join(", ")}`);
        return backupData;
      },
      {
        setLoading,
        setError,
        setSuccess: null, // 在 async 函數內部手動設置
        okMsg: null,
        errMsg: "批量下載失敗",
      }
    ).catch((err) => {
      if (setError) setError("批量下載失敗: " + (err.response?.data?.error || err.message));
    });
  };

  // ----------------------------------------------------------
  // ✅ 單項資料上傳
  // ----------------------------------------------------------
  const handleSeparateUpload = (dataType) => {
    const { setLoading, setError, setSuccess, fetchCustomers, fetchProducts } = depsRef.current;
    if (!setLoading || !setError || !setSuccess || !fetchCustomers || !fetchProducts) {
      console.error("useHistoryIO: 依賴未初始化");
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await runWithStatus(
        async () => {
          const text = await file.text();
          const backupData = JSON.parse(text);
          await separateUploadApi(dataType, backupData);
          await fetchCustomers();
          await fetchProducts();
          await fetchOrderHistory(true);
          if (setSuccess) setSuccess(`${dataType} 資料上傳成功！`);
        },
        {
          setLoading,
          setError,
          setSuccess: null, // 在 async 函數內部手動設置
          okMsg: null,
          errMsg: `上傳 ${dataType} 資料失敗`,
        }
      ).catch((err) => {
        if (setError) setError(`上傳 ${dataType} 資料失敗: ` + (err.response?.data?.error || err.message));
      });
    };
    input.click();
  };

  // ----------------------------------------------------------
  // ✅ 批量資料上傳
  // ----------------------------------------------------------
  const handleBatchUpload = () => {
    const { setLoading, setError, setSuccess, fetchCustomers, fetchProducts } = depsRef.current;
    if (!setLoading || !setError || !setSuccess || !fetchCustomers || !fetchProducts) {
      console.error("useHistoryIO: 依賴未初始化");
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      await runWithStatus(
        async () => {
          const text = await file.text();
          const backupData = JSON.parse(text);
          await batchUploadApi(uploadOptions, backupData);
          await fetchCustomers();
          await fetchProducts();
          await fetchOrderHistory(true);
          const uploadTypes = [];
          if (backupData.customers && uploadOptions.customers) uploadTypes.push("customers");
          if (backupData.products && uploadOptions.products) uploadTypes.push("products");
          if (backupData.orders && uploadOptions.orders) uploadTypes.push("orders");
          if (backupData.posOrders && uploadOptions.posOrders) uploadTypes.push("posOrders");
          if (setSuccess) setSuccess(`批量上傳成功！包含: ${uploadTypes.join(", ")}`);
        },
        {
          setLoading,
          setError,
          setSuccess: null, // 在 async 函數內部手動設置
          okMsg: null,
          errMsg: "批量上傳失敗",
        }
      ).catch((err) => {
        if (setError) setError("批量上傳失敗: " + (err.response?.data?.error || err.message));
      });
    };
    input.click();
  };

  // ======================================================
  // ✅ Section: useEffect Hooks (History Related)
  // ======================================================

  // 注意：useEffect 中使用的 activeTab 需要從外部獲取
  // 由於簽名簡化，activeTab 的監聽需要在 useAdminPanel 中處理
  // 因此移除此處的 useEffect

  // ======================================================
  // ✅ Return
  // ======================================================

  return {
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
    _initDeps, // 內部使用，用於初始化依賴（由 useAdminPanel.js 通過 closure 調用）
  };
}
