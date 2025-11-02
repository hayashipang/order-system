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

  // 參數測試狀態
  // 參數測試功能已移除

  // 新增訂單表單狀態
  const [newOrder, setNewOrder] = useState({
    customer_id: '',
    order_date: '',
    delivery_date: '',
    production_date: '',
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
    source: '現場訂購',
    payment_method: '面交付款',
    order_number: ''
  });


  // 訂單歷史查詢狀態
  const [orderHistory, setOrderHistory] = useState([]);
  const [orderHistoryLoaded, setOrderHistoryLoaded] = useState(false); // 防重複載入
  // ✅ 預設顯示今天的訂單
  const today = new Date().toISOString().split('T')[0];
  const [historyFilters, setHistoryFilters] = useState({
    customer_id: '',
    start_date: today, // ✅ 預設為今天
    end_date: today,   // ✅ 預設為今天
    order_type: '' // 新增訂單類型篩選
  });

  // 訂單歷史客戶搜尋狀態
  const [historyCustomerSearchTerm, setHistoryCustomerSearchTerm] = useState('');
  const [filteredHistoryCustomers, setFilteredHistoryCustomers] = useState([]);

  // 出貨管理狀態
  const [shippingOrders, setShippingOrders] = useState([]);
  const [shippingDate, setShippingDate] = useState(new Date().toISOString().split('T')[0]);
  const [weeklyShippingData, setWeeklyShippingData] = useState([]);
  const [showWeeklyOverview, setShowWeeklyOverview] = useState(true); // ✅ 預設顯示未來一週出貨概覽

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

  // 當切換到新增訂單頁面時，更新日期到當前日期
  useEffect(() => {
    if (activeTab === 'new-order') {
      const today = new Date();
      const todayStr = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');
      console.log('🔄 更新新增訂單日期到:', todayStr);
      setNewOrder(prev => ({
        ...prev,
        order_date: todayStr,
        delivery_date: '',      // 不要自動塞今天
        production_date: ''     // 不要自動塞
      }));
    }
  }, [activeTab]);

  // 組件載入時也更新日期（處理初始載入的情況）
  useEffect(() => {
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + 
      String(today.getMonth() + 1).padStart(2, '0') + '-' + 
      String(today.getDate()).padStart(2, '0');
    console.log('🔄 組件載入時更新日期到:', todayStr);
    console.log('🔄 當前 newOrder 狀態:', newOrder);
    setNewOrder(prev => {
      const updated = {
        ...prev,
        order_date: todayStr,
        delivery_date: '',      // 不要自動塞今天
        production_date: ''     // 不要自動塞
      };
      console.log('🔄 更新後的 newOrder:', updated);
      return updated;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  // 移除強制更新日期的 useEffect，讓用戶可以手動編輯日期

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
      
      // ✅ 同時載入庫存數據，用於判斷是否可以出貨
      await fetchInventoryData();
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
      const response = await axios.put(`${config.apiUrl}/api/orders/${orderId}/shipping-status`, { status });
      console.log('更新出貨狀態響應:', response.data);
      setSuccess(`訂單狀態已更新為：${status === 'shipped' ? '已出貨' : '待出貨'}`);
      // 重新載入出貨訂單和週出貨概覽
      await fetchShippingOrders();
      if (showWeeklyOverview) {
        await fetchWeeklyShippingData();
      }
      // ✅ 如果當前在訂單歷史頁面，也要重新載入訂單歷史
      if (activeTab === 'order-history') {
        await fetchOrderHistory(true); // 強制重新載入
      }
    } catch (err) {
      console.error('更新出貨狀態錯誤:', err);
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

  // 監聽編輯表單變化
  useEffect(() => {
    if (editingOrder) {
      console.log('編輯表單狀態變化:', editOrderForm);
    }
  }, [editOrderForm, editingOrder]);

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
      console.log('正在載入產品資料...');
      const response = await axios.get(`${config.apiUrl}/api/products`);
      console.log('產品資料載入成功:', response.data);
      console.log('產品資料數量:', response.data.length);
      setProducts(response.data);
      console.log('產品狀態已更新，當前產品數量:', response.data.length);
    } catch (err) {
      console.error('載入產品列表失敗:', err);
      console.log('使用硬編碼產品資料...');
      // 如果 API 失敗，使用硬編碼的產品資料
      const hardcodedProducts = [
        { id: 1, name: "蔬果73-元氣綠", price: 134, description: "綠色蔬果系列，富含維生素" },
        { id: 2, name: "蔬果73-活力紅", price: 134, description: "紅色蔬果系列，抗氧化" },
        { id: 3, name: "蔬果73-亮妍莓", price: 134, description: "莓果系列，美容養顏" },
        { id: 4, name: "蔬菜73-幸運果", price: 134, description: "黃橘色蔬果系列，提升免疫力" },
        { id: 5, name: "蔬菜100-順暢綠", price: 134, description: "100% 綠色 蔬菜，促進消化" },
        { id: 6, name: "蔬菜100-養生黑", price: 134, description: "100% 黑色養生，滋補強身" },
        { id: 7, name: "蔬菜100-養眼晶", price: 139, description: "100% 有機枸杞，護眼明目" },
        { id: 8, name: "蔬菜100-法國黑巧70", price: 139, description: "100% 法國黑巧克力，70% 可可含量" },
        { id: 9, name: "隨機送", price: 0, description: "" }
      ];
      setProducts(hardcodedProducts);
      console.log('硬編碼產品狀態已更新，當前產品數量:', hardcodedProducts.length);
    }
  };

  // 庫存管理相關函數
  const fetchInventoryData = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/inventory/scheduling`);
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

  // 一鍵歸零：將所有產品庫存設置為0
  const handleResetAllStock = async () => {
    // 顯示確認視窗
    const totalProducts = inventoryData.length;
    const totalStock = inventoryData.reduce((sum, p) => sum + (p.current_stock || 0), 0);
    
    const confirmMessage = `確定要將所有產品的庫存歸零嗎？\n\n` +
      `此操作無法復原！\n\n` +
      `產品數量：${totalProducts} 個\n` +
      `當前總庫存：${totalStock} 件\n\n` +
      `請輸入「確認歸零」以繼續：`;
    
    const userInput = prompt(confirmMessage);
    if (userInput !== '確認歸零') {
      alert('已取消歸零操作');
      return;
    }

    // 二次確認
    if (!window.confirm('⚠️ 最後確認：您真的要將所有產品庫存歸零嗎？此操作無法復原！')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await axios.put(`${config.apiUrl}/api/products/reset-stock`);
      
      if (response.data.success) {
        setSuccess(`✅ ${response.data.message}`);
        // 重新載入庫存數據
        await fetchInventoryData();
        await fetchInventoryTransactions();
        // 3秒後清除成功訊息
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('歸零失敗：' + (response.data.message || '未知錯誤'));
      }
    } catch (error) {
      console.error('庫存歸零錯誤:', error);
      setError('歸零失敗：' + (error.response?.data?.error || error.message));
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

  const fetchOrderHistory = async (forceReload = false) => {
    // 防重複載入：如果已經載入過且不是強制重新載入，則跳過
    if (orderHistoryLoaded && !forceReload) {
      console.log('🔄 訂單歷史已載入，跳過重複載入');
      return;
    }

    setLoading(true);
    try {
      // 使用真正的 API 載入訂單歷史
      const params = new URLSearchParams();
      if (historyFilters.customer_id) params.append('customer_id', historyFilters.customer_id);
      if (historyFilters.start_date) params.append('start_date', historyFilters.start_date);
      if (historyFilters.end_date) params.append('end_date', historyFilters.end_date);
      if (historyFilters.order_type) params.append('order_type', historyFilters.order_type);
      
      const url = `${config.apiUrl}/api/orders/history?${params.toString()}`;
      console.log('載入訂單歷史 URL:', url);
      const response = await axios.get(url);
      console.log('訂單歷史 API 回應:', response.data);
      
      // ✅ 後端返回格式為 { orders: [...], count: ... }，需要正確解析
      const data = response.data?.orders || (Array.isArray(response.data) ? response.data : []);
      console.log('訂單歷史數量:', data.length);
      setOrderHistory(data);
      setOrderHistoryLoaded(true); // 標記為已載入
    } catch (err) {
      console.error('載入訂單歷史錯誤:', err);
      setError('載入訂單歷史失敗: ' + err.message);
      setOrderHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // 自動載入訂單歷史 - 僅在初次載入時呼叫一次
  useEffect(() => {
    if (activeTab === 'order-history' && !orderHistoryLoaded) {
      console.log('🔄 初次載入訂單歷史');
      fetchOrderHistory();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

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
        shipping_fee: finalShippingFee,
        credit_card_fee: calculateCreditCardFee(newOrder, customers),
        shopee_fee: calculateShopeeFee(newOrder, customers)
      };

      // 使用真正的 API 建立訂單
      await axios.post(`${config.apiUrl}/api/orders`, orderData);
      setSuccess('訂單建立成功！');
      
      // 重置表單
      const today = new Date().toISOString().split('T')[0];
      console.log('🔄 表單重置，更新日期到:', today);
      setNewOrder({
        customer_id: '',
        order_date: today,
        delivery_date: '',      // 不要自動塞今天
        production_date: '',    // 不要自動塞
        notes: '',
        items: [{ product_name: '', quantity: 1, unit_price: 0, special_notes: '', is_gift: false }],
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
      console.log('開始編輯訂單:', orderId);
      const response = await axios.get(`${config.apiUrl}/api/orders/${orderId}`);
      const order = response.data;
      console.log('載入的訂單資料:', order);
      
      // 重新載入產品資料以確保下拉選單正常顯示
      console.log('重新載入產品資料...');
      await fetchProducts();
      console.log('產品資料載入完成，當前產品數量:', products.length);
      
      setEditingOrder(orderId);
      console.log('原始訂單項目:', order.items);
      const formItems = order.items.length > 0 ? order.items : [{ product_name: '', quantity: 1, unit_price: 0, special_notes: '', status: 'pending', is_gift: false }];
      console.log('表單項目:', formItems);
      setEditOrderForm({
        customer_id: order.customer_id,
        order_date: order.order_date,
        delivery_date: order.delivery_date,
        notes: order.notes || '',
        items: formItems,
        shipping_type: order.shipping_type || 'none',
        shipping_fee: order.shipping_fee || 0
      });
      console.log('設置編輯表單完成');
      setActiveTab('edit-order');
    } catch (err) {
      console.error('編輯訂單錯誤:', err);
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
      console.log('開始更新訂單，編輯表單資料:', editOrderForm);
      console.log('訂單項目詳細:', editOrderForm.items);
      
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
        shipping_fee: finalShippingFee,
        credit_card_fee: calculateEditCreditCardFee(editOrderForm, customers),
        shopee_fee: calculateEditShopeeFee(editOrderForm, customers)
      };

      console.log('發送到後端的訂單資料:', orderData);
      const response = await axios.put(`${config.apiUrl}/api/orders/${editingOrder}`, orderData);
      console.log('後端回應:', response.data);
      
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
      // ✅ 更新後自動重新載入訂單歷史，確保表格顯示最新資料
      await fetchOrderHistory(true); // 強制重新載入
    } catch (err) {
      console.error('更新訂單錯誤:', err);
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
      await fetchOrderHistory(true); // 強制重新載入
    } catch (err) {
      setError('刪除訂單失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const updateEditOrderItem = (index, field, value) => {
    console.log('編輯訂單 - 更新項目:', { index, field, value });
    console.log('編輯訂單 - 更新前的表單:', editOrderForm);
    const updatedItems = [...editOrderForm.items];
    console.log('編輯訂單 - 更新前的項目:', updatedItems[index]);
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    console.log('編輯訂單 - 更新後的項目:', updatedItems[index]);
    const newForm = { ...editOrderForm, items: updatedItems };
    setEditOrderForm(newForm);
    console.log('編輯訂單 - 更新後的表單:', newForm);
  };

  const addEditOrderItem = () => {
    console.log('編輯訂單 - 新增項目');
    setEditOrderForm({
      ...editOrderForm,
      items: [...editOrderForm.items, { product_name: '', quantity: 1, unit_price: 0, special_notes: '', status: 'pending', is_gift: false }]
    });
  };

  const removeEditOrderItem = (index) => {
    console.log('編輯訂單 - 移除項目:', index);
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
    
    // 計算蝦皮費用
    let shopeeFee = 0;
    if (newOrder.customer_id) {
      const selectedCustomer = customers.find(c => c.id === parseInt(newOrder.customer_id));
      if (selectedCustomer && selectedCustomer.source === '蝦皮訂購') {
        // 計算付費產品總金額（排除贈品）
        const paidItemsTotal = newOrder.items
          .filter(item => !item.is_gift)
          .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        
        // 成交手續費 = 付費產品金額 × 5.5%
        const transactionFee = paidItemsTotal * 0.055;
        // 金流與系統處理費 = 付費產品金額 × 2%
        const paymentFee = paidItemsTotal * 0.02;
        // 總手續費 = 成交手續費 + 金流與系統處理費，四捨五入到整數
        shopeeFee = Math.round(transactionFee + paymentFee);
      }
    }
    
    return itemsTotal + shippingAdjustment - creditCardFee - shopeeFee;
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

  // 計算蝦皮費用
  const calculateShopeeFee = () => {
    if (!newOrder.customer_id) return 0;
    
    const selectedCustomer = customers.find(c => c.id === parseInt(newOrder.customer_id));
    if (!selectedCustomer || selectedCustomer.source !== '蝦皮訂購') return 0;
    
    // 計算付費產品總金額（排除贈品）
    const paidItemsTotal = newOrder.items
      .filter(item => !item.is_gift)
      .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    
    // 成交手續費 = 付費產品金額 × 5.5%
    const transactionFee = paidItemsTotal * 0.055;
    // 金流與系統處理費 = 付費產品金額 × 2%
    const paymentFee = paidItemsTotal * 0.02;
    // 總手續費 = 成交手續費 + 金流與系統處理費，四捨五入到整數
    return Math.round(transactionFee + paymentFee);
  };

  // 計算編輯訂單的信用卡手續費
  const calculateEditCreditCardFee = () => {
    if (!editOrderForm.customer_id) return 0;
    
    const selectedCustomer = customers.find(c => c.id === parseInt(editOrderForm.customer_id));
    if (!selectedCustomer || selectedCustomer.payment_method !== '信用卡') return 0;
    
    // 計算付費產品總金額（排除贈品）
    const paidItemsTotal = editOrderForm.items
      .filter(item => !item.is_gift)
      .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    
    // 手續費 = 付費產品金額 × 2%
    return Math.round(paidItemsTotal * 0.02);
  };

  // 計算編輯訂單的蝦皮費用
  const calculateEditShopeeFee = () => {
    if (!editOrderForm.customer_id) return 0;
    
    const selectedCustomer = customers.find(c => c.id === parseInt(editOrderForm.customer_id));
    if (!selectedCustomer || selectedCustomer.source !== '蝦皮訂購') return 0;
    
    // 計算付費產品總金額（排除贈品）
    const paidItemsTotal = editOrderForm.items
      .filter(item => !item.is_gift)
      .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    
    // 成交手續費 = 付費產品金額 × 5.5%
    const transactionFee = paidItemsTotal * 0.055;
    // 金流與系統處理費 = 付費產品金額 × 2%
    const paymentFee = paidItemsTotal * 0.02;
    // 總手續費 = 成交手續費 + 金流與系統處理費，四捨五入到整數
    return Math.round(transactionFee + paymentFee);
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
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="date"
                className="form-input"
                value={newOrder.order_date}
                onChange={(e) => setNewOrder({ ...newOrder, order_date: e.target.value })}
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  console.log('🔄 手動更新訂單日期到:', today);
                  setNewOrder(prev => ({ ...prev, order_date: today }));
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📅 今天
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">交貨日期</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="date"
                className="form-input"
                value={newOrder.delivery_date}
                onChange={(e) => setNewOrder({ ...newOrder, delivery_date: e.target.value })}
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  console.log('🔄 手動更新交貨日期到:', today);
                  setNewOrder(prev => ({ ...prev, delivery_date: today }));
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📅 今天
              </button>
            </div>
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
            <div key={index} style={{
              backgroundColor: item.is_gift ? '#fff3cd' : '#f8f9fa',
              border: item.is_gift ? '2px solid #ffc107' : '1px solid #e9ecef',
              borderRadius: item.is_gift ? '8px' : '0',
              padding: item.is_gift ? '10px' : '0',
              marginBottom: item.is_gift ? '10px' : '0'
            }}>
              {item.is_gift && (
                <div style={{
                  color: '#856404',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  🎁 贈送項目
                </div>
              )}
              <div className="item-row">
              <select
                className="form-select"
                value={item.product_name}
                onChange={(e) => {
                  const raw = e.target.value || '';
                  console.log('產品選擇變更:', raw);
                  const norm = raw.trim().toLowerCase();
                  const selectedProduct = products.find(p => (p.name || '').trim().toLowerCase() === norm);
                  console.log('找到的產品:', selectedProduct);
                  // 設定產品名稱
                  updateOrderItem(index, 'product_name', raw);
                  // 一律從 1 開始（不依賴 current_stock）
                  updateOrderItem(index, 'quantity', 1);
                  // 如果是贈送項目，保持價格為 -30；否則帶入產品售價
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
                小計: NT$ {((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toLocaleString()}
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
              訂單總計: NT$ {(newOrder.items || []).reduce((total, item) => total + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0).toLocaleString()}
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
            最終總計: NT$ {(calculateTotalAmount(newOrder, shippingFee, customers) || 0).toLocaleString()}
          </div>
          
          {/* 顯示明細 */}
            <div style={{ 
              fontSize: '14px', 
              color: '#7f8c8d',
            marginTop: '5px',
            lineHeight: '1.4'
          }}>
            <div>產品總計: NT$ {(newOrder.items || []).reduce((total, item) => total + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0).toLocaleString()}</div>
            
            {/* 信用卡手續費 */}
            {calculateCreditCardFee(newOrder, customers) > 0 && (
              <div style={{ color: '#e67e22', fontWeight: 'bold' }}>
                💳 信用卡手續費扣除 (2%): NT$ {(calculateCreditCardFee(newOrder, customers) || 0).toLocaleString()}
              </div>
            )}
            
            {/* 蝦皮費用 */}
            {calculateShopeeFee(newOrder, customers) > 0 && (
              <div style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                🛒 蝦皮訂單費用扣除 (7.5%): NT$ {(calculateShopeeFee(newOrder, customers) || 0).toLocaleString()}
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
          <label className="form-label">便利商店店名</label>
          <input
            type="text"
            className="form-input"
            value={newCustomer.family_mart_address}
            onChange={(e) => setNewCustomer({ ...newCustomer, family_mart_address: e.target.value })}
            placeholder="請輸入便利商店店名"
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
            <option value="蝦皮訂購">蝦皮訂購</option>
            <option value="網路訂購">網路訂購</option>
            <option value="現場訂購">現場訂購</option>
            <option value="親自送達">親自送達</option>
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
            <option value="銀行匯款">銀行匯款</option>
            <option value="面交付款">面交付款</option>
            <option value="信用卡付款">信用卡付款</option>
            <option value="LinePay">LinePay</option>
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
            <div key={index} style={{
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
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  🎁 贈送項目
                </div>
              )}
              <div className="item-row">
              <select
                className="form-input"
                value={item.product_name}
                onChange={(e) => {
                  console.log('編輯訂單 - 產品選擇變更:', e.target.value);
                  console.log('編輯訂單 - 當前產品列表:', products);
                  console.log('編輯訂單 - 產品列表長度:', products.length);
                  const selectedProduct = products.find(p => p.name === e.target.value);
                  console.log('編輯訂單 - 找到的產品:', selectedProduct);
                  
                  // 一次性更新產品名稱和價格，避免狀態競爭
                  const updatedItems = [...editOrderForm.items];
                  updatedItems[index] = { 
                    ...updatedItems[index], 
                    product_name: e.target.value,
                    unit_price: (selectedProduct && !item.is_gift) ? selectedProduct.price : updatedItems[index].unit_price
                  };
                  const newForm = { ...editOrderForm, items: updatedItems };
                  setEditOrderForm(newForm);
                  console.log('編輯訂單 - 一次性更新完成:', newForm);
                }}
                required
              >
                <option value="">請選擇產品</option>
                {products.length > 0 ? (
                  products.map(product => (
                    <option key={product.id} value={product.name}>
                      {product.name} - NT$ {product.price}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>載入中...</option>
                )}
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

  // 分離下載功能狀態
  const [downloadOptions, setDownloadOptions] = useState({
    customers: true,
    products: true,
    orders: true,
    posOrders: false
  });

  // 分離上傳功能狀態
  const [uploadOptions, setUploadOptions] = useState({
    customers: false,
    products: false,
    orders: false,
    posOrders: false
  });

  // ID映射表，用於處理上傳時的ID變更
  const [idMappings, setIdMappings] = useState({
    customers: new Map(),
    products: new Map()
  });

  // 分離下載函數
  const handleSeparateDownload = async (dataType) => {
    try {
      setLoading(true);
      setError('');
      
      let apiUrl, fileName, dataKey;
      
      switch (dataType) {
        case 'customers':
          apiUrl = `${config.apiUrl}/api/customers`;
          fileName = `customers_${new Date().toISOString().split('T')[0]}.json`;
          dataKey = 'customers';
          break;
        case 'products':
          apiUrl = `${config.apiUrl}/api/products`;
          fileName = `products_${new Date().toISOString().split('T')[0]}.json`;
          dataKey = 'products';
          break;
        case 'orders':
          apiUrl = `${config.apiUrl}/api/orders/history`;
          fileName = `orders_${new Date().toISOString().split('T')[0]}.json`;
          dataKey = 'orders';
          break;
        case 'posOrders':
          apiUrl = `${config.apiUrl}/api/orders/history`;
          fileName = `pos_orders_${new Date().toISOString().split('T')[0]}.json`;
          dataKey = 'posOrders';
          break;
        default:
          throw new Error('無效的資料類型');
      }

      console.log(`下載 ${dataType} 資料...`);
      const response = await axios.get(apiUrl);
      let data = response.data;
      
      // 如果是POS訂單，過濾出POS相關的訂單
      if (dataType === 'posOrders') {
        data = data.filter(order => 
          order.source === '現場訂購' || 
          order.created_by === 'pos-system' ||
          order.order_type === 'walk-in'
        );
        console.log(`過濾出 ${data.length} 筆POS訂單`);
      }
      
      console.log(`下載的 ${dataType} 資料:`, {
        count: data.length,
        sample: data[0]
      });

      const backupData = {
        backup_date: new Date().toISOString(),
        data_type: dataType,
        [dataKey]: data
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess(`${dataType} 資料下載成功！`);
    } catch (err) {
      setError(`下載 ${dataType} 資料失敗: ` + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 批量下載函數
  const handleBatchDownload = async () => {
    try {
      setLoading(true);
      setError('');
      
      const downloads = [];
      
      if (downloadOptions.customers) {
        downloads.push({ type: 'customers', url: `${config.apiUrl}/api/customers` });
      }
      if (downloadOptions.products) {
        downloads.push({ type: 'products', url: `${config.apiUrl}/api/products` });
      }
      if (downloadOptions.orders) {
        downloads.push({ type: 'orders', url: `${config.apiUrl}/api/orders/history` });
      }
      if (downloadOptions.posOrders) {
        downloads.push({ type: 'posOrders', url: `${config.apiUrl}/api/orders/history` });
      }

      if (downloads.length === 0) {
        setError('請至少選擇一種資料類型');
        return;
      }

      console.log('批量下載資料...', downloads);
      
      // 並行下載所有選中的資料
      const responses = await Promise.all(
        downloads.map(download => axios.get(download.url))
      );

      // 創建包含所有資料的備份檔案
      const backupData = {
        backup_date: new Date().toISOString(),
        download_types: downloads.map(d => d.type)
      };

      downloads.forEach((download, index) => {
        let data = responses[index].data;
        
        // 如果是POS訂單，過濾出POS相關的訂單
        if (download.type === 'posOrders') {
          data = data.filter(order => 
            order.source === '現場訂購' || 
            order.created_by === 'pos-system' ||
            order.order_type === 'walk-in'
          );
          console.log(`過濾出 ${data.length} 筆POS訂單`);
        }
        
        backupData[download.type] = data;
      });

      console.log('批量下載完成:', {
        types: downloads.map(d => d.type),
        counts: downloads.map((d, i) => ({ [d.type]: responses[i].data.length }))
      });

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess(`批量下載成功！包含: ${downloads.map(d => d.type).join(', ')}`);
    } catch (err) {
      setError('批量下載失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // 分離上傳函數
  const handleSeparateUpload = (dataType) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        setLoading(true);
        setError('');
        
        const text = await file.text();
        const backupData = JSON.parse(text);
        
        console.log(`上傳 ${dataType} 資料...`, backupData);
        
        // 驗證檔案格式
        console.log('檔案內容結構:', Object.keys(backupData));
        
        let data;
        if (backupData[dataType]) {
          // 新格式：{ customers: [...], products: [...], orders: [...], posOrders: [...] }
          data = backupData[dataType];
        } else if (Array.isArray(backupData)) {
          // 舊格式：直接是陣列
          data = backupData;
        } else {
          throw new Error(`無效的 ${dataType} 檔案格式。期望包含 ${dataType} 欄位或直接為陣列格式`);
        }
        
        if (!Array.isArray(data)) {
          throw new Error(`${dataType} 資料格式錯誤，期望陣列格式`);
        }
        
        console.log(`準備上傳 ${dataType} 資料:`, {
          count: data.length,
          sample: data[0]
        });
        
        // 清空現有資料
        console.log(`清空現有 ${dataType} 資料...`);
        if (dataType === 'customers') {
          const existingCustomers = await axios.get(`${config.apiUrl}/api/customers`);
          for (const customer of existingCustomers.data) {
            await axios.delete(`${config.apiUrl}/api/customers/${customer.id}`);
          }
        } else if (dataType === 'products') {
          const existingProducts = await axios.get(`${config.apiUrl}/api/products`);
          for (const product of existingProducts.data) {
            await axios.delete(`${config.apiUrl}/api/products/${product.id}`);
          }
        } else if (dataType === 'orders') {
          const existingOrders = await axios.get(`${config.apiUrl}/api/orders/history`);
          for (const order of existingOrders.data) {
            await axios.delete(`${config.apiUrl}/api/orders/${order.id}`);
          }
        } else if (dataType === 'posOrders') {
          // 只清空POS相關的訂單
          const existingOrders = await axios.get(`${config.apiUrl}/api/orders/history`);
          const posOrders = existingOrders.data.filter(order => 
            order.source === '現場訂購' || 
            order.created_by === 'pos-system' ||
            order.order_type === 'walk-in'
          );
          for (const order of posOrders) {
            await axios.delete(`${config.apiUrl}/api/orders/${order.id}`);
          }
          console.log(`清空了 ${posOrders.length} 筆POS訂單`);
        }
        
        // 上傳新資料
        console.log(`上傳新 ${dataType} 資料...`);
        if (dataType === 'customers') {
          const newCustomerMappings = new Map();
          for (const item of data) {
            const { id: oldId, ...itemData } = item;
            const response = await axios.post(`${config.apiUrl}/api/customers`, itemData);
            // ✅ 處理不同的 API 響應格式（資料庫模式可能返回 { success: true, customer: {...} } 或直接返回客戶對象）
            const newId = response.data.id || (response.data.customer && response.data.customer.id);
            if (!newId) {
              console.error('無法獲取新客戶ID:', response.data);
              continue;
            }
            newCustomerMappings.set(oldId, newId);
            console.log(`客戶 ${itemData.name}: 舊ID ${oldId} -> 新ID ${newId}`);
          }
          // 更新客戶ID映射表
          setIdMappings(prev => ({
            ...prev,
            customers: new Map([...prev.customers, ...newCustomerMappings])
          }));
        } else if (dataType === 'products') {
          for (const item of data) {
            const { id, ...itemData } = item;
            await axios.post(`${config.apiUrl}/api/products`, itemData);
          }
        } else if (dataType === 'orders') {
          // 訂單需要特殊處理，因為可能包含不存在的 customer_id
          for (const item of data) {
            const { id, customer_id, ...itemData } = item;
            
            console.log(`處理訂單 ${id}: customer_id = ${customer_id}`);
            console.log('當前客戶ID映射表:', Array.from(idMappings.customers.entries()));
            
            // 處理 customer_id，使用ID映射表
            if (customer_id) {
              // 首先檢查ID映射表
              if (idMappings.customers.has(customer_id)) {
                const newCustomerId = idMappings.customers.get(customer_id);
                console.log(`使用映射表: 客戶ID ${customer_id} -> ${newCustomerId}`);
                itemData.customer_id = newCustomerId;
              } else {
                console.warn(`映射表中找不到客戶ID ${customer_id}，嘗試直接查詢`);
                // 如果映射表中沒有，直接檢查客戶是否存在
                try {
                  const customerResponse = await axios.get(`${config.apiUrl}/api/customers/${customer_id}`);
                  console.log(`客戶 ID ${customer_id} 存在:`, customerResponse.data.name);
                  itemData.customer_id = customer_id;
                } catch (error) {
                  console.warn(`客戶 ID ${customer_id} 不存在，嘗試使用第一個可用客戶`);
                  console.warn('錯誤詳情:', error.response?.data || error.message);
                  
                  // 嘗試使用第一個可用的客戶，如果沒有就創建一個預設客戶
                  try {
                    const customersResponse = await axios.get(`${config.apiUrl}/api/customers`);
                    if (customersResponse.data.length > 0) {
                      const firstCustomer = customersResponse.data[0];
                      console.log(`使用客戶 ID ${firstCustomer.id} (${firstCustomer.name}) 替代`);
                      itemData.customer_id = firstCustomer.id;
                    } else {
                      console.warn('沒有可用的客戶，創建預設客戶');
                      // 創建一個預設客戶
                      const defaultCustomer = {
                        name: `預設客戶_${Date.now()}`,
                        phone: '0000000000',
                        address: '預設地址',
                        source: '系統自動創建',
                        payment_method: '貨到付款'
                      };
                      const newCustomerResponse = await axios.post(`${config.apiUrl}/api/customers`, defaultCustomer);
                      const newCustomerId = newCustomerResponse.data.id;
                      console.log(`創建預設客戶 ID ${newCustomerId}: ${defaultCustomer.name}`);
                      itemData.customer_id = newCustomerId;
                    }
                  } catch (customersError) {
                    console.error('無法獲取客戶列表:', customersError);
                    itemData.customer_id = null;
                  }
                }
              }
            } else {
              console.log(`訂單 ${id} 沒有 customer_id，嘗試使用第一個可用客戶`);
              // 如果沒有 customer_id，嘗試使用第一個可用的客戶
              try {
                const customersResponse = await axios.get(`${config.apiUrl}/api/customers`);
                if (customersResponse.data.length > 0) {
                  const firstCustomer = customersResponse.data[0];
                  console.log(`使用客戶 ID ${firstCustomer.id} (${firstCustomer.name}) 替代 null customer_id`);
                  itemData.customer_id = firstCustomer.id;
                } else {
                  console.warn('沒有可用的客戶，將 customer_id 設為 null');
                  itemData.customer_id = null;
                }
              } catch (customersError) {
                console.error('無法獲取客戶列表:', customersError);
                itemData.customer_id = null;
              }
            }
            
            console.log(`上傳訂單 ${id} 資料:`, {
              customer_id: itemData.customer_id,
              order_date: itemData.order_date,
              items_count: itemData.items?.length || 0
            });
            
            try {
              const apiUrl = `${config.apiUrl}/api/orders`;
              console.log(`發送請求到: ${apiUrl}`);
              console.log('請求資料:', itemData);
              
              const response = await axios.post(apiUrl, itemData, {
                headers: { 'Content-Type': 'application/json' }
              });
              console.log(`訂單 ${id} 上傳成功:`, response.data);
            } catch (error) {
              console.error(`訂單 ${id} 上傳失敗:`, error.response?.data || error.message);
              console.error('錯誤狀態碼:', error.response?.status);
              console.error('錯誤詳情:', error.response);
              throw error;
            }
          }
        } else if (dataType === 'posOrders') {
          // POS訂單上傳，使用與一般訂單相同的邏輯
          for (const item of data) {
            const { id, customer_id, ...itemData } = item;
            
            console.log(`處理POS訂單 ${id}: customer_id = ${customer_id}`);
            console.log('當前客戶ID映射表:', Array.from(idMappings.customers.entries()));
            
            // 處理 customer_id，使用ID映射表
            if (customer_id) {
              // 首先檢查ID映射表
              if (idMappings.customers.has(customer_id)) {
                const newCustomerId = idMappings.customers.get(customer_id);
                console.log(`使用映射表: 客戶ID ${customer_id} -> ${newCustomerId}`);
                itemData.customer_id = newCustomerId;
              } else {
                console.warn(`映射表中找不到客戶ID ${customer_id}，嘗試直接查詢`);
                // 如果映射表中沒有，直接檢查客戶是否存在
                try {
                  const customerResponse = await axios.get(`${config.apiUrl}/api/customers/${customer_id}`);
                  console.log(`客戶 ID ${customer_id} 存在:`, customerResponse.data.name);
                  itemData.customer_id = customer_id;
                } catch (error) {
                  console.warn(`客戶 ID ${customer_id} 不存在，嘗試使用第一個可用客戶`);
                  console.warn('錯誤詳情:', error.response?.data || error.message);
                  
                  // 嘗試使用第一個可用的客戶，如果沒有就創建一個預設客戶
                  try {
                    const customersResponse = await axios.get(`${config.apiUrl}/api/customers`);
                    if (customersResponse.data.length > 0) {
                      const firstCustomer = customersResponse.data[0];
                      console.log(`使用客戶 ID ${firstCustomer.id} (${firstCustomer.name}) 替代`);
                      itemData.customer_id = firstCustomer.id;
                    } else {
                      console.warn('沒有可用的客戶，創建預設客戶');
                      // 創建一個預設客戶
                      const defaultCustomer = {
                        name: `預設客戶_${Date.now()}`,
                        phone: '0000000000',
                        address: '預設地址',
                        source: '系統自動創建',
                        payment_method: '貨到付款'
                      };
                      const newCustomerResponse = await axios.post(`${config.apiUrl}/api/customers`, defaultCustomer);
                      const newCustomerId = newCustomerResponse.data.id;
                      console.log(`創建預設客戶 ID ${newCustomerId}: ${defaultCustomer.name}`);
                      itemData.customer_id = newCustomerId;
                    }
                  } catch (customersError) {
                    console.error('無法獲取客戶列表:', customersError);
                    itemData.customer_id = null;
                  }
                }
              }
            } else {
              console.log(`POS訂單 ${id} 沒有 customer_id，嘗試使用第一個可用客戶`);
              // 如果沒有 customer_id，嘗試使用第一個可用的客戶
              try {
                const customersResponse = await axios.get(`${config.apiUrl}/api/customers`);
                if (customersResponse.data.length > 0) {
                  const firstCustomer = customersResponse.data[0];
                  console.log(`使用客戶 ID ${firstCustomer.id} (${firstCustomer.name}) 替代 null customer_id`);
                  itemData.customer_id = firstCustomer.id;
                } else {
                  console.warn('沒有可用的客戶，將 customer_id 設為 null');
                  itemData.customer_id = null;
                }
              } catch (customersError) {
                console.error('無法獲取客戶列表:', customersError);
                itemData.customer_id = null;
              }
            }
            
            console.log(`上傳POS訂單 ${id} 資料:`, {
              customer_id: itemData.customer_id,
              order_date: itemData.order_date,
              items_count: itemData.items?.length || 0
            });
            
            try {
              // POS訂單使用專用端點，避免信用卡費用計算
              const apiUrl = `${config.apiUrl}/api/shared/pos-orders`;
              console.log(`發送POS訂單請求到: ${apiUrl}`);
              
              // 轉換為POS訂單格式
              const posOrderData = {
                items: itemData.items || [],
                subtotal: itemData.subtotal || 0,
                customer_payment: itemData.customer_payment || 0,
                change: itemData.change || 0,
                payment_method: itemData.payment_method || 'cash',
                created_by: itemData.created_by || 'pos-system'
              };
              
              console.log('POS訂單請求資料:', posOrderData);
              
              const response = await axios.post(apiUrl, posOrderData, {
                headers: { 'Content-Type': 'application/json' }
              });
              console.log(`POS訂單 ${id} 上傳成功:`, response.data);
            } catch (error) {
              console.error(`POS訂單 ${id} 上傳失敗:`, error.response?.data || error.message);
              console.error('錯誤狀態碼:', error.response?.status);
              console.error('錯誤詳情:', error.response);
              throw error;
            }
          }
        }
        
        // 重新載入資料
        await fetchCustomers();
        await fetchProducts();
        await fetchOrderHistory(true); // 強制重新載入
        
        setSuccess(`${dataType} 資料上傳成功！`);
      } catch (err) {
        setError(`上傳 ${dataType} 資料失敗: ` + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  // 批量上傳函數
  const handleBatchUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        setLoading(true);
        setError('');
        
        const text = await file.text();
        const backupData = JSON.parse(text);
        
        console.log('批量上傳資料...', backupData);
        
        // 驗證檔案格式
        console.log('批量上傳檔案內容結構:', Object.keys(backupData));
        
        if (!backupData.backup_date && !backupData.customers && !backupData.products && !backupData.orders && !backupData.posOrders) {
          throw new Error('無效的備份檔案格式。檔案應包含 backup_date 或資料欄位');
        }
        
        const uploadTypes = [];
        if (backupData.customers && uploadOptions.customers) uploadTypes.push('customers');
        if (backupData.products && uploadOptions.products) uploadTypes.push('products');
        if (backupData.orders && uploadOptions.orders) uploadTypes.push('orders');
        if (backupData.posOrders && uploadOptions.posOrders) uploadTypes.push('posOrders');
        
        if (uploadTypes.length === 0) {
          setError('請至少選擇一種要上傳的資料類型');
          return;
        }
        
        console.log('準備上傳的資料類型:', uploadTypes);
        
        // 處理客戶資料
        if (uploadTypes.includes('customers')) {
          console.log('處理客戶資料...');
          const existingCustomers = await axios.get(`${config.apiUrl}/api/customers`);
          for (const customer of existingCustomers.data) {
            await axios.delete(`${config.apiUrl}/api/customers/${customer.id}`);
          }
          
          for (const customer of backupData.customers) {
            const { id: oldId, ...customerData } = customer;
            const response = await axios.post(`${config.apiUrl}/api/customers`, customerData);
            // ✅ 處理 API 響應格式（支援直接返回客戶對象或 { customer: {...} } 格式）
            const newId = response.data.id || (response.data.customer && response.data.customer.id);
            if (newId && oldId !== newId) {
              console.log(`客戶 ${customerData.name}: 舊ID ${oldId} -> 新ID ${newId}`);
            } else if (!newId) {
              console.error(`無法獲取新客戶ID，響應:`, response.data);
            }
          }
        }
        
        // 處理產品資料
        if (uploadTypes.includes('products')) {
          console.log('處理產品資料...');
          const existingProducts = await axios.get(`${config.apiUrl}/api/products`);
          for (const product of existingProducts.data) {
            await axios.delete(`${config.apiUrl}/api/products/${product.id}`);
          }
          
          for (const product of backupData.products) {
            const { id, ...productData } = product;
            await axios.post(`${config.apiUrl}/api/products`, productData);
          }
        }
        
        // 處理訂單資料
        if (uploadTypes.includes('orders')) {
          console.log('處理訂單資料...');
          const existingOrders = await axios.get(`${config.apiUrl}/api/orders/history`);
          for (const order of existingOrders.data) {
            await axios.delete(`${config.apiUrl}/api/orders/${order.id}`);
          }
          
          for (const order of backupData.orders) {
            const { id, customer_id, ...orderData } = order;
            
            // 如果 customer_id 存在，檢查客戶是否存在
            if (customer_id) {
              try {
                await axios.get(`${config.apiUrl}/api/customers/${customer_id}`);
                orderData.customer_id = customer_id;
              } catch (error) {
                console.warn(`客戶 ID ${customer_id} 不存在，將 customer_id 設為 null`);
                orderData.customer_id = null;
              }
            } else {
              orderData.customer_id = null;
            }
            
            await axios.post(`${config.apiUrl}/api/orders`, orderData, {
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        // 處理POS訂單資料
        if (uploadTypes.includes('posOrders')) {
          console.log('處理POS訂單資料...');
          // 只清空POS相關的訂單
          const existingOrders = await axios.get(`${config.apiUrl}/api/orders/history`);
          const posOrders = existingOrders.data.filter(order => 
            order.source === '現場訂購' || 
            order.created_by === 'pos-system' ||
            order.order_type === 'walk-in'
          );
          for (const order of posOrders) {
            await axios.delete(`${config.apiUrl}/api/orders/${order.id}`);
          }
          console.log(`清空了 ${posOrders.length} 筆POS訂單`);
          
          for (const order of backupData.posOrders) {
            const { id, customer_id, ...orderData } = order;
            
            // POS訂單使用專用端點，避免信用卡費用計算
            const posOrderData = {
              items: orderData.items || [],
              subtotal: orderData.subtotal || 0,
              customer_payment: orderData.customer_payment || 0,
              change: orderData.change || 0,
              payment_method: orderData.payment_method || 'cash',
              created_by: orderData.created_by || 'pos-system'
            };
            
            await axios.post(`${config.apiUrl}/api/shared/pos-orders`, posOrderData, {
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        
        // 重新載入資料
        await fetchCustomers();
        await fetchProducts();
        await fetchOrderHistory(true); // 強制重新載入
        
        setSuccess(`批量上傳成功！包含: ${uploadTypes.join(', ')}`);
      } catch (err) {
        setError('批量上傳失敗: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  const renderCustomerManagement = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>客戶管理</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
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
      </div>
      
      {/* 分離下載功能 */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📥 資料下載</h3>
        
        {/* 下載選項 */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={downloadOptions.customers}
              onChange={(e) => setDownloadOptions(prev => ({ ...prev, customers: e.target.checked }))}
            />
            <span>👥 客戶資料</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={downloadOptions.products}
              onChange={(e) => setDownloadOptions(prev => ({ ...prev, products: e.target.checked }))}
            />
            <span>📦 產品資料</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={downloadOptions.orders}
              onChange={(e) => setDownloadOptions(prev => ({ ...prev, orders: e.target.checked }))}
            />
            <span>📋 訂單資料</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <input
              type="checkbox"
              checked={downloadOptions.posOrders}
              onChange={(e) => setDownloadOptions(prev => ({ ...prev, posOrders: e.target.checked }))}
            />
            <span>🛒 POS銷售訂單</span>
          </label>
        </div>

        {/* 下載按鈕 */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleBatchDownload}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📥 批量下載
          </button>
          
          <button
            onClick={() => handleSeparateDownload('customers')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            👥 客戶
          </button>
          
          <button
            onClick={() => handleSeparateDownload('products')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              color: '#212529',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📦 產品
          </button>
          
          <button
            onClick={() => handleSeparateDownload('orders')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📋 訂單
          </button>
          
          <button
            onClick={() => handleSeparateDownload('posOrders')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fd7e14',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🛒 POS訂單
          </button>
        </div>
      </div>
      
      {/* 分離上傳功能 */}
      <div style={{ 
        backgroundColor: '#fff3cd', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #ffeaa7'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#856404' }}>📤 資料上傳</h3>
        
        {/* 上傳選項 */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={uploadOptions.customers}
              onChange={(e) => setUploadOptions(prev => ({ ...prev, customers: e.target.checked }))}
            />
            <span>👥 客戶資料</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={uploadOptions.products}
              onChange={(e) => setUploadOptions(prev => ({ ...prev, products: e.target.checked }))}
            />
            <span>📦 產品資料</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={uploadOptions.orders}
              onChange={(e) => setUploadOptions(prev => ({ ...prev, orders: e.target.checked }))}
            />
            <span>📋 訂單資料</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <input
              type="checkbox"
              checked={uploadOptions.posOrders}
              onChange={(e) => setUploadOptions(prev => ({ ...prev, posOrders: e.target.checked }))}
            />
            <span>🛒 POS銷售訂單</span>
          </label>
        </div>

        {/* 上傳按鈕 */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleBatchUpload}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fd7e14',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📤 批量上傳
          </button>
          
          <button
            onClick={() => handleSeparateUpload('customers')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            👥 客戶
          </button>
          
          <button
            onClick={() => handleSeparateUpload('products')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              color: '#212529',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📦 產品
          </button>
          
          <button
            onClick={() => handleSeparateUpload('orders')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📋 訂單
          </button>
          
          <button
            onClick={() => handleSeparateUpload('posOrders')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🛒 POS訂單
          </button>
        </div>
        
        <div style={{ 
          marginTop: '10px', 
          fontSize: '12px', 
          color: '#856404',
          backgroundColor: '#fff3cd',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #ffeaa7'
        }}>
          ⚠️ <strong>注意：</strong>上傳會清空現有資料並替換為新資料。請確保已備份重要資料。
        </div>
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
              <label className="form-label">便利商店店名</label>
              <input
                type="text"
                className="form-input"
                value={editCustomerForm.family_mart_address}
                onChange={(e) => setEditCustomerForm({ ...editCustomerForm, family_mart_address: e.target.value })}
                placeholder="請輸入便利商店店名"
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
                          const today = new Date().toISOString().split('T')[0];
                          console.log('🔄 從客戶管理下單，更新日期到:', today);
                          setNewOrder({
                            ...newOrder,
                            customer_id: customer.id,
                            order_date: today,
                            delivery_date: '',      // 不要自動塞今天
                            production_date: ''     // 不要自動塞
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
      if (historyFilters.order_type) params.append('order_type', historyFilters.order_type);
      
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

  // 刪除歷史訂單（根據當前篩選條件）
  const deleteOrderHistory = async () => {
    // 顯示確認視窗
    const confirmMessage = `確定要刪除符合當前篩選條件的所有訂單嗎？\n\n` +
      `此操作無法復原！\n\n` +
      `篩選條件：\n` +
      `${historyFilters.customer_id ? `客戶：${filteredHistoryCustomers.find(c => c.id == historyFilters.customer_id)?.name || '已選客戶'}\n` : ''}` +
      `${historyFilters.order_type ? `訂單類型：${historyFilters.order_type === 'online' ? '網路訂單' : '現場銷售'}\n` : ''}` +
      `${historyFilters.start_date ? `開始日期：${historyFilters.start_date}\n` : ''}` +
      `${historyFilters.end_date ? `結束日期：${historyFilters.end_date}\n` : ''}` +
      `符合條件的訂單數量：${orderHistory.length} 筆\n\n` +
      `請輸入「確認刪除」以繼續：`;
    
    const userInput = prompt(confirmMessage);
    if (userInput !== '確認刪除') {
      alert('已取消刪除操作');
      return;
    }

    // 二次確認
    if (!window.confirm('⚠️ 最後確認：您真的要刪除這些訂單嗎？此操作無法復原！')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // 構建請求參數
      const params = new URLSearchParams();
      if (historyFilters.customer_id) params.append('customer_id', historyFilters.customer_id);
      if (historyFilters.start_date) params.append('start_date', historyFilters.start_date);
      if (historyFilters.end_date) params.append('end_date', historyFilters.end_date);
      if (historyFilters.order_type) params.append('order_type', historyFilters.order_type);
      
      const response = await axios.delete(`${config.apiUrl}/api/orders/history?${params}`);
      
      if (response.data.success) {
        setSuccess(`✅ ${response.data.message}`);
        // 重新載入訂單歷史
        await fetchOrderHistory(true);
        // 3秒後清除成功訊息
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('刪除失敗：' + (response.data.message || '未知錯誤'));
      }
    } catch (error) {
      console.error('刪除歷史訂單錯誤:', error);
      setError('刪除失敗：' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
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
        onClick={() => fetchOrderHistory(true)} // 強制重新載入
        disabled={loading}
      >
        {loading ? '查詢中...' : '🔍 查詢訂單'}
      </button>

      <button 
        className="button" 
        onClick={() => {
          const today = new Date().toISOString().split('T')[0];
          setHistoryFilters({
            customer_id: '',
            start_date: today, // ✅ 清除篩選後，恢復為今天
            end_date: today,   // ✅ 清除篩選後，恢復為今天
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
          <>
          <button 
            className="button" 
            onClick={exportToCSV}
            style={{ backgroundColor: '#27ae60', color: 'white' }}
          >
            📊 匯出 CSV
          </button>
            <button 
              className="button" 
              onClick={deleteOrderHistory}
              disabled={loading}
              style={{ backgroundColor: '#e74c3c', color: 'white' }}
              title="刪除符合當前篩選條件的所有訂單"
            >
              🗑️ 刪除歷史訂單
            </button>
          </>
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
                
                // 確保每個訂單都有唯一的 key
                const orderKey = order.id || `order-${orderIndex}-${order.customer_name || 'unknown'}`;
                
                return (
                  <React.Fragment key={orderKey}>
                    {/* 產品項目 */}
                    {items.map((item, itemIndex) => (
                      <tr key={`${orderKey}-item-${itemIndex}`} style={{ 
                        backgroundColor: orderIndex % 2 === 0 ? 'white' : '#f8f9fa' 
                      }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.customer_name || '未知客戶'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.order_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.delivery_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
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
                            background: order.shipping_status === 'shipped' ? '#27ae60' : '#f39c12',
                  color: 'white',
                  fontSize: '12px'
                }}>
                            {order.shipping_status === 'shipped' ? '已出貨' : '待出貨'}
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
                                onClick={() => handleDeleteOrder(order.id, order.customer_name || '未知客戶', order.order_date)}
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
                      <tr key={`${orderKey}-freeshipping`} style={{ 
                        backgroundColor: '#fff3cd',
                        border: '2px solid #ffc107'
                      }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.customer_name || '未知客戶'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.order_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.delivery_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
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
                          {/* ✅ 免運費行的狀態欄位空白，因為備註欄位已經有說明 */}
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
                      <tr key={`${orderKey}-creditcardfee`} style={{ 
                        backgroundColor: '#fef5e7',
                        border: '2px solid #e67e22'
                      }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.customer_name || '未知客戶'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.order_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.delivery_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
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
                          {/* ✅ 信用卡手續費行的狀態欄位空白，因為備註欄位已經有說明 */}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          信用卡手續費扣除
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          {/* 手續費行不需要編輯按鈕 */}
                        </td>
                      </tr>
                    ) : null}
                    
                    {/* 蝦皮費用項目 */}
                    {order.shopee_fee && order.shopee_fee > 0 ? (
                      <tr key={`${orderKey}-shopeefee`} style={{ 
                        backgroundColor: '#fef2f2',
                        border: '2px solid #e74c3c'
                      }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.customer_name || '未知客戶'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.order_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.delivery_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', color: '#e74c3c' }}>
                          🛒 蝦皮訂單費用
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          1
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                          ${order.shopee_fee}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold', color: '#e74c3c' }}>
                          -${order.shopee_fee}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          {/* ✅ 蝦皮訂單費用行的狀態欄位空白，因為備註欄位已經有說明 */}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          蝦皮訂單費用扣除
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          {/* 手續費行不需要編輯按鈕 */}
                        </td>
                      </tr>
                    ) : null}
                    
                    
                    {/* 無產品的情況 - 已隱藏，避免顯示無意義的 "0" */}
                    {/* {items.length === 0 && !hasFreeShipping && (
                      <tr key={orderKey} style={{ 
                        backgroundColor: orderIndex % 2 === 0 ? 'white' : '#f8f9fa' 
                      }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.customer_name || '未知客戶'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.order_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.delivery_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
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
                    */}
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
                      {date.toLocaleDateString('zh-TW', { 
                        month: 'short', 
                        day: 'numeric', 
                        weekday: 'short',
                        timeZone: 'Asia/Taipei'
                      })}
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
              {shippingOrders.map((order, orderIndex) => {
                // ✅ 檢查製作狀態：改為檢查庫存是否足夠，而不是檢查 production_date
                // 解析訂單項目
                let orderItems = [];
                try {
                  if (Array.isArray(order.items)) {
                    orderItems = order.items;
                  } else if (typeof order.items === 'string') {
                    orderItems = order.items.trim() ? JSON.parse(order.items) : [];
                  }
                } catch (e) {
                  orderItems = [];
                }
                
                // 檢查每個產品的庫存是否足夠
                let hasInsufficientStock = false;
                let insufficientProducts = [];
                
                for (const item of orderItems) {
                  const productName = item.product_name || item.name;
                  const requiredQty = Number(item.quantity) || 0;
                  
                  if (productName && requiredQty > 0) {
                    // 從庫存數據中查找該產品
                    const product = inventoryData.find(p => {
                      const name1 = (p.name || '').trim().toLowerCase().replace(/\s+/g, '');
                      const name2 = (productName || '').trim().toLowerCase().replace(/\s+/g, '');
                      return name1 === name2;
                    });
                    
                    const currentStock = product ? (Number(product.current_stock) || 0) : 0;
                    
                    if (currentStock < requiredQty) {
                      hasInsufficientStock = true;
                      insufficientProducts.push(`${productName}(${currentStock}/${requiredQty})`);
                    }
                  }
                }
                
                // 製作狀態：如果有庫存不足，顯示「庫存不足」，否則顯示「可出貨」
                const productionStatus = hasInsufficientStock ? '庫存不足' : '可出貨';
                const canShip = !hasInsufficientStock;
                
                // 確保每個訂單都有唯一的 key
                const orderKey = order.id || `shipping-order-${orderIndex}-${order.customer_name || 'unknown'}`;
                
                return (
                  <tr key={orderKey}>
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
                      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '16px' }}>{order.customer_name || '未知客戶'}</div>
                      
                      {/* 聯絡電話 - 第三欄 */}
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>📞 {order.phone}</div>
                      
                      {/* 送貨地點 - 第四欄 */}
                      {order.address && (
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>📍 {order.address}</div>
                      )}
                      
                      {/* 便利商店店名 - 第五欄 */}
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
                                <div style={{ textAlign: 'right', fontSize: '16px' }}>
                                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>數量: {item.quantity}</div>
                                  {user?.role === 'admin' && (
                                    <div style={{ fontWeight: 'bold' }}>單價: ${item.unit_price}</div>
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
                        {order.shopee_fee && order.shopee_fee > 0 && (
                          <div style={{ fontSize: '12px', color: '#e74c3c', fontWeight: 'bold' }}>
                            🛒 蝦皮費用扣除: ${order.shopee_fee}
                          </div>
                        )}
                      </td>
                    )}
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        background: canShip ? '#27ae60' : '#e74c3c',
                        color: 'white',
                        fontSize: '12px'
                      }}
                      title={hasInsufficientStock ? `不足：${insufficientProducts.join(', ')}` : ''}
                      >
                        {productionStatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        background: order.shipping_status === 'shipped' ? '#27ae60' : '#e74c3c',
                        color: 'white',
                        fontSize: '12px'
                      }}>
                        {order.shipping_status === 'shipped' ? '已出貨' : '待出貨'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {order.shipping_status === 'shipped' ? (
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
                          onClick={() => handleUpdateShippingStatus(order.id, 'shipped')}
                          disabled={!canShip}
                          style={{
                            backgroundColor: canShip ? '#27ae60' : '#95a5a6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            cursor: canShip ? 'pointer' : 'not-allowed',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>庫存狀態</h3>
          <button
            type="button"
            onClick={handleResetAllStock}
            disabled={loading}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 'bold',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}
            title="將所有產品的庫存設置為0"
          >
            🗑️ 一鍵歸零
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
                        {product.updated_at ? new Date(product.updated_at).toLocaleString('zh-TW') : '-'}
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
                      {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleString('zh-TW') : '-'}
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
          {/* 參數測試功能已移除 */}
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
      {/* 智能排程功能已移除 */}
      {/* 參數測試內容已移除 */}
      {false && (
        <div style={{ padding: '20px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>🧪 智能參數測試與優化</h2>
            <p style={{ margin: '0', opacity: 0.9 }}>
              使用AI演算法優化排程參數，提升系統效率
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* 功能介紹卡片 */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>🎯 測試功能</h3>
              <ul style={{ color: '#666', lineHeight: '1.6' }}>
                <li>多種AI優化演算法</li>
                <li>參數敏感性分析</li>
                <li>績效指標評估</li>
                <li>智能參數推薦</li>
              </ul>
            </div>

            {/* 演算法介紹卡片 */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>🤖 AI演算法</h3>
              <ul style={{ color: '#666', lineHeight: '1.6' }}>
                <li><strong>遺傳算法</strong> - 模擬生物進化</li>
                <li><strong>粒子群優化</strong> - 快速收斂</li>
                <li><strong>模擬退火</strong> - 避免局部最優</li>
                <li><strong>強化學習</strong> - 動態學習</li>
              </ul>
            </div>

            {/* 優化目標卡片 */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>📊 優化目標</h3>
              <ul style={{ color: '#666', lineHeight: '1.6' }}>
                <li>提升訂單完成率</li>
                <li>優化產能利用率</li>
                <li>減少加班時數</li>
                <li>提高客戶滿意度</li>
              </ul>
            </div>
          </div>

          {/* 操作按鈕已移除 */}

          {/* 使用說明 */}
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            marginTop: '20px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>📖 使用說明</h3>
            <ol style={{ color: '#666', lineHeight: '1.8' }}>
              <li><strong>設定測試參數</strong> - 調整日產能、人力數量等基礎參數</li>
              <li><strong>選擇策略參數</strong> - 設定未完成訂單處理方式和新訂單插入策略</li>
              <li><strong>選擇AI演算法</strong> - 根據需求選擇適合的優化演算法</li>
              <li><strong>執行測試</strong> - 系統會生成測試訂單並執行優化</li>
              <li><strong>查看結果</strong> - 分析推薦參數和預期改善效果</li>
              <li><strong>應用參數</strong> - 一鍵應用推薦的參數到實際系統</li>
            </ol>
          </div>
        </div>
      )}
      {activeTab === 'shipping-management' && renderShippingManagement()}
      {activeTab === 'edit-order' && renderEditOrderForm()}
      
      {/* 參數測試彈窗已移除 */}
    </div>
  );
};


export default AdminPanel;
