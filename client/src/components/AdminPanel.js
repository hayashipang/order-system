import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import config from '../config';

const AdminPanel = ({ user }) => {
  const [activeTab, setActiveTab] = useState(user?.role === 'kitchen' ? 'shipping-management' : 'new-order');
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 新增訂單表單狀態
  const [newOrder, setNewOrder] = useState({
    customer_id: '',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{ product_name: '', quantity: 1, unit_price: 0, special_notes: '', is_gift: false }],
    shipping_type: 'none', // 'none', 'paid', 'free'
    shipping_fee: 0
  });

  // 運費設定狀態
  const [shippingFee, setShippingFee] = useState(120);

  // 新增客戶表單狀態
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    family_mart_address: '',
    source: '直接來店訂購',
    payment_method: '貨到付款',
    order_number: ''
  });


  // 訂單歷史查詢狀態
  const [orderHistory, setOrderHistory] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({
    customer_id: '',
    start_date: '',
    end_date: '',
    order_type: '' // 新增訂單類型篩選
  });

  // 訂單歷史客戶搜尋狀態
  const [historyCustomerSearchTerm, setHistoryCustomerSearchTerm] = useState('');
  const [filteredHistoryCustomers, setFilteredHistoryCustomers] = useState([]);

  // 出貨管理狀態
  const [shippingOrders, setShippingOrders] = useState([]);
  const [shippingDate, setShippingDate] = useState(new Date().toISOString().split('T')[0]);
  const [weeklyShippingData, setWeeklyShippingData] = useState([]);
  const [showWeeklyOverview, setShowWeeklyOverview] = useState(false);

  // 客戶搜尋狀態
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSourceFilter, setCustomerSourceFilter] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // 庫存管理狀態
  const [inventoryData, setInventoryData] = useState([]);
  const [inventoryTransactions, setInventoryTransactions] = useState([]);
  const [inventoryForm, setInventoryForm] = useState({
    product_id: '',
    transaction_type: 'in',
    quantity: '',
    notes: ''
  });

  // 編輯客戶狀態
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editCustomerForm, setEditCustomerForm] = useState({
    name: '',
    phone: '',
    address: '',
    family_mart_address: '',
    source: '直接來店訂購',
    payment_method: '貨到付款',
    order_number: ''
  });

  // 編輯訂單狀態
  const [editingOrder, setEditingOrder] = useState(null);
  const [editOrderForm, setEditOrderForm] = useState({
    customer_id: '',
    order_date: '',
    delivery_date: '',
    notes: '',
    items: [{ product_name: '', quantity: 1, unit_price: 0, special_notes: '', status: 'pending', is_gift: false }],
    shipping_type: 'none',
    shipping_fee: 0
  });

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    fetchShippingFee();
    fetchInventoryData();
    fetchInventoryTransactions();
  }, []);

  const fetchShippingFee = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/shipping-fee`);
      setShippingFee(response.data.shippingFee);
    } catch (err) {
      console.error('載入運費設定失敗:', err);
    }
  };


  // 出貨管理相關函數
  const fetchShippingOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      console.log('正在查詢出貨訂單，日期:', shippingDate);
      // 查詢指定配送日期的訂單，而不是訂單日期
      const response = await axios.get(`${config.apiUrl}/api/orders/delivery/${shippingDate}`);
      console.log('出貨訂單查詢結果:', response.data);
      setShippingOrders(response.data.orders || []);
      setSuccess(`已載入 ${response.data.orders?.length || 0} 筆出貨訂單`);
    } catch (err) {
      console.error('載入出貨訂單錯誤:', err);
      setError('載入出貨訂單失敗: ' + (err.response?.data?.error || err.message));
      setShippingOrders([]);
    } finally {
      setLoading(false);
    }
  }, [shippingDate]);

  const handleUpdateShippingStatus = async (orderId, status) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(`${config.apiUrl}/api/orders/${orderId}/shipping-status`, { status });
      setSuccess(`訂單狀態已更新為：${status === 'completed' ? '已出貨' : '待出貨'}`);
      // 重新載入出貨訂單和週出貨概覽
      await fetchShippingOrders();
      if (showWeeklyOverview) {
        await fetchWeeklyShippingData();
      }
    } catch (err) {
      setError('更新出貨狀態失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 週出貨概覽相關函數
  const fetchWeeklyShippingData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      console.log('正在查詢週出貨概覽，開始日期:', shippingDate);
      const response = await axios.get(`${config.apiUrl}/api/orders/shipping-weekly/${shippingDate}`);
      console.log('週出貨概覽查詢結果:', response.data);
      setWeeklyShippingData(response.data.weekly_data || []);
      setSuccess(`已載入週出貨概覽數據`);
    } catch (err) {
      console.error('載入週出貨概覽錯誤:', err);
      setError('載入週出貨概覽失敗: ' + (err.response?.data?.error || err.message));
      setWeeklyShippingData([]);
    } finally {
      setLoading(false);
    }
  }, [shippingDate]);

  // 當切換到出貨管理頁面時，載入出貨訂單和週概覽
  useEffect(() => {
    if (activeTab === 'shipping-management') {
      fetchShippingOrders();
      fetchWeeklyShippingData();
    }
  }, [activeTab, shippingDate, fetchShippingOrders, fetchWeeklyShippingData]);

  // 當切換到新增訂單頁面時，重新載入客戶列表和產品列表
  useEffect(() => {
    if (activeTab === 'new-order') {
      fetchCustomers();
      fetchProducts();
    }
  }, [activeTab]);

  const fetchCustomers = async () => {
    try {
      // 使用真正的 API
      const response = await axios.get(`${config.apiUrl}/api/customers`);
      setCustomers(response.data);
      setFilteredCustomers(response.data);
      setFilteredHistoryCustomers(response.data);
    } catch (err) {
      setError('載入客戶列表失敗: ' + err.message);
      setCustomers([]);
      setFilteredCustomers([]);
      setFilteredHistoryCustomers([]);
    }
  };

  // 客戶搜尋功能
  const handleCustomerSearch = (searchTerm) => {
    setCustomerSearchTerm(searchTerm);
    filterCustomers(searchTerm, customerSourceFilter);
  };

  // 客戶來源篩選功能
  const handleSourceFilter = (source) => {
    setCustomerSourceFilter(source);
    filterCustomers(customerSearchTerm, source);
  };

  // 統一的客戶篩選邏輯
  const filterCustomers = (searchTerm, sourceFilter) => {
    let filtered = customers;

    // 按搜尋關鍵字篩選
    if (searchTerm.trim()) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 按來源篩選
    if (sourceFilter) {
      filtered = filtered.filter(customer => customer.source === sourceFilter);
    }

    setFilteredCustomers(filtered);
  };

  // 訂單歷史客戶搜尋功能
  const handleHistoryCustomerSearch = (searchTerm) => {
    setHistoryCustomerSearchTerm(searchTerm);
    filterHistoryCustomers(searchTerm);
  };

  // 訂單歷史客戶篩選邏輯
  const filterHistoryCustomers = (searchTerm) => {
    let filtered = customers;

    // 按搜尋關鍵字篩選
    if (searchTerm.trim()) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone && customer.phone.includes(searchTerm)) ||
        (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    console.log('搜尋關鍵字:', searchTerm);
    console.log('篩選前客戶數量:', customers.length);
    console.log('篩選後客戶數量:', filtered.length);
    console.log('篩選結果:', filtered.map(c => `${c.name} (ID: ${c.id})`));

    setFilteredHistoryCustomers(filtered);

    // 如果當前選中的客戶不在新的搜尋結果中，清除選擇
    if (historyFilters.customer_id) {
      const selectedCustomerExists = filtered.some(customer => customer.id === parseInt(historyFilters.customer_id));
      if (!selectedCustomerExists) {
        console.log('清除選擇的客戶ID:', historyFilters.customer_id);
        setHistoryFilters({ ...historyFilters, customer_id: '' });
      }
    }
  };

  const fetchProducts = async () => {
    try {
      // 使用真正的 API
      const response = await axios.get(`${config.apiUrl}/api/products`);
      setProducts(response.data);
    } catch (err) {
      setError('載入產品列表失敗: ' + err.message);
      setProducts([]);
    }
  };

  // 庫存管理相關函數
  const fetchInventoryData = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/inventory`);
      setInventoryData(response.data);
    } catch (err) {
      setError('載入庫存資料失敗: ' + err.message);
      setInventoryData([]);
    }
  };

  const fetchInventoryTransactions = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/inventory/transactions`);
      setInventoryTransactions(response.data);
    } catch (err) {
      setError('載入庫存異動記錄失敗: ' + err.message);
      setInventoryTransactions([]);
    }
  };

  const handleInventoryTransaction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!inventoryForm.product_id || !inventoryForm.quantity) {
        throw new Error('請選擇產品並輸入數量');
      }

      const quantity = parseInt(inventoryForm.quantity);
      if (quantity <= 0) {
        throw new Error('數量必須大於 0');
      }

      const transactionData = {
        ...inventoryForm,
        quantity: quantity,
        created_by: 'admin' // 管理員操作
      };

      await axios.post(`${config.apiUrl}/api/inventory/transaction`, transactionData);
      setSuccess('庫存異動記錄成功！');
      
      // 重置表單
      setInventoryForm({
        product_id: '',
        transaction_type: 'in',
        quantity: '',
        notes: ''
      });
      
      // 重新載入資料
      await fetchInventoryData();
      await fetchInventoryTransactions();
    } catch (err) {
      setError('庫存異動失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 刪除庫存異動記錄
  const handleDeleteInventoryTransaction = async (transactionId) => {
    if (!window.confirm('確定要刪除這筆庫存異動記錄嗎？此操作會反向調整庫存數量。')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await axios.delete(`${config.apiUrl}/api/inventory/transaction/${transactionId}`);
      setSuccess('庫存異動記錄已刪除！');
      
      // 重新載入資料
      await fetchInventoryData();
      await fetchInventoryTransactions();
    } catch (err) {
      setError('刪除庫存異動記錄失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 重置所有庫存異動記錄
  const handleResetInventoryTransactions = async () => {
    if (!window.confirm('確定要重置所有庫存異動記錄嗎？此操作會清空所有異動記錄，但不會改變當前的庫存數量。')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await axios.delete(`${config.apiUrl}/api/inventory/transactions/reset`);
      setSuccess('所有庫存異動記錄已重置！');
      
      // 重新載入資料
      await fetchInventoryData();
      await fetchInventoryTransactions();
    } catch (err) {
      setError('重置庫存異動記錄失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 開始編輯客戶
  const startEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setEditCustomerForm({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      family_mart_address: customer.family_mart_address || '',
      source: customer.source || '直接來店訂購',
      payment_method: customer.payment_method || '貨到付款',
      order_number: customer.order_number || ''
    });
  };

  // 取消編輯客戶
  const cancelEditCustomer = () => {
    setEditingCustomer(null);
    setEditCustomerForm({
      name: '',
      phone: '',
      address: '',
      family_mart_address: '',
      source: '直接來店訂購',
      payment_method: '貨到付款',
      order_number: ''
    });
  };

  // 更新客戶
  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!editCustomerForm.name.trim()) {
        throw new Error('請填寫客戶姓名');
      }

      // 使用真正的 API 更新客戶
      await axios.put(`${config.apiUrl}/api/customers/${editingCustomer.id}`, editCustomerForm);
      setSuccess('客戶更新成功！');
      
      // 重新載入客戶列表
      await fetchCustomers();
      
      // 取消編輯模式
      cancelEditCustomer();
    } catch (err) {
      setError('更新客戶失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 刪除客戶
  const handleDeleteCustomer = async (customerId, customerName) => {
    if (!window.confirm(`確定要刪除客戶「${customerName}」嗎？\n\n⚠️ 警告：此操作將同時刪除該客戶的所有訂單和相關資料，無法復原！`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 使用真正的 API 刪除客戶
      await axios.delete(`${config.apiUrl}/api/customers/${customerId}`);
      setSuccess('客戶刪除成功！');
      
      // 重新載入客戶列表
      await fetchCustomers();
    } catch (err) {
      setError('刪除客戶失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderHistory = async () => {
    setLoading(true);
    try {
      // 使用真正的 API 載入訂單歷史
      const params = new URLSearchParams();
      if (historyFilters.customer_id) params.append('customer_id', historyFilters.customer_id);
      if (historyFilters.start_date) params.append('start_date', historyFilters.start_date);
      if (historyFilters.end_date) params.append('end_date', historyFilters.end_date);
      if (historyFilters.order_type) params.append('order_type', historyFilters.order_type);
      
      const url = `${config.apiUrl}/api/orders/history?${params.toString()}`;
      const response = await axios.get(url);
      setOrderHistory(response.data);
    } catch (err) {
      console.error('載入訂單歷史錯誤:', err);
      setError('載入訂單歷史失敗: ' + err.message);
      setOrderHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // 移除自動載入，讓用戶主動查詢
  // useEffect(() => {
  //   if (activeTab === 'order-history') {
  //     fetchOrderHistory();
  //   }
  // }, [activeTab]);

  const handleAddOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 驗證表單
      if (!newOrder.customer_id) {
        throw new Error('請選擇客戶');
      }
      if (!newOrder.delivery_date) {
        throw new Error('請選擇交貨日期');
      }
      if (newOrder.items.some(item => !item.product_name || item.quantity <= 0)) {
        throw new Error('請填寫完整的產品資訊');
      }

      // 計算運費（只有免運費會影響我們的成本）
      let finalShippingFee = 0;
      if (newOrder.shipping_type === 'free') {
        finalShippingFee = -shippingFee; // 負數表示我們吸收運費成本
      }
      // 客戶付運費給快遞公司，不計入我們的收入

      // 準備訂單資料
      const orderData = {
        ...newOrder,
        shipping_fee: finalShippingFee
      };

      // 使用真正的 API 建立訂單
      await axios.post(`${config.apiUrl}/api/orders`, orderData);
      setSuccess('訂單建立成功！');
      
      // 重置表單
      setNewOrder({
        customer_id: '',
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [{ product_name: '', quantity: 1, unit_price: 0, special_notes: '' }],
        shipping_type: 'none',
        shipping_fee: 0
      });
    } catch (err) {
      setError('建立訂單失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!newCustomer.name.trim()) {
        throw new Error('請填寫客戶姓名');
      }

      // 使用真正的 API 新增客戶
      await axios.post(`${config.apiUrl}/api/customers`, newCustomer);
      setSuccess('客戶新增成功！');
      
      // 重置表單並重新載入客戶列表
      setNewCustomer({ 
        name: '', 
        phone: '', 
        address: '', 
        family_mart_address: '',
        source: '直接來店訂購', 
        payment_method: '貨到付款',
        order_number: ''
      });
      await fetchCustomers();
      
      // 自動切換到客戶管理頁面查看新增的客戶
      setTimeout(() => {
        setActiveTab('customers');
      }, 1000);
    } catch (err) {
      setError('新增客戶失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 編輯訂單相關函數
  const handleEditOrder = async (orderId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.apiUrl}/api/orders/${orderId}`);
      const order = response.data;
      
      setEditingOrder(orderId);
      setEditOrderForm({
        customer_id: order.customer_id,
        order_date: order.order_date,
        delivery_date: order.delivery_date,
        notes: order.notes || '',
        items: order.items.length > 0 ? order.items : [{ product_name: '', quantity: 1, unit_price: 0, special_notes: '', status: 'pending', is_gift: false }],
        shipping_type: order.shipping_type || 'none',
        shipping_fee: order.shipping_fee || 0
      });
      setActiveTab('edit-order');
    } catch (err) {
      setError('載入訂單失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 驗證表單
      if (!editOrderForm.customer_id) {
        throw new Error('請選擇客戶');
      }
      if (!editOrderForm.delivery_date) {
        throw new Error('請選擇交貨日期');
      }
      if (editOrderForm.items.some(item => !item.product_name || item.quantity <= 0)) {
        throw new Error('請填寫完整的產品資訊');
      }

      // 計算運費
      let finalShippingFee = 0;
      if (editOrderForm.shipping_type === 'free') {
        finalShippingFee = -shippingFee;
      }

      const orderData = {
        ...editOrderForm,
        shipping_fee: finalShippingFee
      };

      await axios.put(`${config.apiUrl}/api/orders/${editingOrder}`, orderData);
      setSuccess('訂單更新成功！');
      setEditingOrder(null);
      setEditOrderForm({
        customer_id: '',
        order_date: '',
        delivery_date: '',
        notes: '',
        items: [{ product_name: '', quantity: 1, unit_price: 0, special_notes: '', status: 'pending', is_gift: false }],
        shipping_type: 'none',
        shipping_fee: 0
      });
      setActiveTab('order-history');
      // 不自動載入，讓用戶主動查詢
    } catch (err) {
      setError('更新訂單失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 刪除訂單
  const handleDeleteOrder = async (orderId, customerName, orderDate) => {
    if (!window.confirm(`確定要刪除客戶「${customerName}」在「${orderDate}」的訂單嗎？\n\n⚠️ 警告：此操作將永久刪除該訂單及其所有項目，無法復原！`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.delete(`${config.apiUrl}/api/orders/${orderId}`);
      setSuccess('訂單刪除成功！');
      
      // 重新載入訂單歷史
      await fetchOrderHistory();
    } catch (err) {
      setError('刪除訂單失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const updateEditOrderItem = (index, field, value) => {
    const updatedItems = [...editOrderForm.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setEditOrderForm({ ...editOrderForm, items: updatedItems });
  };

  const addEditOrderItem = () => {
    setEditOrderForm({
      ...editOrderForm,
      items: [...editOrderForm.items, { product_name: '', quantity: 1, unit_price: 0, special_notes: '', status: 'pending', is_gift: false }]
    });
  };

  const removeEditOrderItem = (index) => {
    if (editOrderForm.items.length > 1) {
      const updatedItems = editOrderForm.items.filter((_, i) => i !== index);
      setEditOrderForm({ ...editOrderForm, items: updatedItems });
    }
  };

  const addOrderItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { product_name: '', quantity: 1, unit_price: 0, special_notes: '', is_gift: false }]
    });
  };

  const addGiftItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { product_name: '隨機口味', quantity: 1, unit_price: -30, special_notes: '', is_gift: true }]
    });
  };

  const removeOrderItem = (index) => {
    if (newOrder.items.length > 1) {
      setNewOrder({
        ...newOrder,
        items: newOrder.items.filter((_, i) => i !== index)
      });
    }
  };

  const updateOrderItem = (index, field, value) => {
    const updatedItems = [...newOrder.items];
    updatedItems[index][field] = value;
    setNewOrder({ ...newOrder, items: updatedItems });
  };

  // 計算訂單總金額（包含信用卡手續費）
  const calculateTotalAmount = () => {
    const itemsTotal = newOrder.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);
    
    let shippingAdjustment = 0;
    if (newOrder.shipping_type === 'free') {
      shippingAdjustment = -shippingFee; // 免運費對我們是成本
    }
    // 客戶付運費給快遞公司，不計入我們的收入
    
    // 計算信用卡手續費
    let creditCardFee = 0;
    if (newOrder.customer_id) {
      const selectedCustomer = customers.find(c => c.id === parseInt(newOrder.customer_id));
      if (selectedCustomer && selectedCustomer.payment_method === '信用卡') {
        // 計算付費產品總金額（排除贈品）
        const paidItemsTotal = newOrder.items
          .filter(item => !item.is_gift)
          .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        
        // 手續費 = 付費產品金額 × 2%
        creditCardFee = Math.round(paidItemsTotal * 0.02);
      }
    }
    
    return itemsTotal + shippingAdjustment - creditCardFee;
  };

  // 計算信用卡手續費
  const calculateCreditCardFee = () => {
    if (!newOrder.customer_id) return 0;
    
    const selectedCustomer = customers.find(c => c.id === parseInt(newOrder.customer_id));
    if (!selectedCustomer || selectedCustomer.payment_method !== '信用卡') return 0;
    
    // 計算付費產品總金額（排除贈品）
    const paidItemsTotal = newOrder.items
      .filter(item => !item.is_gift)
      .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    
    // 手續費 = 付費產品金額 × 2%
    return Math.round(paidItemsTotal * 0.02);
  };

  const renderNewOrderForm = () => (
    <div className="card">
      <h2>新增訂單</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <form onSubmit={handleAddOrder}>
        <div className="form-group">
          <label className="form-label">客戶</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              className="form-select"
              value={newOrder.customer_id}
              onChange={(e) => setNewOrder({ ...newOrder, customer_id: e.target.value })}
              required
              style={{ flex: 1 }}
            >
              <option value="">請選擇客戶 ({customers.length} 位客戶)</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone || '無電話'}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="button secondary"
              onClick={() => setActiveTab('customers')}
              style={{ padding: '12px 16px', fontSize: '14px' }}
            >
              查看客戶列表
            </button>
          </div>
          {newOrder.customer_id && (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px 12px', 
              background: '#e8f4fd', 
              borderRadius: '6px',
              fontSize: '14px',
              color: '#2c3e50'
            }}>
              已選擇客戶: {customers.find(c => c.id === parseInt(newOrder.customer_id))?.name}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">訂單日期</label>
            <input
              type="date"
              className="form-input"
              value={newOrder.order_date}
              onChange={(e) => setNewOrder({ ...newOrder, order_date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">交貨日期</label>
            <input
              type="date"
              className="form-input"
              value={newOrder.delivery_date}
              onChange={(e) => setNewOrder({ ...newOrder, delivery_date: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">訂單項目</label>
          
          {/* 表頭 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 80px 100px 1fr 120px 80px',
            gap: '10px',
            marginBottom: '10px',
            padding: '10px',
            background: '#e9ecef',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#495057'
          }}>
            <div>產品</div>
            <div style={{ textAlign: 'center' }}>數量</div>
            <div style={{ textAlign: 'center' }}>單價</div>
            <div>特殊要求</div>
            <div style={{ textAlign: 'center' }}>小計</div>
            <div style={{ textAlign: 'center' }}>操作</div>
          </div>

          {newOrder.items.map((item, index) => (
            <div key={index} className="item-row" style={{
              backgroundColor: item.is_gift ? '#fff3cd' : '#f8f9fa',
              border: item.is_gift ? '2px solid #ffc107' : '1px solid #e9ecef'
            }}>
              {item.is_gift && (
                <div style={{
                  gridColumn: '1 / -1',
                  color: '#856404',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  🎁 贈送項目
                </div>
              )}
              <select
                className="form-select"
                value={item.product_name}
                onChange={(e) => {
                  const selectedProduct = products.find(p => p.name === e.target.value);
                  updateOrderItem(index, 'product_name', e.target.value);
                  // 如果是贈送項目，保持價格為 -30，不要自動更新為產品價格
                  if (selectedProduct && !item.is_gift) {
                    updateOrderItem(index, 'unit_price', selectedProduct.price);
                  }
                }}
                required
              >
                <option value="">請選擇產品</option>
                {products.map(product => (
                  <option key={product.id} value={product.name}>
                    {product.name} - NT$ {product.price}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="form-input"
                value={item.quantity}
                onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                min="1"
                required
              />
              <input
                type="number"
                className="form-input"
                value={item.unit_price}
                onChange={(e) => updateOrderItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                min={item.is_gift ? undefined : "0"}
                step="0.01"
                placeholder="單價"
                required
              />
              <input
                type="text"
                className="form-input"
                placeholder="特殊要求"
                value={item.special_notes}
                onChange={(e) => updateOrderItem(index, 'special_notes', e.target.value)}
              />
              <div className="subtotal-display">
                小計: NT$ {(item.quantity * item.unit_price).toLocaleString()}
              </div>
              {newOrder.items.length > 1 && (
                <button
                  type="button"
                  className="remove-button"
                  onClick={() => removeOrderItem(index)}
                >
                  移除
                </button>
              )}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            type="button"
            className="add-item-button"
            onClick={addOrderItem}
          >
            + 新增產品
          </button>
            <button
              type="button"
              onClick={addGiftItem}
              style={{
                backgroundColor: '#e67e22',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 20px',
                cursor: 'pointer'
              }}
            >
              🎁 贈送1瓶
            </button>
          </div>
          
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            background: '#e8f4fd', 
            borderRadius: '8px',
            textAlign: 'right'
          }}>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#e74c3c' 
            }}>
              訂單總計: NT$ {newOrder.items.reduce((total, item) => total + (item.quantity * item.unit_price), 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">備註</label>
          <textarea
            className="form-textarea"
            value={newOrder.notes}
            onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
            placeholder="訂單備註..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">運費選項</label>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="shipping_type"
                value="none"
                checked={newOrder.shipping_type === 'none'}
                onChange={(e) => setNewOrder({ ...newOrder, shipping_type: e.target.value })}
              />
              <span>無運費</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="shipping_type"
                value="paid"
                checked={newOrder.shipping_type === 'paid'}
                onChange={(e) => setNewOrder({ ...newOrder, shipping_type: e.target.value })}
              />
              <span>客戶付運費 NT$ {shippingFee} (給快遞公司)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="shipping_type"
                value="free"
                checked={newOrder.shipping_type === 'free'}
                onChange={(e) => setNewOrder({ ...newOrder, shipping_type: e.target.value })}
              />
              <span>免運費 (扣 NT$ {shippingFee})</span>
            </label>
          </div>
        </div>

        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          background: '#e8f4fd', 
          borderRadius: '8px',
          textAlign: 'right'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#e74c3c' 
          }}>
            最終總計: NT$ {calculateTotalAmount().toLocaleString()}
          </div>
          
          {/* 顯示明細 */}
            <div style={{ 
              fontSize: '14px', 
              color: '#7f8c8d',
            marginTop: '5px',
            lineHeight: '1.4'
          }}>
            <div>產品總計: NT$ {newOrder.items.reduce((total, item) => total + (item.quantity * item.unit_price), 0).toLocaleString()}</div>
            
            {/* 信用卡手續費 */}
            {calculateCreditCardFee() > 0 && (
              <div style={{ color: '#e67e22', fontWeight: 'bold' }}>
                💳 信用卡手續費扣除 (2%): NT$ {calculateCreditCardFee().toLocaleString()}
              </div>
            )}
            
            {/* 運費說明 */}
            {newOrder.shipping_type !== 'none' && (
              <div>
              {newOrder.shipping_type === 'paid' ? 
                  `運費: NT$ ${shippingFee} (客戶另付給快遞公司)` :
                  `免運費成本: NT$ ${shippingFee}`
              }
            </div>
          )}
          </div>
        </div>

        <button type="submit" className="button success" disabled={loading}>
          {loading ? '建立中...' : '建立訂單'}
        </button>
      </form>
    </div>
  );

  const renderNewCustomerForm = () => (
    <div className="card">
      <h2>新增客戶</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <form onSubmit={handleAddCustomer}>
        <div className="form-group">
          <label className="form-label">客戶姓名</label>
          <input
            type="text"
            className="form-input"
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            placeholder="請輸入客戶姓名"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">聯絡電話</label>
          <input
            type="tel"
            className="form-input"
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            placeholder="請輸入聯絡電話"
          />
        </div>

        <div className="form-group">
          <label className="form-label">送貨地點</label>
          <textarea
            className="form-textarea"
            value={newCustomer.address}
            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
            placeholder="請輸入送貨地點"
          />
        </div>

        <div className="form-group">
          <label className="form-label">全家店名</label>
          <input
            type="text"
            className="form-input"
            value={newCustomer.family_mart_address}
            onChange={(e) => setNewCustomer({ ...newCustomer, family_mart_address: e.target.value })}
            placeholder="請輸入全家店名"
          />
        </div>

        <div className="form-group">
          <label className="form-label">客戶來源</label>
          <select
            className="form-select"
            value={newCustomer.source}
            onChange={(e) => setNewCustomer({ ...newCustomer, source: e.target.value })}
            required
          >
            <option value="直接來店訂購">直接來店訂購</option>
            <option value="FB訂購">FB訂購</option>
            <option value="IG訂購">IG訂購</option>
            <option value="蝦皮訂購">蝦皮訂購</option>
            <option value="全家好賣訂購">全家好賣訂購</option>
            <option value="7-11賣貨便訂購">7-11賣貨便訂購</option>
            <option value="其他訂購">其他訂購</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">付款方式</label>
          <select
            className="form-select"
            value={newCustomer.payment_method}
            onChange={(e) => setNewCustomer({ ...newCustomer, payment_method: e.target.value })}
            required
          >
            <option value="貨到付款">貨到付款</option>
            <option value="信用卡">信用卡</option>
            <option value="LinePay">LinePay</option>
            <option value="現金">現金</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">訂單編號</label>
          <input
            type="text"
            className="form-input"
            value={newCustomer.order_number}
            onChange={(e) => setNewCustomer({ ...newCustomer, order_number: e.target.value })}
            placeholder="請輸入訂單編號（可選）"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="button success" disabled={loading}>
            {loading ? '新增中...' : '新增客戶'}
          </button>
          <button 
            type="button" 
            className="button secondary"
            onClick={() => setActiveTab('customers')}
          >
            查看客戶列表
          </button>
        </div>
      </form>
    </div>
  );

  const renderEditOrderForm = () => (
    <div className="card">
      <h2>編輯訂單 #{editingOrder}</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <form onSubmit={handleUpdateOrder}>
        <div className="form-group">
          <label className="form-label">客戶</label>
          <select
            className="form-select"
            value={editOrderForm.customer_id}
            onChange={(e) => setEditOrderForm({ ...editOrderForm, customer_id: e.target.value })}
            required
          >
            <option value="">請選擇客戶</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.phone}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">訂單日期</label>
            <input
              type="date"
              className="form-input"
              value={editOrderForm.order_date}
              onChange={(e) => setEditOrderForm({ ...editOrderForm, order_date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">交貨日期</label>
            <input
              type="date"
              className="form-input"
              value={editOrderForm.delivery_date}
              onChange={(e) => setEditOrderForm({ ...editOrderForm, delivery_date: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">運費設定</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              className="form-select"
              value={editOrderForm.shipping_type}
              onChange={(e) => setEditOrderForm({ ...editOrderForm, shipping_type: e.target.value })}
            >
              <option value="none">無運費</option>
              <option value="paid">客戶付運費</option>
              <option value="free">免運費</option>
            </select>
            {editOrderForm.shipping_type === 'free' && (
              <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                我們將吸收 NT$ {shippingFee} 運費成本
              </span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">訂單項目</label>
          {editOrderForm.items.map((item, index) => (
            <div key={index} className="item-row" style={{
              backgroundColor: item.is_gift ? '#fff3cd' : 'transparent',
              border: item.is_gift ? '2px solid #ffc107' : 'none',
              borderRadius: item.is_gift ? '8px' : '0',
              padding: item.is_gift ? '10px' : '0',
              marginBottom: item.is_gift ? '10px' : '0'
            }}>
              {item.is_gift && (
                <div style={{
                  color: '#856404',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  fontSize: '14px'
                }}>
                  🎁 贈送項目
                </div>
              )}
              <select
                className="form-input"
                value={item.product_name}
                onChange={(e) => {
                  const selectedProduct = products.find(p => p.name === e.target.value);
                  updateEditOrderItem(index, 'product_name', e.target.value);
                  // 如果是贈送項目，保持價格為 -30，不要自動更新為產品價格
                  if (selectedProduct && !item.is_gift) {
                    updateEditOrderItem(index, 'unit_price', selectedProduct.price);
                  }
                }}
                required
              >
                <option value="">請選擇產品</option>
                {products.map(product => (
                  <option key={product.id} value={product.name}>
                    {product.name} - NT$ {product.price}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="form-input"
                value={item.quantity}
                onChange={(e) => updateEditOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                min="1"
                required
              />
              <input
                type="number"
                className="form-input"
                value={item.unit_price}
                onChange={(e) => updateEditOrderItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                min={item.is_gift ? undefined : "0"}
                step="0.01"
                placeholder="單價"
                required
              />
              <input
                type="text"
                className="form-input"
                placeholder="特殊要求"
                value={item.special_notes}
                onChange={(e) => updateEditOrderItem(index, 'special_notes', e.target.value)}
              />
              <select
                className="form-input"
                value={item.status}
                onChange={(e) => updateEditOrderItem(index, 'status', e.target.value)}
              >
                <option value="pending">待製作</option>
                <option value="completed">已完成</option>
              </select>
              <div style={{ 
                display: 'flex',
                gap: '5px',
                alignItems: 'center'
              }}>
                <button
                  type="button"
                  onClick={() => removeEditOrderItem(index)}
                  disabled={editOrderForm.items.length === 1}
                  style={{
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    cursor: editOrderForm.items.length === 1 ? 'not-allowed' : 'pointer',
                    opacity: editOrderForm.items.length === 1 ? 0.5 : 1
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={addEditOrderItem}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 20px',
                cursor: 'pointer'
              }}
            >
              + 新增項目
            </button>
            <button
              type="button"
              onClick={() => {
                setEditOrderForm({
                  ...editOrderForm,
                  items: [...editOrderForm.items, { product_name: '隨機口味', quantity: 1, unit_price: -30, special_notes: '', status: 'pending', is_gift: true }]
                });
              }}
              style={{
                backgroundColor: '#e67e22',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 20px',
                cursor: 'pointer'
              }}
            >
              🎁 贈送1瓶
            </button>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">備註</label>
          <textarea
            className="form-textarea"
            value={editOrderForm.notes}
            onChange={(e) => setEditOrderForm({ ...editOrderForm, notes: e.target.value })}
            placeholder="訂單備註..."
            rows="3"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="button success" disabled={loading}>
            {loading ? '更新中...' : '更新訂單'}
          </button>
          <button 
            type="button" 
            className="button secondary"
            onClick={() => {
              setEditingOrder(null);
              setActiveTab('order-history');
            }}
          >
            取消編輯
          </button>
        </div>
      </form>
    </div>
  );

  const renderCustomerManagement = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>客戶管理</h2>
        <button 
          className="button success"
          onClick={() => setActiveTab('new-customer')}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px',
            backgroundColor: '#e74c3c',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          ➕ 新增客戶
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      {/* 編輯客戶表單 */}
      {editingCustomer && (
        <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
          <h3>編輯客戶：{editingCustomer.name}</h3>
          <form onSubmit={handleUpdateCustomer}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">客戶姓名</label>
                <input
                  type="text"
                  className="form-input"
                  value={editCustomerForm.name}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, name: e.target.value })}
                  placeholder="請輸入客戶姓名"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">聯絡電話</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editCustomerForm.phone}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })}
                  placeholder="請輸入聯絡電話"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">送貨地點</label>
              <textarea
                className="form-textarea"
                value={editCustomerForm.address}
                onChange={(e) => setEditCustomerForm({ ...editCustomerForm, address: e.target.value })}
                placeholder="請輸入送貨地點"
              />
            </div>
            <div className="form-group">
              <label className="form-label">全家店名</label>
              <input
                type="text"
                className="form-input"
                value={editCustomerForm.family_mart_address}
                onChange={(e) => setEditCustomerForm({ ...editCustomerForm, family_mart_address: e.target.value })}
                placeholder="請輸入全家店名"
              />
            </div>
            <div className="form-group">
              <label className="form-label">客戶來源</label>
              <select
                className="form-select"
                value={editCustomerForm.source}
                onChange={(e) => setEditCustomerForm({ ...editCustomerForm, source: e.target.value })}
                required
              >
                <option value="直接來店訂購">直接來店訂購</option>
                <option value="FB訂購">FB訂購</option>
                <option value="IG訂購">IG訂購</option>
                <option value="蝦皮訂購">蝦皮訂購</option>
                <option value="全家好賣訂購">全家好賣訂購</option>
                <option value="7-11賣貨便訂購">7-11賣貨便訂購</option>
                <option value="其他訂購">其他訂購</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">付款方式</label>
              <select
                className="form-select"
                value={editCustomerForm.payment_method}
                onChange={(e) => setEditCustomerForm({ ...editCustomerForm, payment_method: e.target.value })}
                required
              >
                <option value="貨到付款">貨到付款</option>
                <option value="信用卡">信用卡</option>
                <option value="LinePay">LinePay</option>
                <option value="現金">現金</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">訂單編號</label>
              <input
                type="text"
                className="form-input"
                value={editCustomerForm.order_number}
                onChange={(e) => setEditCustomerForm({ ...editCustomerForm, order_number: e.target.value })}
                placeholder="請輸入訂單編號（可選）"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="button success" disabled={loading}>
                {loading ? '更新中...' : '更新客戶'}
              </button>
              <button 
                type="button" 
                className="button secondary"
                onClick={cancelEditCustomer}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* 客戶搜尋和篩選 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '10px' }}>
          <div className="form-group">
            <label className="form-label">搜尋客戶</label>
            <input
              type="text"
              className="form-input"
              placeholder="輸入客戶姓名、電話或地址關鍵字..."
              value={customerSearchTerm}
              onChange={(e) => handleCustomerSearch(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">客戶來源</label>
            <select
              className="form-select"
              value={customerSourceFilter}
              onChange={(e) => handleSourceFilter(e.target.value)}
            >
              <option value="">全部來源</option>
              <option value="直接來店訂購">直接來店訂購</option>
              <option value="FB訂購">FB訂購</option>
              <option value="IG訂購">IG訂購</option>
              <option value="蝦皮訂購">蝦皮訂購</option>
              <option value="全家好賣訂購">全家好賣訂購</option>
              <option value="7-11賣貨便訂購">7-11賣貨便訂購</option>
              <option value="其他訂購">其他訂購</option>
            </select>
          </div>
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          找到 {filteredCustomers.length} 位客戶
          {customerSourceFilter && ` (來源: ${customerSourceFilter})`}
        </div>
      </div>
      
      {loading ? (
        <div className="loading">載入中...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            background: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>訂單編號</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>客戶姓名</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>聯絡電話</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>送貨地點</th>
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>來源</th>
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>付款方式</th>
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '15px', textAlign: 'center', color: '#666', fontSize: '14px', fontWeight: '500' }}>
                    {customer.order_number || '-'}
                  </td>
                  <td style={{ padding: '15px', fontWeight: '500' }}>{customer.name}</td>
                  <td style={{ padding: '15px' }}>{customer.phone || '-'}</td>
                  <td style={{ padding: '15px', color: '#666' }}>{customer.address || '-'}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: customer.source?.includes('蝦皮') ? '#ff6b35' : 
                                     customer.source?.includes('IG') ? '#e1306c' :
                                     customer.source?.includes('FB') ? '#1877f2' :
                                     customer.source?.includes('全家') ? '#00a651' :
                                     customer.source?.includes('7-11') ? '#ff6600' : '#27ae60',
                      color: 'white'
                    }}>
                      {customer.source || '直接來店訂購'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: customer.payment_method === '信用卡' ? '#3498db' : 
                                     customer.payment_method === 'LinePay' ? '#00c300' :
                                     customer.payment_method === '現金' ? '#95a5a6' : '#e74c3c',
                      color: 'white'
                    }}>
                      {customer.payment_method || '貨到付款'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="button"
                        onClick={() => {
                          setNewOrder({
                            ...newOrder,
                            customer_id: customer.id
                          });
                          setActiveTab('new-order');
                        }}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        下單
                      </button>
                      <button
                        className="button secondary"
                        onClick={() => startEditCustomer(customer)}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        編輯
                      </button>
                      <button
                        className="button danger"
                        onClick={() => handleDeleteCustomer(customer.id, customer.name)}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredCustomers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              {customerSearchTerm ? '找不到符合條件的客戶' : '尚無客戶資料'}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const exportToCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (historyFilters.customer_id) params.append('customer_id', historyFilters.customer_id);
      if (historyFilters.start_date) params.append('start_date', historyFilters.start_date);
      if (historyFilters.end_date) params.append('end_date', historyFilters.end_date);
      
      const response = await fetch(`${config.apiUrl}/api/orders/history/export/csv?${params}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `訂單歷史_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('匯出失敗，請稍後再試');
      }
    } catch (error) {
      console.error('匯出錯誤:', error);
      alert('匯出失敗，請稍後再試');
    }
  };

  const renderOrderHistory = () => (
    <div className="card">
      <h2>訂單歷史查詢</h2>
      
      {/* 客戶搜尋區域 */}
      <div style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label className="form-label">搜尋客戶</label>
          <input
            type="text"
            className="form-input"
            placeholder="輸入客戶姓名、電話或地址關鍵字..."
            value={historyCustomerSearchTerm}
            onChange={(e) => handleHistoryCustomerSearch(e.target.value)}
          />
        </div>
        {filteredHistoryCustomers.length > 0 && (
          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            找到 {filteredHistoryCustomers.length} 位客戶
          </div>
        )}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div className="form-group">
          <label className="form-label">選擇客戶</label>
          <select
            className="form-select"
            value={historyFilters.customer_id}
            onChange={(e) => setHistoryFilters({ ...historyFilters, customer_id: e.target.value })}
          >
            <option value="">全部客戶</option>
            {filteredHistoryCustomers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.phone})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">訂單類型</label>
          <select
            className="form-select"
            value={historyFilters.order_type}
            onChange={(e) => setHistoryFilters({ ...historyFilters, order_type: e.target.value })}
          >
            <option value="">全部訂單</option>
            <option value="online">網路訂單</option>
            <option value="walk-in">現場銷售</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">開始日期</label>
          <input
            type="date"
            className="form-input"
            value={historyFilters.start_date}
            onChange={(e) => setHistoryFilters({ ...historyFilters, start_date: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">結束日期</label>
          <input
            type="date"
            className="form-input"
            value={historyFilters.end_date}
            onChange={(e) => setHistoryFilters({ ...historyFilters, end_date: e.target.value })}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
      <button 
        className="button" 
        onClick={fetchOrderHistory}
        disabled={loading}
      >
        {loading ? '查詢中...' : '🔍 查詢訂單'}
      </button>

      <button 
        className="button" 
        onClick={() => {
          setHistoryFilters({
            customer_id: '',
            start_date: '',
            end_date: '',
            order_type: ''
          });
          setHistoryCustomerSearchTerm('');
          setFilteredHistoryCustomers(customers);
          setOrderHistory([]);
        }}
        style={{ backgroundColor: '#95a5a6', color: 'white' }}
      >
        🗑️ 清除篩選
      </button>

      {orderHistory.length > 0 && (
          <button 
            className="button" 
            onClick={exportToCSV}
            style={{ backgroundColor: '#27ae60', color: 'white' }}
          >
            📊 匯出 CSV
          </button>
        )}
      </div>

      {/* 顯示當前篩選條件 */}
      {(historyCustomerSearchTerm || historyFilters.customer_id || historyFilters.start_date || historyFilters.end_date || historyFilters.order_type) && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <strong>當前篩選條件：</strong>
          {historyCustomerSearchTerm && (
            <span style={{ marginLeft: '10px', color: '#6f42c1' }}>
              搜尋："{historyCustomerSearchTerm}"
            </span>
          )}
          {historyFilters.customer_id && (
            <span style={{ marginLeft: '10px', color: '#007bff' }}>
              客戶：{customers.find(c => c.id === parseInt(historyFilters.customer_id))?.name || '未知客戶'}
            </span>
          )}
          {historyFilters.start_date && (
            <span style={{ marginLeft: '10px', color: '#28a745' }}>
              開始日期：{historyFilters.start_date}
            </span>
          )}
          {historyFilters.end_date && (
            <span style={{ marginLeft: '10px', color: '#dc3545' }}>
              結束日期：{historyFilters.end_date}
            </span>
          )}
          {historyFilters.order_type && (
            <span style={{ marginLeft: '10px', color: '#6f42c1' }}>
              訂單類型：{historyFilters.order_type === 'online' ? '網路訂單' : '現場銷售'}
            </span>
          )}
        </div>
      )}

      {orderHistory.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            fontSize: '14px',
            backgroundColor: 'white',
              borderRadius: '8px', 
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' }}>客戶名稱</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' }}>訂單日期</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' }}>出貨日期</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' }}>訂購產品</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>數量</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>單價</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>小計</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>狀態</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' }}>備註</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {orderHistory.map((order, orderIndex) => {
                const items = order.items && order.items.length > 0 ? order.items : [];
                const hasFreeShipping = order.shipping_type === 'free' && order.shipping_fee < 0;
                
                return (
                  <React.Fragment key={order.id}>
                    {/* 產品項目 */}
                    {items.map((item, itemIndex) => (
                      <tr key={`${order.id}-item-${itemIndex}`} style={{ 
                        backgroundColor: orderIndex % 2 === 0 ? 'white' : '#f8f9fa' 
                      }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.customer_name}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.order_date).toLocaleDateString('zh-TW')}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.delivery_date).toLocaleDateString('zh-TW')}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {item.is_gift ? (
                            <span style={{ color: '#e67e22', fontWeight: 'bold' }}>
                              🎁 {item.product_name} (贈送)
                            </span>
                          ) : (
                            item.product_name
                          )}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                          ${item.unit_price}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>
                          ${item.quantity * item.unit_price}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                            background: order.status === 'shipped' ? '#27ae60' : '#f39c12',
                  color: 'white',
                  fontSize: '12px'
                }}>
                            {order.status === 'shipped' ? '已出貨' : '待出貨'}
                </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.order_type === 'walk-in' 
                            ? `付款方式: ${order.notes?.includes('cash') ? 'cash' : 'card'}`
                            : (item.special_notes || order.notes)
                          }
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          {itemIndex === 0 ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleEditOrder(order.id)}
                                style={{
                                  backgroundColor: '#f39c12',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                ✏️ 編輯
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order.id, order.customer_name, order.order_date)}
                                style={{
                                  backgroundColor: '#e74c3c',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                🗑️ 刪除
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                    
                    {/* 免運費項目 */}
                    {hasFreeShipping ? (
                      <tr key={`${order.id}-freeshipping`} style={{ 
                        backgroundColor: '#fff3cd',
                        border: '2px solid #ffc107'
                      }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.customer_name}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.order_date).toLocaleDateString('zh-TW')}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.delivery_date).toLocaleDateString('zh-TW')}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', color: '#e74c3c' }}>
                          🚚 免運費
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          1
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                          ${Math.abs(order.shipping_fee)}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold', color: '#e74c3c' }}>
                          -${Math.abs(order.shipping_fee)}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            background: order.status === 'shipped' ? '#27ae60' : '#f39c12',
                            color: 'white',
                            fontSize: '12px'
                          }}>
                            {order.status === 'shipped' ? '已出貨' : '待出貨'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          免運費優惠
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          {/* 免運費行不需要編輯按鈕 */}
                        </td>
                      </tr>
                    ) : null}
                    
                    {/* 信用卡手續費項目 */}
                    {order.credit_card_fee && order.credit_card_fee > 0 ? (
                      <tr key={`${order.id}-creditcardfee`} style={{ 
                        backgroundColor: '#fef5e7',
                        border: '2px solid #e67e22'
                      }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.customer_name}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.order_date).toLocaleDateString('zh-TW')}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.delivery_date).toLocaleDateString('zh-TW')}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', color: '#e67e22' }}>
                          💳 信用卡手續費
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          1
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                          ${order.credit_card_fee}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold', color: '#e67e22' }}>
                          -${order.credit_card_fee}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          <span style={{ 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            background: order.status === 'shipped' ? '#27ae60' : '#f39c12',
                            color: 'white',
                            fontSize: '12px'
                          }}>
                            {order.status === 'shipped' ? '已出貨' : '待出貨'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          信用卡手續費扣除
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          {/* 手續費行不需要編輯按鈕 */}
                        </td>
                      </tr>
                    ) : null}
                    
                    {/* 無產品的情況 - 已隱藏，避免顯示無意義的 "0" */}
                    {/* {items.length === 0 && !hasFreeShipping && (
                      <tr key={order.id} style={{ 
                        backgroundColor: orderIndex % 2 === 0 ? 'white' : '#f8f9fa' 
                      }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.customer_name}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.order_date).toLocaleDateString('zh-TW')}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.delivery_date).toLocaleDateString('zh-TW')}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', color: '#999' }}>
                          無產品
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          0
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                          $0
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                          $0
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  background: order.status === 'shipped' ? '#27ae60' : '#f39c12',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  {order.status === 'shipped' ? '已出貨' : '待出貨'}
                </span>
              </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.notes}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEditOrder(order.id)}
                              style={{
                                backgroundColor: '#f39c12',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✏️ 編輯
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id, order.customer_name, order.order_date)}
                              style={{
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              🗑️ 刪除
                            </button>
                          </div>
                        </td>
                      </tr>
                    )} */}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderShippingManagement = () => (
    <div className="card">
      <h2>{user?.role === 'kitchen' ? '🚚 廚房出貨訂單' : '🚚 出貨管理'}</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        💡 選擇配送日期來查看當天需要出貨的訂單。只有製作完成的訂單才能標記為已出貨。
      </p>
      
      {/* 日期選擇和視圖切換 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowWeeklyOverview(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: showWeeklyOverview ? '#95a5a6' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📅 單日出貨
          </button>
          <button
            onClick={() => setShowWeeklyOverview(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: showWeeklyOverview ? '#3498db' : '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📊 週出貨概覽
          </button>
        </div>
        
        {!showWeeklyOverview && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              選擇配送日期：
            </label>
            <input
              type="date"
              value={shippingDate}
              onChange={(e) => setShippingDate(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                width: '200px'
              }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              選擇日期後會自動載入該日期的出貨訂單
            </div>
          </div>
        )}
        
        {showWeeklyOverview && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              選擇週開始日期：
            </label>
            <input
              type="date"
              value={shippingDate}
              onChange={(e) => setShippingDate(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                width: '200px'
              }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              選擇日期後會自動載入該週的出貨概覽
            </div>
          </div>
        )}
      </div>

      {/* 週出貨概覽 */}
      {showWeeklyOverview && (
        <div style={{ marginBottom: '20px' }}>
          <h3>📊 未來一週出貨概覽</h3>
          {weeklyShippingData.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
              {weeklyShippingData.map((dayData, index) => {
                const date = new Date(dayData.date);
                const isToday = dayData.date === new Date().toISOString().split('T')[0];
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                
                return (
                  <div
                    key={dayData.date}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '15px',
                      backgroundColor: isToday ? '#e8f5e8' : isWeekend ? '#f8f9fa' : '#fff',
                      borderLeft: isToday ? '4px solid #27ae60' : isWeekend ? '4px solid #95a5a6' : '4px solid #3498db'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '10px', color: isToday ? '#27ae60' : '#333' }}>
                      {date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' })}
                      {isToday && ' (今天)'}
                    </div>
                    
                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      <div>📦 訂單數: <strong>{dayData.order_count}</strong></div>
                      <div>📋 項目數: <strong>{dayData.item_count}</strong></div>
                      <div>🔢 總數量: <strong>{dayData.total_quantity}</strong></div>
                      {user?.role === 'admin' && (
                        <div>💰 總金額: <strong>${dayData.total_amount}</strong></div>
                      )}
                      <div style={{ marginTop: '8px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#e74c3c', color: 'white', fontSize: '12px' }}>
                        待出貨: {dayData.pending_orders}
                      </div>
                      <div style={{ marginTop: '4px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#27ae60', color: 'white', fontSize: '12px' }}>
                        已出貨: {dayData.shipped_orders}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>📊 該週沒有出貨訂單</p>
            </div>
          )}
        </div>
      )}

      {/* 出貨訂單列表 */}
      {!showWeeklyOverview && shippingOrders.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>客戶資訊</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>產品明細</th>
                {user?.role === 'admin' && (
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>訂單金額</th>
                )}
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>製作狀態</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>出貨狀態</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {shippingOrders.map((order) => {
                // 檢查製作狀態
                const isProductionComplete = order.items && order.items.every(item => item.item_status === 'completed');
                const productionStatus = isProductionComplete ? '製作完成' : '製作中';
                
                return (
                  <tr key={order.id}>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {/* 訂單編號 - 第一欄 */}
                      {order.order_number && (
                        <div style={{ 
                          background: '#3498db', 
                          color: 'white', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          marginBottom: '6px',
                          display: 'inline-block'
                        }}>
                          📋 {order.order_number}
                        </div>
                      )}
                      
                      {/* 客戶姓名 - 第二欄 */}
                      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '16px' }}>{order.customer_name}</div>
                      
                      {/* 聯絡電話 - 第三欄 */}
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>📞 {order.phone}</div>
                      
                      {/* 送貨地點 - 第四欄 */}
                      {order.address && (
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>📍 {order.address}</div>
                      )}
                      
                      {/* 全家店名 - 第五欄 */}
                      {order.family_mart_address && (
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>🏪 {order.family_mart_address}</div>
                      )}
                      
                      {/* 來源 - 第六欄（彩色標籤顯示） */}
                      {order.source && (
                        <div style={{ marginBottom: '2px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: '500',
                            backgroundColor: order.source?.includes('蝦皮') ? '#ff6b35' : 
                                           order.source?.includes('IG') ? '#e1306c' :
                                           order.source?.includes('FB') ? '#1877f2' :
                                           order.source?.includes('全家') ? '#00a651' :
                                           order.source?.includes('7-11') ? '#ff6600' : '#27ae60',
                            color: 'white'
                          }}>
                            🛒 {order.source}
                          </span>
                        </div>
                      )}
                      
                      {/* 付款方式 - 第七欄（彩色標籤顯示） */}
                      {order.payment_method && (
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: '500',
                            backgroundColor: order.payment_method === '信用卡' ? '#3498db' : 
                                           order.payment_method === 'LinePay' ? '#00c300' :
                                           order.payment_method === '現金' ? '#95a5a6' : '#e74c3c',
                            color: 'white'
                          }}>
                            💳 {order.payment_method}
                          </span>
                        </div>
                      )}
                      
                      {order.order_notes && (
                        <div style={{ fontSize: '12px', color: '#e67e22', marginTop: '4px' }}>
                          📝 {order.order_notes}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {order.items && order.items.length > 0 ? (
                        <div>
                          {order.items.map((item, index) => (
                            <div key={index} style={{ 
                              marginBottom: '8px', 
                              padding: '8px', 
                              backgroundColor: '#f8f9fa', 
                              borderRadius: '4px',
                              border: item.is_gift ? '2px solid #f39c12' : '1px solid #dee2e6'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span style={{ fontWeight: 'bold' }}>
                                    {item.is_gift && '🎁 '}{item.product_name}
                                  </span>
                                  {item.special_notes && (
                                    <div style={{ fontSize: '11px', color: '#e67e22', marginTop: '2px' }}>
                                      💬 {item.special_notes}
                                    </div>
                                  )}
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '12px' }}>
                                  <div>數量: {item.quantity}</div>
                                  {user?.role === 'admin' && (
                                    <>
                                      <div>單價: ${item.unit_price}</div>
                                      <div style={{ fontWeight: 'bold', color: item.is_gift ? '#e67e22' : '#333' }}>
                                        小計: ${item.item_total}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: '#999', fontStyle: 'italic' }}>無產品</div>
                      )}
                    </td>
                    {user?.role === 'admin' && (
                      <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>${order.customer_total}</div>
                        {order.shipping_fee !== 0 && (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            運費: ${order.shipping_fee}
                          </div>
                        )}
                        {order.credit_card_fee && order.credit_card_fee > 0 && (
                          <div style={{ fontSize: '12px', color: '#e67e22', fontWeight: 'bold' }}>
                            💳 手續費扣除: ${order.credit_card_fee}
                          </div>
                        )}
                      </td>
                    )}
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        background: isProductionComplete ? '#27ae60' : '#f39c12',
                        color: 'white',
                        fontSize: '12px'
                      }}>
                        {productionStatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        background: order.status === 'shipped' ? '#27ae60' : '#e74c3c',
                        color: 'white',
                        fontSize: '12px'
                      }}>
                        {order.status === 'shipped' ? '已出貨' : '待出貨'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {order.status === 'shipped' ? (
                        <button
                          onClick={() => handleUpdateShippingStatus(order.id, 'pending')}
                          style={{
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          📦 標記待出貨
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateShippingStatus(order.id, 'completed')}
                          disabled={!isProductionComplete}
                          style={{
                            backgroundColor: isProductionComplete ? '#27ae60' : '#95a5a6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            cursor: isProductionComplete ? 'pointer' : 'not-allowed',
                            fontSize: '12px'
                          }}
                        >
                          🚚 標記已出貨
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>📦 該配送日期沒有訂單需要出貨</p>
        </div>
      )}
    </div>
  );

  const renderInventoryManagement = () => (
    <div className="card">
      <h2>📦 庫存管理</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        💡 管理產品庫存，記錄進貨和出貨操作。系統會自動記錄操作時間。
      </p>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* 庫存異動操作表單 */}
      <div className="card" style={{ marginBottom: '20px', background: '#f8f9fa' }}>
        <h3>庫存異動操作</h3>
        <form onSubmit={handleInventoryTransaction}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr 120px 1fr 150px', 
            gap: '15px', 
            marginBottom: '15px',
            alignItems: 'end'
          }}>
            <div className="form-group">
              <label className="form-label">選擇產品</label>
              <select
                className="form-select"
                value={inventoryForm.product_id}
                onChange={(e) => setInventoryForm({ ...inventoryForm, product_id: e.target.value })}
                required
                style={{ width: '100%' }}
              >
                <option value="">請選擇產品</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">異動類型</label>
              <select
                className="form-select"
                value={inventoryForm.transaction_type}
                onChange={(e) => setInventoryForm({ ...inventoryForm, transaction_type: e.target.value })}
                required
                style={{ width: '100%' }}
              >
                <option value="in">📥 進貨</option>
                <option value="out">📤 出貨</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">數量</label>
              <input
                type="number"
                className="form-input"
                value={inventoryForm.quantity}
                onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: e.target.value })}
                placeholder="請輸入數量"
                min="1"
                required
                style={{ width: '100%' }}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">備註</label>
              <input
                type="text"
                className="form-input"
                value={inventoryForm.notes}
                onChange={(e) => setInventoryForm({ ...inventoryForm, notes: e.target.value })}
                placeholder="可選備註"
                style={{ width: '100%' }}
              />
            </div>
            
            <div className="form-group">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: '#27ae60',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? '處理中...' : '確認異動'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 庫存狀態表格 */}
      <div style={{ marginBottom: '20px' }}>
        <h3>庫存狀態</h3>
        {loading ? (
          <div className="loading">載入中...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              background: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>產品名稱</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>目前庫存</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>最低庫存</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>庫存狀態</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>最後更新</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((product) => {
                  const isLowStock = product.current_stock <= product.min_stock;
                  return (
                    <tr key={product.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '15px', fontWeight: '500' }}>{product.name}</td>
                      <td style={{ 
                        padding: '15px', 
                        textAlign: 'center', 
                        fontWeight: 'bold',
                        color: isLowStock ? '#e74c3c' : '#27ae60'
                      }}>
                        {product.current_stock}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>{product.min_stock}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: isLowStock ? '#e74c3c' : '#27ae60',
                          color: 'white'
                        }}>
                          {isLowStock ? '⚠️ 庫存不足' : '✅ 庫存正常'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                        {new Date(product.updated_at).toLocaleString('zh-TW')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 庫存異動記錄 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>庫存異動記錄</h3>
          <button
            type="button"
            onClick={handleResetInventoryTransactions}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            disabled={loading}
          >
            🗑️ 重置所有記錄
          </button>
        </div>
        {loading ? (
          <div className="loading">載入中...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              background: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>產品名稱</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>異動類型</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>數量</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>備註</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>操作時間</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {inventoryTransactions.map((transaction) => (
                  <tr key={transaction.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{transaction.product_name}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: transaction.transaction_type === 'in' ? '#27ae60' : '#e74c3c',
                        color: 'white'
                      }}>
                        {transaction.transaction_type === 'in' ? '📥 進貨' : '📤 出貨'}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'center', 
                      fontWeight: 'bold',
                      color: transaction.transaction_type === 'in' ? '#27ae60' : '#e74c3c'
                    }}>
                      {transaction.transaction_type === 'in' ? '+' : '-'}{transaction.quantity}
                    </td>
                    <td style={{ padding: '12px', color: '#666' }}>{transaction.notes || '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                      {new Date(transaction.transaction_date).toLocaleString('zh-TW')}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteInventoryTransaction(transaction.id)}
                        style={{
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        disabled={loading}
                        title="刪除此筆記錄"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {inventoryTransactions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                尚無庫存異動記錄
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {user?.role === 'admin' && (
            <>
          <button 
            className={`nav-button ${activeTab === 'new-order' ? 'active' : ''}`}
            onClick={() => setActiveTab('new-order')}
            style={{ 
              backgroundColor: activeTab === 'new-order' ? '#27ae60' : '#2ecc71', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ 新增訂單
          </button>
          <button 
            className={`nav-button ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
            style={{ 
              backgroundColor: activeTab === 'customers' ? '#3498db' : '#5dade2', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ 客戶管理
          </button>
          <button 
            className={`nav-button ${activeTab === 'order-history' ? 'active' : ''}`}
            onClick={() => setActiveTab('order-history')}
            style={{ 
              backgroundColor: activeTab === 'order-history' ? '#9b59b6' : '#bb8fce', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📋 訂單歷史
          </button>
            </>
          )}
          <button 
            className={`nav-button ${activeTab === 'inventory-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory-management')}
            style={{ 
              backgroundColor: activeTab === 'inventory-management' ? '#8e44ad' : '#a569bd', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📦 庫存管理
          </button>
          <button 
            className={`nav-button ${activeTab === 'shipping-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipping-management')}
            style={{ 
              backgroundColor: activeTab === 'shipping-management' ? '#e67e22' : '#f39c12', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {user?.role === 'kitchen' ? '🚚 廚房出貨訂單' : '🚚 出貨管理'}
          </button>
          {editingOrder && (
            <button 
              className={`nav-button ${activeTab === 'edit-order' ? 'active' : ''}`}
              onClick={() => setActiveTab('edit-order')}
              style={{ 
                backgroundColor: activeTab === 'edit-order' ? '#e67e22' : '#f39c12', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ✏️ 編輯訂單
            </button>
          )}
        </div>
      </div>

      {activeTab === 'new-order' && renderNewOrderForm()}
      {activeTab === 'customers' && renderCustomerManagement()}
      {activeTab === 'new-customer' && renderNewCustomerForm()}
      {activeTab === 'order-history' && renderOrderHistory()}
      {activeTab === 'inventory-management' && renderInventoryManagement()}
      {activeTab === 'shipping-management' && renderShippingManagement()}
      {activeTab === 'edit-order' && renderEditOrderForm()}
    </div>
  );
};

export default AdminPanel;
