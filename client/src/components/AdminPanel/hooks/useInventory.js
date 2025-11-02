// ==========================================================
//  useInventory.js
//  ✅ 抽取自 useAdminPanel.js Section 6: Inventory Management
//  ✅ 保持邏輯完全不變
// ==========================================================

import { useState } from "react";

import {
  fetchInventoryData as fetchInventoryDataApi,
  fetchInventoryTransactions as fetchInventoryTransactionsApi,
  createInventoryTransaction as createInventoryTransactionApi,
  deleteInventoryTransaction as deleteInventoryTransactionApi,
  resetInventoryTransactions as resetInventoryTransactionsApi,
  resetAllStock as resetAllStockApi,
} from "../api/adminPanelApi";

import { runWithStatus } from "../api/runWithStatus";

// ==========================================================
// ✅ useInventory — Inventory Management Hook
// ==========================================================

export default function useInventory({
  setLoading,
  setError,
  setSuccess,
}) {
  // ======================================================
  // ✅ Section: Inventory State
  // ======================================================

  const [inventoryData, setInventoryData] = useState([]);
  const [inventoryTransactions, setInventoryTransactions] = useState([]);
  const [inventoryForm, setInventoryForm] = useState({
    product_id: "",
    transaction_type: "in",
    quantity: "",
    notes: ""
  });

  // ======================================================
  // ✅ Section: Inventory Management Handlers
  // ======================================================

  // ----------------------------------------------------------
  // ✅ 取得庫存資料
  // ----------------------------------------------------------
  const fetchInventoryData = async () => {
    await runWithStatus(
      async () => {
        const data = await fetchInventoryDataApi();
        setInventoryData(data);
        return data;
      },
      {
        setLoading: null, // 此函數不使用 loading
        setError,
        setSuccess: null,
        okMsg: null,
        errMsg: "載入庫存資料失敗",
      }
    ).catch((err) => {
      setInventoryData([]);
      if (setError) setError("載入庫存資料失敗: " + err.message);
    });
  };

  // ----------------------------------------------------------
  // ✅ 取得庫存異動記錄
  // ----------------------------------------------------------
  const fetchInventoryTransactions = async () => {
    await runWithStatus(
      async () => {
        const data = await fetchInventoryTransactionsApi();
        setInventoryTransactions(data);
        return data;
      },
      {
        setLoading: null, // 此函數不使用 loading
        setError,
        setSuccess: null,
        okMsg: null,
        errMsg: "載入庫存異動記錄失敗",
      }
    ).catch((err) => {
      setInventoryTransactions([]);
      if (setError) setError("載入庫存異動記錄失敗: " + err.message);
    });
  };

  // ----------------------------------------------------------
  // ✅ 新增庫存異動記錄
  // ----------------------------------------------------------
  const handleInventoryTransaction = async (e) => {
    e.preventDefault();
    if (!inventoryForm.product_id || !inventoryForm.quantity) {
      setError("請選擇產品並輸入數量");
      return;
    }
    const quantity = parseInt(inventoryForm.quantity);
    if (quantity <= 0) {
      setError("數量必須大於 0");
      return;
    }
    await runWithStatus(
      async () => {
        const transactionData = {
          ...inventoryForm,
          quantity: quantity,
          created_by: "admin"
        };
        await createInventoryTransactionApi(transactionData);
        if (setSuccess) setSuccess("庫存異動記錄成功！");
        setInventoryForm({
          product_id: "",
          transaction_type: "in",
          quantity: "",
          notes: ""
        });
        await fetchInventoryData();
        await fetchInventoryTransactions();
      },
      {
        setLoading,
        setError,
        setSuccess: null, // 在 async 函數內部手動設置
        okMsg: null,
        errMsg: "庫存異動失敗",
      }
    ).catch((err) => {
      if (setError) setError("庫存異動失敗: " + (err.response?.data?.error || err.message));
    });
  };

  // ----------------------------------------------------------
  // ✅ 刪除庫存異動記錄
  // ----------------------------------------------------------
  const handleDeleteInventoryTransaction = async (transactionId) => {
    if (!window.confirm("確定要刪除這筆庫存異動記錄嗎？此操作會反向調整庫存數量。")) {
      return;
    }
    await runWithStatus(
      async () => {
        await deleteInventoryTransactionApi(transactionId);
        if (setSuccess) setSuccess("庫存異動記錄已刪除！");
        await fetchInventoryData();
        await fetchInventoryTransactions();
      },
      {
        setLoading,
        setError,
        setSuccess: null, // 在 async 函數內部手動設置
        okMsg: null,
        errMsg: "刪除庫存異動記錄失敗",
      }
    ).catch((err) => {
      if (setError) setError("刪除庫存異動記錄失敗: " + (err.response?.data?.error || err.message));
    });
  };

  // ----------------------------------------------------------
  // ✅ 重置所有庫存異動記錄
  // ----------------------------------------------------------
  const handleResetInventoryTransactions = async () => {
    if (!window.confirm("確定要重置所有庫存異動記錄嗎？此操作會清空所有異動記錄，但不會改變當前的庫存數量。")) {
      return;
    }
    await runWithStatus(
      async () => {
        await resetInventoryTransactionsApi();
        if (setSuccess) setSuccess("所有庫存異動記錄已重置！");
        await fetchInventoryData();
        await fetchInventoryTransactions();
      },
      {
        setLoading,
        setError,
        setSuccess: null, // 在 async 函數內部手動設置
        okMsg: null,
        errMsg: "重置庫存異動記錄失敗",
      }
    ).catch((err) => {
      if (setError) setError("重置庫存異動記錄失敗: " + (err.response?.data?.error || err.message));
    });
  };

  // ----------------------------------------------------------
  // ✅ 重置所有庫存歸零
  // ----------------------------------------------------------
  const handleResetAllStock = async () => {
    const totalProducts = inventoryData.length;
    const totalStock = inventoryData.reduce((sum, p) => sum + (p.current_stock || 0), 0);
    const confirmMessage = `確定要將所有產品的庫存歸零嗎？\n\n此操作無法復原！\n\n產品數量：${totalProducts} 個\n當前總庫存：${totalStock} 件\n\n請輸入「確認歸零」以繼續：`;
    const userInput = prompt(confirmMessage);
    if (userInput !== "確認歸零") {
      alert("已取消歸零操作");
      return;
    }
    if (!window.confirm("⚠️ 最後確認：您真的要將所有產品庫存歸零嗎？此操作無法復原！")) {
      return;
    }
    await runWithStatus(
      async () => {
        const response = await resetAllStockApi();
        if (response.success) {
          if (setSuccess) setSuccess(`✅ ${response.message}`);
          await fetchInventoryData();
          await fetchInventoryTransactions();
          setTimeout(() => {
            if (setSuccess) setSuccess("");
          }, 3000);
        } else {
          if (setError) setError("歸零失敗：" + (response.message || "未知錯誤"));
        }
        return response;
      },
      {
        setLoading,
        setError,
        setSuccess: null, // 在 async 函數內部手動設置
        okMsg: null,
        errMsg: "歸零失敗",
      }
    ).catch((error) => {
      if (setError) setError("歸零失敗：" + (error.response?.data?.error || error.message));
    });
  };

  // ======================================================
  // ✅ Return
  // ======================================================

  return {
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
  };
}

