// ==========================================================
//  useCustomers.js
//  ✅ 抽取自 useAdminPanel.js Section 3: Customers Management
//  ✅ 保持邏輯完全不變
// ==========================================================

import { useState } from "react";

import {
  fetchCustomers as fetchCustomersApi,
  addCustomer as addCustomerApi,
  updateCustomer as updateCustomerApi,
  deleteCustomer as deleteCustomerApi,
} from "../api/adminPanelApi";

import {
  filterCustomersUtil,
} from "../utils/filters";

import { runWithStatus } from "../api/runWithStatus";

// ==========================================================
// ✅ useCustomers — Customers Management Hook
// ==========================================================

export default function useCustomers({
  setLoading,
  setError,
  setSuccess,
  setActiveTab,
  setFilteredHistoryCustomers,
}) {
  // ======================================================
  // ✅ Section: Customers State
  // ======================================================

  const [customers, setCustomers] = useState([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [customerSourceFilter, setCustomerSourceFilter] = useState("");

  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editCustomerForm, setEditCustomerForm] = useState({
    name: "",
    phone: "",
    address: "",
    family_mart_address: "",
    source: "直接來店訂購",
    payment_method: "貨到付款",
    order_number: ""
  });

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    family_mart_address: "",
    source: "現場訂購",
    payment_method: "面交付款",
    order_number: ""
  });

  // ======================================================
  // ✅ Section: API Fetch Functions
  // ======================================================

  // ----------------------------------------------------------
  // ✅ 取得客戶列表
  // ----------------------------------------------------------
  const fetchCustomers = async () => {
    try {
      const data = await fetchCustomersApi();
      setCustomers(data);
      setFilteredCustomers(data);
      if (setFilteredHistoryCustomers) {
        setFilteredHistoryCustomers(data);
      }
    } catch (err) {
      setError("載入客戶列表失敗: " + err.message);
      setCustomers([]);
      setFilteredCustomers([]);
      if (setFilteredHistoryCustomers) {
        setFilteredHistoryCustomers([]);
      }
    }
  };

  // ======================================================
  // ✅ Section: Customers Management Handlers
  // ======================================================

  // ----------------------------------------------------------
  // ✅ 客戶搜尋：文字搜尋
  // ----------------------------------------------------------
  const handleCustomerSearch = (searchTerm) => {
    setCustomerSearchTerm(searchTerm);
    const filtered = filterCustomersUtil(customers, searchTerm, customerSourceFilter);
    setFilteredCustomers(filtered);
  };

  // ----------------------------------------------------------
  // ✅ 客戶來源篩選（all / shopee / line）
  // ----------------------------------------------------------
  const handleSourceFilter = (source) => {
    setCustomerSourceFilter(source);
    const filtered = filterCustomersUtil(customers, customerSearchTerm, source);
    setFilteredCustomers(filtered);
  };

  // ----------------------------------------------------------
  // ✅ 編輯前：載入客戶資料到表單
  // ----------------------------------------------------------
  const startEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setEditCustomerForm({
      name: customer.name,
      phone: customer.phone || "",
      address: customer.address || "",
      family_mart_address: customer.family_mart_address || "",
      source: customer.source || "直接來店訂購",
      payment_method: customer.payment_method || "貨到付款",
      order_number: customer.order_number || ""
    });
  };

  // ----------------------------------------------------------
  // ✅ 取消編輯
  // ----------------------------------------------------------
  const cancelEditCustomer = () => {
    setEditingCustomer(null);
    setEditCustomerForm({
      name: "",
      phone: "",
      address: "",
      family_mart_address: "",
      source: "直接來店訂購",
      payment_method: "貨到付款",
      order_number: ""
    });
  };

  // ----------------------------------------------------------
  // ✅ 新增客戶
  // ----------------------------------------------------------
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.name.trim()) {
      setError("請填寫客戶姓名");
      return;
    }
    await runWithStatus(
      async () => {
        await addCustomerApi(newCustomer);
        setNewCustomer({
          name: "",
          phone: "",
          address: "",
          family_mart_address: "",
          source: "直接來店訂購",
          payment_method: "貨到付款",
          order_number: ""
        });
        await fetchCustomers();
        if (setActiveTab) {
          setTimeout(() => setActiveTab("customers"), 500);
        }
      },
      {
        setLoading,
        setError,
        setSuccess,
        okMsg: "客戶新增成功！",
        errMsg: "新增客戶失敗",
      }
    );
  };

  // ----------------------------------------------------------
  // ✅ 更新客戶資料
  // ----------------------------------------------------------
  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!editCustomerForm.name.trim()) {
      setError("請填寫客戶姓名");
      return;
    }
    await runWithStatus(
      async () => {
        await updateCustomerApi(editingCustomer.id, editCustomerForm);
        await fetchCustomers();
        cancelEditCustomer();
      },
      {
        setLoading,
        setError,
        setSuccess,
        okMsg: "客戶更新成功！",
        errMsg: "更新客戶失敗",
      }
    );
  };

  // ----------------------------------------------------------
  // ✅ 刪除客戶
  // ----------------------------------------------------------
  const handleDeleteCustomer = async (customerId, customerName) => {
    if (!window.confirm(`確定要刪除客戶「${customerName}」嗎？\n\n⚠️ 警告：此操作將同時刪除該客戶的所有訂單和相關資料，無法復原！`)) {
      return;
    }
    await runWithStatus(
      async () => {
        await deleteCustomerApi(customerId);
        await fetchCustomers();
      },
      {
        setLoading,
        setError,
        setSuccess,
        okMsg: "客戶刪除成功！",
        errMsg: "刪除客戶失敗",
      }
    );
  };

  // ======================================================
  // ✅ Return
  // ======================================================

  return {
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
  };
}

