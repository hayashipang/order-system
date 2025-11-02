# Customers Hook 抽取 Diff 報告

## 📋 變更摘要

將 `useAdminPanel.js` 中的 Section 3（Customers Management）抽取成獨立的 `useCustomers.js` Hook。

---

## ✅ 新增檔案：useCustomers.js

**位置：** `client/src/components/AdminPanel/hooks/useCustomers.js`

### 檔案內容結構：

```javascript
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
import { filterCustomersUtil } from "../utils/adminPanelUtils";

export default function useCustomers({
  setLoading,
  setError,
  setSuccess,
  setActiveTab,
  setFilteredHistoryCustomers,
}) {
  // ✅ Section: Customers State
  // - customers
  // - filteredCustomers
  // - customerSearchTerm
  // - customerSourceFilter
  // - editingCustomer
  // - editCustomerForm
  // - newCustomer

  // ✅ Section: API Fetch Functions
  // - fetchCustomers

  // ✅ Section: Customers Management Handlers
  // - handleCustomerSearch
  // - handleSourceFilter
  // - startEditCustomer
  // - cancelEditCustomer
  // - handleAddCustomer
  // - handleUpdateCustomer
  // - handleDeleteCustomer

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
```

---

## 🔄 修改檔案：useAdminPanel.js

### 1. 新增 Import

```javascript
// 新增在檔案頂部
import useCustomers from "./useCustomers";
```

### 2. 移除 Customers State 定義

**刪除的程式碼：**
```javascript
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
```

### 3. 新增 Customers Module Hook 呼叫

**新增的程式碼：**
```javascript
// ======================================================
// ✅ Section: Customers Module (from useCustomers hook)
// ======================================================

const customersModule = useCustomers({
  setLoading,
  setError,
  setSuccess,
  setActiveTab,
  setFilteredHistoryCustomers,
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
```

### 4. 移除 Section 3: Customers Management Handlers

**刪除的程式碼：**
```javascript
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
  setLoading(true);
  setError("");
  setSuccess("");
  try {
    if (!newCustomer.name.trim()) throw new Error("請填寫客戶姓名");
    await addCustomerApi(newCustomer);
    setSuccess("客戶新增成功！");
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
    setTimeout(() => setActiveTab("customers"), 500);
  } catch (err) {
    setError("新增客戶失敗: " + err.message);
  } finally {
    setLoading(false);
  }
};

// ----------------------------------------------------------
// ✅ 更新客戶資料
// ----------------------------------------------------------
const handleUpdateCustomer = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  setSuccess("");
  try {
    if (!editCustomerForm.name.trim()) {
      throw new Error("請填寫客戶姓名");
    }
    await updateCustomerApi(editingCustomer.id, editCustomerForm);
    setSuccess("客戶更新成功！");
    await fetchCustomers();
    cancelEditCustomer();
  } catch (err) {
    setError("更新客戶失敗: " + err.message);
  } finally {
    setLoading(false);
  }
};

// ----------------------------------------------------------
// ✅ 刪除客戶
// ----------------------------------------------------------
const handleDeleteCustomer = async (customerId, customerName) => {
  if (!window.confirm(`確定要刪除客戶「${customerName}」嗎？\n\n⚠️ 警告：此操作將同時刪除該客戶的所有訂單和相關資料，無法復原！`)) {
    return;
  }
  setLoading(true);
  setError("");
  setSuccess("");
  try {
    await deleteCustomerApi(customerId);
    setSuccess("客戶刪除成功！");
    await fetchCustomers();
  } catch (err) {
    setError("刪除客戶失敗: " + err.message);
  } finally {
    setLoading(false);
  }
};
```

### 5. 移除 fetchCustomers 函數

**刪除的程式碼：**
```javascript
const fetchCustomers = async () => {
  try {
    const data = await fetchCustomersApi();
    setCustomers(data);
    setFilteredCustomers(data);
    setFilteredHistoryCustomers(data);
  } catch (err) {
    setError("載入客戶列表失敗: " + err.message);
    setCustomers([]);
    setFilteredCustomers([]);
    setFilteredHistoryCustomers([]);
  }
};
```

### 6. 保留 handleHistoryCustomerSearch

**保留的程式碼（屬於訂單歷史功能）：**
```javascript
// ======================================================
// ✅ Section: Order History Customer Search (保留，因為屬於訂單歷史功能)
// ======================================================

// ----------------------------------------------------------
// ✅ 訂單歷史客戶搜尋
// ----------------------------------------------------------
const handleHistoryCustomerSearch = (searchTerm) => {
  setHistoryCustomerSearchTerm(searchTerm);
  const filtered = filterHistoryCustomersUtil(customers, searchTerm);
  setFilteredHistoryCustomers(filtered);
  
  // 如果當前選中的客戶不在新的搜尋結果中，清除選擇
  if (historyFilters.customer_id) {
    const selectedCustomerExists = filtered.some(customer => customer.id === parseInt(historyFilters.customer_id));
    if (!selectedCustomerExists) {
      setHistoryFilters({ ...historyFilters, customer_id: "" });
    }
  }
};
```

---

## ✅ 驗證項目

### useCustomers.js
- ✅ 包含所有 customers 相關的 state
- ✅ 包含 fetchCustomers 函數
- ✅ 包含所有 customers 管理相關的 handlers
- ✅ Return 結構符合要求
- ✅ 邏輯完全保持不變

### useAdminPanel.js
- ✅ 導入 useCustomers hook
- ✅ 正確呼叫 useCustomers 並傳入依賴
- ✅ 從 customersModule 解構所有需要的變數和 handlers
- ✅ 刪除了 Section 3 的所有程式碼
- ✅ 刪除了 fetchCustomers 函數
- ✅ Return 語句保持不變
- ✅ 其他 Section（4-7）完全未動

---

## 📊 統計

- **新增檔案：** 1 個（useCustomers.js，246 行）
- **修改檔案：** 1 個（useAdminPanel.js）
- **刪除程式碼行數：** ~150 行（Customers Section）
- **新增程式碼行數：** ~35 行（Hook 呼叫和解構）

---

## ✅ 完成狀態

所有變更已完成並通過 lint 檢查！

