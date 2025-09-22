import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getLocalData, saveLocalData, generateId } from '../utils/localStorage';
import config from '../config';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('new-order');
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
    items: [{ product_name: '', quantity: 1, unit_price: 0, special_notes: '' }]
  });

  // 新增客戶表單狀態
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: '',
    source: '一般客戶'
  });

  // 訂單歷史查詢狀態
  const [orderHistory, setOrderHistory] = useState([]);
  const [historyFilters, setHistoryFilters] = useState({
    customer_id: '',
    start_date: '',
    end_date: ''
  });

  // 客戶搜尋狀態
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSourceFilter, setCustomerSourceFilter] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);

  // 編輯客戶狀態
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editCustomerForm, setEditCustomerForm] = useState({
    name: '',
    phone: '',
    address: '',
    source: '一般客戶'
  });

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  // 當切換到新增訂單頁面時，重新載入客戶列表
  useEffect(() => {
    if (activeTab === 'new-order') {
      fetchCustomers();
    }
  }, [activeTab]);

  const fetchCustomers = async () => {
    try {
      if (config.useLocalStorage) {
        // 使用本地存儲數據
        const data = getLocalData();
        setCustomers(data.customers);
        setFilteredCustomers(data.customers);
      } else {
        // 使用 API
        const response = await axios.get(`${config.apiUrl}/api/customers`);
        setCustomers(response.data);
        setFilteredCustomers(response.data);
      }
    } catch (err) {
      setError('載入客戶列表失敗: ' + err.message);
      setCustomers([]);
      setFilteredCustomers([]);
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

  const fetchProducts = async () => {
    try {
      // 使用本地存儲數據
      const data = getLocalData();
      setProducts(data.products);
    } catch (err) {
      setError('載入產品列表失敗: ' + err.message);
      setProducts([]);
    }
  };

  // 開始編輯客戶
  const startEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setEditCustomerForm({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      source: customer.source || '一般客戶'
    });
  };

  // 取消編輯客戶
  const cancelEditCustomer = () => {
    setEditingCustomer(null);
    setEditCustomerForm({
      name: '',
      phone: '',
      address: '',
      source: '一般客戶'
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

      // 使用本地存儲保存數據
      const data = getLocalData();
      const customerIndex = data.customers.findIndex(c => c.id === editingCustomer.id);
      if (customerIndex !== -1) {
        data.customers[customerIndex] = { ...data.customers[customerIndex], ...editCustomerForm };
        saveLocalData(data);
        setSuccess('客戶更新成功！');
      } else {
        throw new Error('找不到要更新的客戶');
      }
      
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
      // 使用本地存儲刪除數據
      const data = getLocalData();
      data.customers = data.customers.filter(c => c.id !== customerId);
      // 同時刪除相關的訂單
      data.orders = data.orders.filter(o => o.customer_id !== customerId);
      data.order_items = data.order_items.filter(item => 
        !data.orders.some(order => order.id === item.order_id && order.customer_id === customerId)
      );
      saveLocalData(data);
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
      // 使用本地存儲數據
      const data = getLocalData();
      
      // 生成訂單歷史資料
      const orderHistory = data.orders.map(order => ({
        ...order,
        customer_name: data.customers.find(c => c.id === order.customer_id)?.name || '未知客戶',
        items: data.order_items.filter(item => item.order_id === order.id)
      }));
      
      setOrderHistory(orderHistory);
    } catch (err) {
      setError('載入訂單歷史失敗: ' + err.message);
      setOrderHistory([]);
    } finally {
      setLoading(false);
    }
  };

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

      // 使用本地存儲保存訂單
      const data = getLocalData();
      const orderId = generateId(data, 'orders');
      
      // 新增訂單
      const order = {
        id: orderId,
        customer_id: parseInt(newOrder.customer_id),
        order_date: newOrder.order_date,
        delivery_date: newOrder.delivery_date,
        status: 'pending',
        notes: newOrder.notes
      };
      data.orders.push(order);
      
      // 新增訂單項目
      newOrder.items.forEach((item, index) => {
        if (item.product_name && item.quantity > 0) {
          const orderItem = {
            id: generateId(data, 'order_items'),
            order_id: orderId,
            product_name: item.product_name,
            quantity: parseInt(item.quantity),
            unit_price: parseFloat(item.unit_price),
            special_notes: item.special_notes,
            status: 'pending'
          };
          data.order_items.push(orderItem);
        }
      });
      
      saveLocalData(data);
      setSuccess('訂單建立成功！');
      
      // 重置表單
      setNewOrder({
        customer_id: '',
        order_date: new Date().toISOString().split('T')[0],
        delivery_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [{ product_name: '', quantity: 1, unit_price: 0, special_notes: '' }]
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

      // 使用本地存儲保存客戶
      const data = getLocalData();
      const customer = {
        id: generateId(data, 'customers'),
        name: newCustomer.name.trim(),
        phone: newCustomer.phone.trim(),
        address: newCustomer.address.trim(),
        source: newCustomer.source
      };
      data.customers.push(customer);
      saveLocalData(data);
      setSuccess('客戶新增成功！');
      
      // 重置表單並重新載入客戶列表
      setNewCustomer({ name: '', phone: '', address: '', source: '一般客戶' });
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

  const addOrderItem = () => {
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, { product_name: '', quantity: 1, unit_price: 0, special_notes: '' }]
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
          {newOrder.items.map((item, index) => (
            <div key={index} className="item-row">
              <select
                className="form-input"
                value={item.product_name}
                onChange={(e) => {
                  const selectedProduct = products.find(p => p.name === e.target.value);
                  updateOrderItem(index, 'product_name', e.target.value);
                  if (selectedProduct) {
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
                min="0"
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
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '8px 12px',
                background: '#f8f9fa',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#e74c3c',
                minWidth: '100px',
                justifyContent: 'center'
              }}>
                小計: NT$ {(item.quantity * item.unit_price).toLocaleString()}
              </div>
              {newOrder.items.length > 1 && (
                <button
                  type="button"
                  className="remove-item-button"
                  onClick={() => removeOrderItem(index)}
                >
                  移除
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="add-item-button"
            onClick={addOrderItem}
          >
            + 新增產品
          </button>
          
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
          <label className="form-label">地址</label>
          <textarea
            className="form-textarea"
            value={newCustomer.address}
            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
            placeholder="請輸入地址"
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
            <option value="一般客戶">一般客戶</option>
            <option value="蝦皮">蝦皮</option>
            <option value="IG">IG</option>
            <option value="FB">FB</option>
          </select>
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

  const renderCustomerManagement = () => (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>客戶管理</h2>
        <button 
          className="button success"
          onClick={() => setActiveTab('new-customer')}
          style={{ padding: '10px 20px', fontSize: '16px' }}
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
              <label className="form-label">地址</label>
              <textarea
                className="form-textarea"
                value={editCustomerForm.address}
                onChange={(e) => setEditCustomerForm({ ...editCustomerForm, address: e.target.value })}
                placeholder="請輸入地址"
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
                <option value="一般客戶">一般客戶</option>
                <option value="蝦皮">蝦皮</option>
                <option value="IG">IG</option>
                <option value="FB">FB</option>
              </select>
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
              <option value="一般客戶">一般客戶</option>
              <option value="蝦皮">蝦皮</option>
              <option value="IG">IG</option>
              <option value="FB">FB</option>
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
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>客戶姓名</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>聯絡電話</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>地址</th>
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>來源</th>
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>建立時間</th>
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '15px', fontWeight: '500' }}>{customer.name}</td>
                  <td style={{ padding: '15px' }}>{customer.phone || '-'}</td>
                  <td style={{ padding: '15px', color: '#666' }}>{customer.address || '-'}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: customer.source === '蝦皮' ? '#ff6b35' : 
                                     customer.source === 'IG' ? '#e1306c' :
                                     customer.source === 'FB' ? '#1877f2' : '#27ae60',
                      color: 'white'
                    }}>
                      {customer.source || '一般客戶'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
                    {new Date(customer.created_at).toLocaleDateString('zh-TW')}
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

  const renderOrderHistory = () => (
    <div className="card">
      <h2>訂單歷史查詢</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div className="form-group">
          <label className="form-label">客戶</label>
          <select
            className="form-select"
            value={historyFilters.customer_id}
            onChange={(e) => setHistoryFilters({ ...historyFilters, customer_id: e.target.value })}
          >
            <option value="">全部客戶</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
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

      <button 
        className="button" 
        onClick={fetchOrderHistory}
        disabled={loading}
        style={{ marginBottom: '20px' }}
      >
        {loading ? '查詢中...' : '查詢訂單'}
      </button>

      {orderHistory.length > 0 && (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {orderHistory.map((order, index) => (
            <div key={index} style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '15px', 
              marginBottom: '10px',
              background: '#f9f9f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <strong>訂單 #{order.id}</strong>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  background: order.status === 'completed' ? '#27ae60' : '#f39c12',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  {order.status === 'completed' ? '已完成' : '進行中'}
                </span>
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                <div>客戶: {order.customer_name} ({order.phone})</div>
                <div>訂單日期: {new Date(order.order_date).toLocaleDateString('zh-TW')}</div>
                <div>交貨日期: {new Date(order.delivery_date).toLocaleDateString('zh-TW')}</div>
                {order.notes && <div>備註: {order.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button 
            className={`nav-button ${activeTab === 'new-order' ? 'active' : ''}`}
            onClick={() => setActiveTab('new-order')}
          >
            新增訂單
          </button>
          <button 
            className={`nav-button ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            客戶管理
          </button>
          <button 
            className={`nav-button ${activeTab === 'new-customer' ? 'active' : ''}`}
            onClick={() => setActiveTab('new-customer')}
            style={{ backgroundColor: activeTab === 'new-customer' ? '#e74c3c' : '#3498db', color: 'white' }}
          >
            ➕ 新增客戶
          </button>
          <button 
            className={`nav-button ${activeTab === 'order-history' ? 'active' : ''}`}
            onClick={() => setActiveTab('order-history')}
          >
            訂單歷史
          </button>
        </div>
      </div>

      {activeTab === 'new-order' && renderNewOrderForm()}
      {activeTab === 'customers' && renderCustomerManagement()}
      {activeTab === 'new-customer' && renderNewCustomerForm()}
      {activeTab === 'order-history' && renderOrderHistory()}
    </div>
  );
};

export default AdminPanel;
