// ==========================================================
//  useOrders.js
//  ✅ 抽取自 useAdminPanel.js Section 4: Orders Management
//  ✅ 保持邏輯完全不變
// ==========================================================

import { useState, useEffect } from "react";

import {
  addOrder as addOrderApi,
  fetchOrderById as fetchOrderByIdApi,
  updateOrder as updateOrderApi,
  deleteOrder as deleteOrderApi,
} from "../api/adminPanelApi";

import { getTodayDateString } from "../utils/date";
import {
  calculateTotalAmount,
  calculateCreditCardFee,
  calculateShopeeFee,
  calculateEditCreditCardFee,
  calculateEditShopeeFee,
} from "../utils/orderTotals";

// ==========================================================
// ✅ useOrders — Orders Management Hook
// ==========================================================

export default function useOrders({
  setLoading,
  setError,
  setSuccess,
  activeTab,
  setActiveTab,
  customers,
  shippingFee,
  fetchProducts,
  fetchOrderHistory,
}) {
  // ======================================================
  // ✅ Section: Orders State
  // ======================================================

  const [newOrder, setNewOrder] = useState({
    customer_id: "",
    order_date: "",
    delivery_date: "",
    production_date: "",
    notes: "",
    items: [{ product_name: "", quantity: 1, unit_price: 0, special_notes: "", is_gift: false }],
    shipping_type: "none",
    shipping_fee: 0
  });

  const [editingOrder, setEditingOrder] = useState(null);
  const [editOrderForm, setEditOrderForm] = useState({
    customer_id: "",
    order_date: "",
    delivery_date: "",
    notes: "",
    items: [{ product_name: "", quantity: 1, unit_price: 0, special_notes: "", status: "pending", is_gift: false }],
    shipping_type: "none",
    shipping_fee: 0
  });

  // ======================================================
  // ✅ Section: Orders Management Handlers
  // ======================================================

  // ----------------------------------------------------------
  // ✅ 新增訂單
  // ----------------------------------------------------------
  const handleAddOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (!newOrder.customer_id) throw new Error("請選擇客戶");
      if (!newOrder.delivery_date) throw new Error("請選擇交貨日期");
      if (newOrder.items.some(item => !item.product_name || item.quantity <= 0)) {
        throw new Error("請填寫完整的產品資訊");
      }

      const finalShippingFee = newOrder.shipping_type === "free" ? -shippingFee : 0;
      const orderData = {
        ...newOrder,
        shipping_fee: finalShippingFee,
        credit_card_fee: calculateCreditCardFee(newOrder, customers),
        shopee_fee: calculateShopeeFee(newOrder, customers)
      };

      await addOrderApi(orderData);
      setSuccess("訂單建立成功！");

      const todayStr = getTodayDateString();
      setNewOrder({
        customer_id: "",
        order_date: todayStr,
        delivery_date: "",
        production_date: "",
        notes: "",
        items: [{ product_name: "", quantity: 1, unit_price: 0, special_notes: "", is_gift: false }],
        shipping_type: "none",
        shipping_fee: 0
      });
    } catch (err) {
      setError("建立訂單失敗: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // ✅ 編輯訂單：載入資料進表單
  // ----------------------------------------------------------
  const handleEditOrder = async (orderId) => {
    try {
      setLoading(true);
      const order = await fetchOrderByIdApi(orderId);
      await fetchProducts();
      setEditingOrder(orderId);
      setEditOrderForm({
        customer_id: order.customer_id,
        order_date: order.order_date,
        delivery_date: order.delivery_date,
        notes: order.notes || "",
        items: order.items.length > 0 ? order.items : [
          { product_name: "", quantity: 1, unit_price: 0, special_notes: "", status: "pending", is_gift: false }
        ],
        shipping_type: order.shipping_type || "none",
        shipping_fee: order.shipping_fee || 0
      });
      setActiveTab("edit-order");
    } catch (err) {
      setError("載入訂單失敗: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // ✅ 更新訂單（提交編輯結果）
  // ----------------------------------------------------------
  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (!editOrderForm.customer_id) throw new Error("請選擇客戶");
      if (!editOrderForm.delivery_date) throw new Error("請選擇交貨日期");
      if (editOrderForm.items.some(item => !item.product_name || item.quantity <= 0)) {
        throw new Error("請填寫完整的產品資訊");
      }

      const finalShippingFee = editOrderForm.shipping_type === "free" ? -shippingFee : 0;
      const orderData = {
        ...editOrderForm,
        shipping_fee: finalShippingFee,
        credit_card_fee: calculateEditCreditCardFee(editOrderForm, customers),
        shopee_fee: calculateEditShopeeFee(editOrderForm, customers)
      };

      await updateOrderApi(editingOrder, orderData);
      setSuccess("訂單更新成功！");
      setEditingOrder(null);
      setEditOrderForm({
        customer_id: "",
        order_date: "",
        delivery_date: "",
        notes: "",
        items: [{ product_name: "", quantity: 1, unit_price: 0, special_notes: "", status: "pending", is_gift: false }],
        shipping_type: "none",
        shipping_fee: 0
      });
      setActiveTab("order-history");
      await fetchOrderHistory(true);
    } catch (err) {
      setError("更新訂單失敗: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // ✅ 刪除訂單
  // ----------------------------------------------------------
  const handleDeleteOrder = async (orderId, customerName, orderDate) => {
    if (!window.confirm(`確定要刪除客戶「${customerName}」在「${orderDate}」的訂單嗎？\n\n⚠️ 警告：此操作將永久刪除該訂單及其所有項目，無法復原！`)) {
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await deleteOrderApi(orderId);
      setSuccess("訂單刪除成功！");
      await fetchOrderHistory(true);
    } catch (err) {
      setError("刪除訂單失敗: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // ✅ Section: Order Items Management
  // ======================================================

  // ----------------------------------------------------------
  // ✅ 更新訂單項目（編輯模式）
  // ----------------------------------------------------------
  const updateEditOrderItem = (index, field, value) => {
    const updatedItems = [...editOrderForm.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setEditOrderForm({ ...editOrderForm, items: updatedItems });
  };

  // ----------------------------------------------------------
  // ✅ 新增訂單項目（編輯模式）
  // ----------------------------------------------------------
  const addEditOrderItem = () => {
    setEditOrderForm({
      ...editOrderForm,
      items: [...editOrderForm.items, { product_name: "", quantity: 1, unit_price: 0, special_notes: "", status: "pending", is_gift: false }]
    });
  };

  // ----------------------------------------------------------
  // ✅ 移除訂單項目（編輯模式）
  // ----------------------------------------------------------
  const removeEditOrderItem = (index) => {
    if (editOrderForm.items.length > 1) {
      const updatedItems = editOrderForm.items.filter((_, i) => i !== index);
      setEditOrderForm({ ...editOrderForm, items: updatedItems });
    }
  };

  // ----------------------------------------------------------
  // ✅ 新增訂單項目（新增訂單模式）
  // ----------------------------------------------------------
  const addOrderItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { product_name: "", quantity: 1, unit_price: 0, special_notes: "", is_gift: false }]
    });
  };

  // ----------------------------------------------------------
  // ✅ 新增贈品（新增訂單模式）
  // ----------------------------------------------------------
  const addGiftItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { product_name: "隨機口味", quantity: 1, unit_price: -30, special_notes: "", is_gift: true }]
    });
  };

  // ----------------------------------------------------------
  // ✅ 移除訂單項目（新增訂單模式）
  // ----------------------------------------------------------
  const removeOrderItem = (index) => {
    if (newOrder.items.length > 1) {
      setNewOrder({
        ...newOrder,
        items: newOrder.items.filter((_, i) => i !== index)
      });
    }
  };

  // ----------------------------------------------------------
  // ✅ 更新訂單項目（新增訂單模式）
  // ----------------------------------------------------------
  const updateOrderItem = (index, field, value) => {
    const updatedItems = [...newOrder.items];
    updatedItems[index][field] = value;
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  // ==================== 計算函數 ====================

  // 注意：計算函數已抽取到 utils/orderTotals.js
  // 以下為包裝函數，用於保持原有調用方式（無參數調用）
  const calculateTotalAmountWrapper = () => {
    return calculateTotalAmount(newOrder, shippingFee, customers);
  };

  const calculateCreditCardFeeWrapper = () => {
    return calculateCreditCardFee(newOrder, customers);
  };

  const calculateShopeeFeeWrapper = () => {
    return calculateShopeeFee(newOrder, customers);
  };

  const calculateEditCreditCardFeeWrapper = () => {
    return calculateEditCreditCardFee(editOrderForm, customers);
  };

  const calculateEditShopeeFeeWrapper = () => {
    return calculateEditShopeeFee(editOrderForm, customers);
  };

  // ======================================================
  // ✅ Section: useEffect Hooks (Orders Related)
  // ======================================================

  // ----------------------------------------------------------
  // ✅ Effect：初始化 newOrder 日期
  // ----------------------------------------------------------
  useEffect(() => {
    const todayStr = getTodayDateString();
    setNewOrder(prev => ({
      ...prev,
      order_date: todayStr,
      delivery_date: "",
      production_date: ""
    }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ----------------------------------------------------------
  // ✅ Effect：當 activeTab 切換到 new-order 時更新日期
  // ----------------------------------------------------------
  useEffect(() => {
    if (activeTab === "new-order") {
      const todayStr = getTodayDateString();
      setNewOrder(prev => ({
        ...prev,
        order_date: todayStr,
        delivery_date: "",
        production_date: ""
      }));
    }
  }, [activeTab]);

  // ----------------------------------------------------------
  // ✅ Effect：Debug - 編輯表單狀態變化
  // ----------------------------------------------------------
  useEffect(() => {
    if (editingOrder) {
      console.log("編輯表單狀態變化:", editOrderForm);
    }
  }, [editOrderForm, editingOrder]);

  // ======================================================
  // ✅ Return
  // ======================================================

  return {
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
    calculateTotalAmount: calculateTotalAmountWrapper,
    calculateCreditCardFee: calculateCreditCardFeeWrapper,
    calculateShopeeFee: calculateShopeeFeeWrapper,
    calculateEditCreditCardFee: calculateEditCreditCardFeeWrapper,
    calculateEditShopeeFee: calculateEditShopeeFeeWrapper,
  };
}

