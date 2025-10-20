import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import InventoryOverview from './InventoryOverview';

const KitchenDashboard = () => {
  const [productionList, setProductionList] = useState([]);
  const [walkinOrders, setWalkinOrders] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [showWeeklyView, setShowWeeklyView] = useState(false);
  const [weeklyData, setWeeklyData] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [inventoryData, setInventoryData] = useState([]);
  const [showWeeklyDetailModal, setShowWeeklyDetailModal] = useState(false);
  const [weeklyDetailData, setWeeklyDetailData] = useState([]);
  const [activeTab, setActiveTab] = useState('preorder'); // 'preorder' | 'walkin' | 'scheduling'
  const [selectedOrders, setSelectedOrders] = useState([]); // 選取的訂單ID陣列
  const [showStatsModal, setShowStatsModal] = useState(false); // 統計視窗顯示狀態
  const [showPriorityModal, setShowPriorityModal] = useState(false); // 優先順序設定模態框
  const [productPriority, setProductPriority] = useState([]); // 產品優先順序設定
  const [schedulingData, setSchedulingData] = useState(null); // 排程數據
  

  const fetchProductionList = async (date) => {
    setLoading(true);
    setError('');
    try {
      // 使用真正的 API 載入製作清單
      const response = await axios.get(`${config.apiUrl}/api/kitchen/production/${date}`);
      setProductionList(response.data);
    } catch (err) {
      setError('載入製作清單失敗: ' + err.message);
      setProductionList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryData = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/inventory`);
      setInventoryData(response.data);
    } catch (err) {
      console.error('載入庫存資料失敗:', err);
      setInventoryData([]);
    }
  };

  const fetchProductPriority = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/products/priority`);
      setProductPriority(response.data);
    } catch (err) {
      console.error('載入產品優先順序失敗:', err);
      setProductPriority([]);
    }
  };

  const fetchSchedulingData = async (date) => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/scheduling/orders?date=${date}`);
      setSchedulingData(response.data);
    } catch (err) {
      console.error('載入排程數據失敗:', err);
      setSchedulingData(null);
    }
  };

  const fetchWalkinOrders = async () => {
    setLoading(true);
    setError('');
    try {
      // 使用新的 API 載入現場訂單列表
      const response = await axios.get(`${config.apiUrl}/api/kitchen/walkin-orders-list`);
      setWalkinOrders(response.data);
    } catch (err) {
      setError('載入現場訂單失敗: ' + err.message);
      setWalkinOrders([]);
    } finally {
      setLoading(false);
    }
  };


  const handleRefresh = () => {
    setLastRefresh(new Date());
    if (activeTab === 'preorder') {
      fetchProductionList(selectedDate);
      if (showWeeklyView) {
        fetchWeeklyData();
      }
    } else if (activeTab === 'walkin') {
      fetchWalkinOrders();
    } else if (activeTab === 'scheduling') {
      fetchSchedulingData(selectedDate);
    }
    fetchInventoryData();
    fetchProductPriority();
  };


  useEffect(() => {
    if (activeTab === 'preorder') {
      fetchProductionList(selectedDate);
    } else if (activeTab === 'walkin') {
      fetchWalkinOrders();
    } else if (activeTab === 'scheduling') {
      fetchSchedulingData(selectedDate);
    }
    fetchInventoryData();
    fetchProductPriority();
  }, [selectedDate, activeTab]);


  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const getDateButtonText = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    
    if (days === 0) return '今天';
    if (days === 1) return '明天';
    if (days === -1) return '昨天';
    
    return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
  };

  const getDateString = (days) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const getTotalQuantity = () => {
    return productionList.reduce((total, item) => total + item.total_quantity, 0);
  };

  const getTotalPendingQuantity = () => {
    return productionList.reduce((total, item) => total + item.pending_quantity, 0);
  };

  const getTotalCompletedQuantity = () => {
    return productionList.reduce((total, item) => total + item.completed_quantity, 0);
  };

  // 現場訂單統計函數
  const getWalkinTotalQuantity = () => {
    return walkinOrders.reduce((total, order) => {
      return total + order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0);
    }, 0);
  };

  // 多選功能處理函數
  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  // 計算選取訂單的產品統計
  const getSelectedOrdersStats = () => {
    const selectedOrdersData = walkinOrders.filter(order => selectedOrders.includes(order.id));
    const productStats = {};
    
    selectedOrdersData.forEach(order => {
      order.items.forEach(item => {
        if (!productStats[item.product_name]) {
          productStats[item.product_name] = 0;
        }
        productStats[item.product_name] += item.quantity;
      });
    });
    
    return Object.entries(productStats).map(([productName, quantity]) => {
      // 查找對應的庫存資料
      const inventoryItem = inventoryData.find(item => item.name === productName);
      const currentStock = inventoryItem ? inventoryItem.current_stock : 0;
      const minStock = inventoryItem ? inventoryItem.min_stock : 0;
      const isLowStock = currentStock <= minStock;
      
      return {
        product_name: productName,
        quantity: quantity,
        current_stock: currentStock,
        min_stock: minStock,
        is_low_stock: isLowStock
      };
    });
  };

  // 清除所有選取
  const clearSelection = () => {
    setSelectedOrders([]);
  };

  const isFullyCompleted = (item) => {
    return item.completed_quantity === item.total_quantity;
  };

  const fetchWeeklyData = async () => {
    try {
      // 從今天開始的未來一週（包含今天）
      const today = new Date(selectedDate);
      const weekdays = [];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        try {
          // 廚房製作清單的週視圖
          const response = await axios.get(`${config.apiUrl}/api/kitchen/production/${dateString}`);
          const totalQuantity = response.data.reduce((sum, item) => sum + item.total_quantity, 0);
          
          weekdays.push({
            date: dateString,
            total_quantity: totalQuantity,
            order_count: 0,
            total_amount: 0
          });
        } catch (err) {
          console.error(`載入 ${dateString} 的數據失敗:`, err);
          weekdays.push({
            date: dateString,
            total_quantity: 0,
            order_count: 0,
            total_amount: 0
          });
        }
      }
      
      setWeeklyData(weekdays);
    } catch (err) {
      console.error('載入週數據失敗:', err);
      setWeeklyData([]);
    }
  };

  const fetchWeeklyDetailData = async () => {
    try {
      const today = new Date(selectedDate);
      
      // 收集一週內所有產品的詳細數據
      const productSummary = {};
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        try {
          const response = await axios.get(`${config.apiUrl}/api/kitchen/production/${dateString}`);
          
          response.data.forEach(item => {
            if (!productSummary[item.product_name]) {
              productSummary[item.product_name] = {
                product_name: item.product_name,
                total_quantity: 0,
                days: []
              };
            }
            productSummary[item.product_name].total_quantity += item.total_quantity;
            productSummary[item.product_name].days.push({
              date: dateString,
              quantity: item.total_quantity
            });
          });
        } catch (err) {
          console.error(`載入 ${dateString} 的詳細數據失敗:`, err);
        }
      }
      
      // 轉換為陣列並排序
      const sortedProducts = Object.values(productSummary)
        .sort((a, b) => b.total_quantity - a.total_quantity);
      
      setWeeklyDetailData(sortedProducts);
    } catch (err) {
      console.error('載入週詳細數據失敗:', err);
      setWeeklyDetailData([]);
    }
  };

  const toggleWeeklyView = () => {
    if (!showWeeklyView) {
      fetchWeeklyData();
    }
    setShowWeeklyView(!showWeeklyView);
  };

  const handleShowWeeklyDetail = async () => {
    await fetchWeeklyDetailData();
    setShowWeeklyDetailModal(true);
  };

  const getInventorySuggestion = (productName, totalQuantity) => {
    const product = inventoryData.find(p => p.name === productName);
    if (!product) return null;

    const currentStock = product.current_stock;
    const weeklyDemand = totalQuantity;
    
    return {
      type: 'info',
      message: `目前庫存：${currentStock} 瓶，週需求：${weeklyDemand} 瓶`,
      color: '#6c757d'
    };
  };

  const getWeekdayName = (dateStr) => {
    const date = new Date(dateStr);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return weekdays[date.getDay()];
  };

  const getQuantityColor = (quantity) => {
    if (quantity === 0) return '#e9ecef'; // 淺灰
    if (quantity <= 5) return '#28a745'; // 綠色
    if (quantity <= 15) return '#ffc107'; // 黃色
    return '#dc3545'; // 紅色
  };

  const handleStatusUpdate = async (productName, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [productName]: true }));
    
    try {
      await axios.put(`${config.apiUrl}/api/kitchen/production/${selectedDate}/${encodeURIComponent(productName)}/status`, {
        status: newStatus
      });
      
      // 重新載入製作清單
      await fetchProductionList(selectedDate);
    } catch (err) {
      setError('更新狀態失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [productName]: false }));
    }
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>廚房工作台</h2>
          <button 
            onClick={handleRefresh}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            title={`最後更新: ${lastRefresh.toLocaleTimeString()}`}
          >
            🔄 刷新數據
          </button>
        </div>
        
        {/* 標籤切換器 */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '20px',
          borderBottom: '2px solid #e9ecef'
        }}>
          <button
            onClick={() => setActiveTab('preorder')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'preorder' ? '#3498db' : '#f8f9fa',
              color: activeTab === 'preorder' ? 'white' : '#6c757d',
              border: 'none',
              borderBottom: activeTab === 'preorder' ? '3px solid #2980b9' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              borderRadius: '8px 8px 0 0',
              transition: 'all 0.3s ease'
            }}
          >
            📦 預訂訂單
          </button>
          <button
            onClick={() => setActiveTab('walkin')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'walkin' ? '#e74c3c' : '#f8f9fa',
              color: activeTab === 'walkin' ? 'white' : '#6c757d',
              border: 'none',
              borderBottom: activeTab === 'walkin' ? '3px solid #c0392b' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              borderRadius: '8px 8px 0 0',
              transition: 'all 0.3s ease'
            }}
          >
            🏪 現場訂單
          </button>
          {process.env.REACT_APP_HIDE_SCHEDULING === 'true' ? null : (
            <button
              onClick={() => setActiveTab('scheduling')}
              style={{
                padding: '12px 24px',
                backgroundColor: activeTab === 'scheduling' ? '#9b59b6' : '#f8f9fa',
                color: activeTab === 'scheduling' ? 'white' : '#6c757d',
                border: 'none',
                borderBottom: activeTab === 'scheduling' ? '3px solid #8e44ad' : '3px solid transparent',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                borderRadius: '8px 8px 0 0',
                transition: 'all 0.3s ease'
              }}
            >
              🧠 排單系統
            </button>
          )}
        </div>
        
        
        {/* 日期選擇器 - 只在預訂訂單標籤中顯示 */}
        {activeTab === 'preorder' && (
        <div className="date-selector">
          <button 
            className={`date-button ${selectedDate === getDateString(-1) ? 'active' : ''}`}
            onClick={() => handleDateChange(getDateString(-1))}
          >
            {getDateButtonText(-1)}
          </button>
          <button 
            className={`date-button ${selectedDate === getDateString(0) ? 'active' : ''}`}
            onClick={() => handleDateChange(getDateString(0))}
          >
            {getDateButtonText(0)}
          </button>
          <button 
            className={`date-button ${selectedDate === getDateString(1) ? 'active' : ''}`}
            onClick={() => handleDateChange(getDateString(1))}
          >
            {getDateButtonText(1)}
          </button>
          <input
            type="date"
            className="date-input"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
          />
          <button
            className={`date-button ${showWeeklyView ? 'active' : ''}`}
            onClick={toggleWeeklyView}
            style={{
              padding: '8px 16px',
              backgroundColor: showWeeklyView ? '#3498db' : '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginLeft: '10px'
            }}
          >
            一週
          </button>
            </div>
          )}

        {/* 庫存狀態概覽 - 共用組件 */}
        <InventoryOverview inventoryData={inventoryData} />

        {error && <div className="error">{error}</div>}

        {/* 廚房製作清單內容 */}
        {activeTab === 'preorder' && showWeeklyView && (
          <div style={{
            marginBottom: '20px',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '12px',
            border: '2px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>未來一週製作概覽</h3>
              <button
                onClick={handleShowWeeklyDetail}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                📊 查看詳情
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '10px',
              maxWidth: '600px'
            }}>
              {weeklyData.map((dayData, index) => (
                <div
                  key={index}
                  onClick={() => {
                    handleDateChange(dayData.date);
                    setShowWeeklyView(false);
                  }}
                  style={{
                    background: getQuantityColor(dayData.total_quantity),
                    color: dayData.total_quantity === 0 ? '#6c757d' : 'white',
                    padding: '15px 10px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: selectedDate === dayData.date ? '3px solid #3498db' : '2px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                    {dayData.total_quantity}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    {getWeekdayName(dayData.date)}
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                    {dayData.date.split('-')[1]}/{dayData.date.split('-')[2]}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#e9ecef', borderRadius: '3px' }}></div>
                  <span>無製作</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#28a745', borderRadius: '3px' }}></div>
                  <span>1-5 瓶</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#ffc107', borderRadius: '3px' }}></div>
                  <span>6-15 瓶</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#dc3545', borderRadius: '3px' }}></div>
                  <span>16+ 瓶</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">載入中...</div>
        ) : (
          <>
            {/* 預訂訂單內容 */}
            {activeTab === 'preorder' && productionList.length > 0 && (
              <>
                <div style={{ marginBottom: '20px', padding: '15px', background: '#e8f4fd', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ fontSize: '18px' }}>總計: {getTotalQuantity()} 瓶</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '14px' }}>
                      <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                        待製作: {getTotalPendingQuantity()} 瓶
                      </span>
                      <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                        已完成: {getTotalCompletedQuantity()} 瓶
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
                    {new Date(selectedDate).toLocaleDateString('zh-TW', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </div>
                </div>
                
                <div className="production-list">
                  {productionList.map((item, index) => (
                    <div 
                      key={index} 
                      className="production-item"
                      style={{
                        border: isFullyCompleted(item) ? '3px solid #28a745' : '1px solid #dee2e6',
                        backgroundColor: isFullyCompleted(item) ? '#f8fff9' : 'white',
                        boxShadow: isFullyCompleted(item) ? '0 4px 8px rgba(40, 167, 69, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div className="product-info">
                        <div className="product-name">
                          {isFullyCompleted(item) && (
                            <span style={{ color: '#28a745', marginRight: '8px', fontSize: '18px' }}>
                              ✅
                            </span>
                          )}
                          {item.is_gift ? (
                            <span style={{ color: '#e67e22', fontWeight: 'bold' }}>
                              🎁 {item.product_name} (贈送)
                            </span>
                          ) : (
                            item.product_name
                          )}
                        </div>
                        <div className="quantity-display">
                          <span className="total-quantity">{item.total_quantity} 瓶</span>
                        </div>
                      </div>
                      <div className="status-columns">
                        <div className="status-column">
                          <div className="status-label">待製作</div>
                          <div 
                            className="status-value"
                            style={{
                              backgroundColor: item.pending_quantity > 0 ? '#dc3545' : '#e9ecef',
                              color: item.pending_quantity > 0 ? 'white' : '#6c757d',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              textAlign: 'center',
                              minWidth: '80px',
                              border: item.pending_quantity > 0 ? '2px solid #c82333' : 'none'
                            }}
                          >
                            {item.pending_quantity}
                          </div>
                        </div>
                        <div className="status-column">
                          <div className="status-label">已完成</div>
                          <div 
                            className="status-value"
                            style={{
                              backgroundColor: item.completed_quantity > 0 ? '#28a745' : '#e9ecef',
                              color: item.completed_quantity > 0 ? 'white' : '#6c757d',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              textAlign: 'center',
                              minWidth: '80px',
                              border: item.completed_quantity > 0 ? '2px solid #1e7e34' : 'none'
                            }}
                          >
                            {item.completed_quantity}
                          </div>
                        </div>
                        <div className="action-column">
                          {!isFullyCompleted(item) && (
                            <button
                              className="complete-button"
                              onClick={() => handleStatusUpdate(item.product_name, 'completed')}
                              disabled={updatingStatus[item.product_name]}
                              style={{
                                padding: '10px 20px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: updatingStatus[item.product_name] ? 'not-allowed' : 'pointer',
                                opacity: updatingStatus[item.product_name] ? 0.6 : 1,
                                fontWeight: 'bold',
                                fontSize: '14px'
                              }}
                            >
                              {updatingStatus[item.product_name] ? '更新中...' : '標記完成'}
                            </button>
                          )}
                          {isFullyCompleted(item) && (
                            <button
                              className="reset-button"
                              onClick={() => handleStatusUpdate(item.product_name, 'pending')}
                              disabled={updatingStatus[item.product_name]}
                              style={{
                                padding: '10px 20px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: updatingStatus[item.product_name] ? 'not-allowed' : 'pointer',
                                opacity: updatingStatus[item.product_name] ? 0.6 : 1,
                                fontWeight: 'bold',
                                fontSize: '14px'
                              }}
                            >
                              {updatingStatus[item.product_name] ? '更新中...' : '重新製作'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 現場訂單內容 */}
            {activeTab === 'walkin' && walkinOrders.length > 0 && (
              <>
                <div style={{ marginBottom: '20px', padding: '15px', background: '#ffeaa7', borderRadius: '8px', border: '2px solid #fdcb6e' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ fontSize: '18px', color: '#d63031' }}>🚨 現場訂單總計: {getWalkinTotalQuantity()} 瓶</strong>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
                    {new Date().toLocaleDateString('zh-TW', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'long'
                    })} - 即時更新
                  </div>
                </div>
                
                {/* 選取控制按鈕 */}
                {selectedOrders.length > 0 && (
                  <div style={{ 
                    marginBottom: '20px', 
                    padding: '15px', 
                    background: '#e3f2fd', 
                    borderRadius: '8px', 
                    border: '2px solid #2196f3',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong style={{ fontSize: '16px', color: '#1976d2' }}>
                        已選取 {selectedOrders.length} 張訂單
                      </strong>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setShowStatsModal(true)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#4caf50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        統計選取訂單
                      </button>
                      <button
                        onClick={clearSelection}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        清除選取
                      </button>
                    </div>
                  </div>
                )}

                <div className="walkin-orders-grid">
                  {walkinOrders.map((order) => {
                    const isSelected = selectedOrders.includes(order.id);
                    return (
                      <div 
                        key={order.id} 
                        className="walkin-order-card"
                        style={{
                          border: isSelected ? '3px solid #4caf50' : '2px solid #e9ecef',
                          backgroundColor: isSelected ? '#f1f8e9' : '#f8f9fa',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                        onClick={() => toggleOrderSelection(order.id)}
                      >
                        {/* 選取指示器 */}
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: '#4caf50',
                            color: 'white',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            ✓
                          </div>
                        )}
                        
                        <div className="order-header">
                          <div className="order-number">訂單 #{order.id}</div>
                          <div className="order-time">
                            {order.order_time ? 
                              new Date(order.order_time).toLocaleTimeString('zh-TW', {
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Asia/Taipei'
                              }) + ' 下單' : 
                              '時間未知'
                            }
                          </div>
                        </div>
                        <div className="order-items">
                          {order.items.map((item, index) => (
                            <div key={index} className="order-item">
                              <div className="item-name">
                                {item.is_gift ? (
                                  <span style={{ color: '#e67e22', fontWeight: 'bold' }}>
                                    🎁 {item.product_name}
                                  </span>
                                ) : (
                                  item.product_name
                                )}
                              </div>
                              <div className="item-quantity">{item.quantity} 瓶</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* 排單系統內容 */}
            {activeTab === 'scheduling' && (
              <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '12px', border: '2px solid #9b59b6' }}>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '24px' }}>
                    🧠 智能排單系統
                  </h3>
                  <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
                    整合現場訂單和網路訂單，根據產品優先順序和先進先出原則，生成最優製作排程
                  </p>
                </div>

                {/* 排單控制面板 */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                  gap: '20px',
                  marginBottom: '30px'
                }}>
                  {/* 產品優先順序設定 */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '2px solid #e9ecef',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '18px' }}>
                      ⚙️ 產品優先順序設定
                    </h4>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                      設定產品製作優先順序，數字越小優先級越高
                    </p>
                    <button
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#9b59b6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        width: '100%'
                      }}
                      onClick={() => {
                        setShowPriorityModal(true);
                      }}
                    >
                      🔧 設定優先順序
                    </button>
                  </div>

                  {/* 排程生成 */}
                  <div style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    border: '2px solid #e9ecef',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '18px' }}>
                      🎯 智能排程生成
                    </h4>
                    <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                      根據指定日期的訂單和優先順序，生成最優製作排程
                    </p>
                    
                    {/* 日期選擇器 */}
                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#2c3e50' }}>
                        選擇日期：
                      </label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        style={{
                          padding: '8px 12px',
                          border: '2px solid #e9ecef',
                          borderRadius: '6px',
                          fontSize: '14px',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    
                    <button
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        width: '100%'
                      }}
                      onClick={() => {
                        fetchSchedulingData(selectedDate);
                      }}
                    >
                      🚀 生成排程
                    </button>
                  </div>
                </div>

                {/* 排程顯示區域 */}
                <div style={{
                  padding: '20px',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  border: '2px solid #e9ecef',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}>
                  <h4 style={{ margin: '0 0 15px 0', color: '#2c3e50', fontSize: '18px' }}>
                    📋 當前排程
                  </h4>
                  {schedulingData ? (
                    <div>
                      {/* 排程摘要 */}
                      <div style={{ 
                        marginBottom: '20px', 
                        padding: '15px', 
                        backgroundColor: '#e8f4fd', 
                        borderRadius: '8px',
                        border: '1px solid #b3d9ff'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '18px', color: '#2c3e50' }}>
                              📊 排程摘要
                            </strong>
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            {schedulingData.date || '今日'}
                          </div>
                        </div>
                        <div style={{ marginTop: '10px', display: 'flex', gap: '20px', fontSize: '14px' }}>
                          <span>總產量: <strong>{schedulingData.summary?.total_bottles || 0}瓶</strong></span>
                          <span>產品種類: <strong>{schedulingData.orders?.length || 0}</strong></span>
                        </div>
                      </div>

                      {/* 排程列表 */}
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {schedulingData.orders && schedulingData.orders.length > 0 ? schedulingData.orders.map((product, index) => (
                          <div key={index} style={{
                            marginBottom: '15px',
                            padding: '15px',
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            border: '2px solid #e9ecef',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{
                                  backgroundColor: '#9b59b6',
                                  color: 'white',
                                  padding: '4px 8px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  優先級 {product.priority}
                                </span>
                                <h5 style={{ margin: '0', fontSize: '16px', color: '#2c3e50' }}>
                                  {product.product_name}
                                </h5>
                              </div>
                              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3498db' }}>
                                {product.quantity} 瓶
                              </div>
                            </div>
                            
                            {/* 生產詳情 */}
                            <div style={{ fontSize: '14px', color: '#666' }}>
                              <div style={{ marginBottom: '8px' }}>
                                <strong>生產詳情:</strong>
                              </div>
                              <div style={{
                                padding: '10px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px',
                                marginBottom: '5px'
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                  <span><strong>原因:</strong> {product.reason}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                  <span><strong>預估時間:</strong> {product.estimated_time}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span><strong>優先級:</strong> {product.priority}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div style={{ 
                            padding: '20px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '8px',
                            textAlign: 'center',
                            color: '#666'
                          }}>
                            <p style={{ fontSize: '16px', margin: '0' }}>
                              📋 今日無排程項目
                            </p>
                            <p style={{ fontSize: '14px', margin: '10px 0 0 0' }}>
                              所有產品庫存充足，無需額外生產
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '20px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '8px',
                      textAlign: 'center',
                      color: '#666'
                    }}>
                      <p style={{ fontSize: '16px', margin: '0' }}>
                        📋 點擊「生成排程」查看智能排程
                      </p>
                      <p style={{ fontSize: '14px', margin: '10px 0 0 0' }}>
                        系統將根據產品優先順序和先進先出原則生成最優排程
                      </p>
                    </div>
                  )}
                </div>

                {/* 功能說明 */}
                <div style={{ 
                  marginTop: '20px', 
                  padding: '15px', 
                  backgroundColor: '#e8f4fd', 
                  borderRadius: '8px',
                  border: '1px solid #b3d9ff'
                }}>
                  <h5 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>💡 排單系統功能說明</h5>
                  <ul style={{ margin: '0', paddingLeft: '20px', color: '#666', fontSize: '14px' }}>
                    <li>整合現場訂單和網路訂單，統一管理</li>
                    <li>根據產品優先順序自動排序（可自定義）</li>
                    <li>先進先出原則，確保公平性</li>
                    <li>考慮庫存狀態，優化製作效率</li>
                    <li>實時更新排程，適應訂單變化</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 無訂單時的顯示 */}
            {((activeTab === 'preorder' && productionList.length === 0) || 
              (activeTab === 'walkin' && walkinOrders.length === 0)) && (
              <div className="loading">
                {activeTab === 'preorder' ? '當日無製作項目' : '目前無現場訂單'}
              </div>
            )}
          </>
        )}

      </div>

      <div className="card">
        <h2>使用說明</h2>
        <div style={{ lineHeight: '1.6', color: '#666' }}>
          <p><strong>📦 預訂訂單：</strong>顯示當日需要製作的所有產品總數量，廚房員工只需專注於製作數量</p>
          <p><strong>🏪 現場訂單：</strong>顯示即時現場訂單，支援多選統計功能</p>
          <p><strong>🧠 排單系統：</strong>整合所有訂單，根據產品優先順序和先進先出原則生成最優排程</p>
          <p>• 可以切換日期查看不同日期的製作需求</p>
          <p>• 完成製作後，點擊「標記完成」按鈕更新產品狀態</p>
          <p>• 狀態會自動同步到「客戶訂單」頁面</p>
          <p>• 排單系統支援自定義產品優先順序，優化製作效率</p>
        </div>
      </div>

      {/* 週概覽詳細視窗 */}
      {showWeeklyDetailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#2c3e50' }}>📊 一週製作明細</h2>
              <button
                onClick={() => setShowWeeklyDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ✕
              </button>
            </div>

            {weeklyDetailData.length > 0 ? (
              <>
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '8px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
                    總計：{weeklyDetailData.reduce((sum, item) => sum + item.total_quantity, 0)} 瓶
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    一週期間：{new Date(selectedDate).toLocaleDateString('zh-TW')} ~ {new Date(new Date(selectedDate).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-TW')}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>產品明細</h3>
                  {weeklyDetailData.map((product, index) => {
                    const percentage = ((product.total_quantity / weeklyDetailData.reduce((sum, item) => sum + item.total_quantity, 0)) * 100).toFixed(1);
                    const suggestion = getInventorySuggestion(product.product_name, product.total_quantity);
                    
                    return (
                      <div
                        key={index}
                        style={{
                          marginBottom: '15px',
                          padding: '15px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px',
                          border: '1px solid #dee2e6'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2c3e50' }}>
                            {product.product_name}
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3498db' }}>
                            {product.total_quantity} 瓶 ({percentage}%)
                          </div>
                        </div>
                        
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ 
                            width: '100%', 
                            height: '8px', 
                            backgroundColor: '#e9ecef', 
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${percentage}%`,
                              height: '100%',
                              backgroundColor: '#3498db',
                              transition: 'width 0.3s ease'
                            }}></div>
                          </div>
                        </div>

                        {suggestion && (
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#495057',
                            fontWeight: 'normal'
                          }}>
                            📦 {suggestion.message}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>庫存資訊說明</h3>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    • 顯示目前庫存數量和一週需求量<br/>
                    • 廚房人員可根據實際情況自行判斷是否需要增加庫存<br/>
                    • 建議在需求量大的產品上多做準備
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                載入詳細數據中...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 統計視窗模態框 */}
      {showStatsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e9ecef'
            }}>
              <h2 style={{ 
                margin: 0, 
                color: '#2c3e50',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                選取訂單產品統計
              </h2>
              <button
                onClick={() => setShowStatsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#7f8c8d',
                  padding: '5px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                padding: '10px 15px',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <strong style={{ color: '#1976d2' }}>
                  已選取 {selectedOrders.length} 張訂單
                </strong>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                color: '#2c3e50',
                fontSize: '18px'
              }}>
                產品統計：
              </h3>
              {getSelectedOrdersStats().map((stat, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 15px',
                  marginBottom: '8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    flex: 1
                  }}>
                    {stat.product_name}
                  </span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#3498db',
                    backgroundColor: '#e3f2fd',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    minWidth: '60px',
                    textAlign: 'center',
                    margin: '0 15px'
                  }}>
                    {stat.quantity} 瓶
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: stat.is_low_stock ? '#e74c3c' : '#666',
                    minWidth: '100px',
                    textAlign: 'right'
                  }}>
                    庫存: {stat.current_stock} 瓶{stat.is_low_stock ? ' ⚠️' : ''}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              paddingTop: '20px',
              borderTop: '2px solid #e9ecef'
            }}>
              <button
                onClick={() => setShowStatsModal(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                關閉
              </button>
              <button
                onClick={() => {
                  setShowStatsModal(false);
                  clearSelection();
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                關閉並清除選取
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 產品優先順序設定模態框 */}
      {showPriorityModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e9ecef'
            }}>
              <h2 style={{ 
                margin: 0, 
                color: '#2c3e50',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                ⚙️ 產品優先順序設定
              </h2>
              <button
                onClick={() => setShowPriorityModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#7f8c8d',
                  padding: '5px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
                設定產品製作優先順序，數字越小優先級越高。拖拽可調整順序。
              </p>
              <button
                onClick={() => {
                  const sortedPriority = [...productPriority].sort((a, b) => a.priority - b.priority);
                  setProductPriority(sortedPriority);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  marginBottom: '10px'
                }}
              >
                🔄 自動排序（優先順序1置頂）
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              {productPriority.map((product, index) => (
                <div key={product.product_id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  padding: '12px 15px',
                  marginBottom: '8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{
                    backgroundColor: '#9b59b6',
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    minWidth: '60px',
                    textAlign: 'center'
                  }}>
                    {product.priority}
                  </div>
                  <div style={{ flex: 1, fontSize: '16px', fontWeight: '500' }}>
                    {product.product_name}
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      onClick={() => {
                        if (product.priority > 1) {
                          const newPriority = [...productPriority];
                          const currentIndex = newPriority.findIndex(p => p.product_id === product.product_id);
                          const swapIndex = newPriority.findIndex(p => p.priority === product.priority - 1);
                          
                          if (currentIndex !== -1 && swapIndex !== -1) {
                            [newPriority[currentIndex].priority, newPriority[swapIndex].priority] = 
                            [newPriority[swapIndex].priority, newPriority[currentIndex].priority];
                            setProductPriority(newPriority);
                          }
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => {
                        if (product.priority < productPriority.length) {
                          const newPriority = [...productPriority];
                          const currentIndex = newPriority.findIndex(p => p.product_id === product.product_id);
                          const swapIndex = newPriority.findIndex(p => p.priority === product.priority + 1);
                          
                          if (currentIndex !== -1 && swapIndex !== -1) {
                            [newPriority[currentIndex].priority, newPriority[swapIndex].priority] = 
                            [newPriority[swapIndex].priority, newPriority[currentIndex].priority];
                            setProductPriority(newPriority);
                          }
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              paddingTop: '20px',
              borderTop: '2px solid #e9ecef'
            }}>
              <button
                onClick={() => setShowPriorityModal(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                取消
              </button>
              <button
                onClick={async () => {
                  try {
                    // 自動重新排序：優先順序1置頂
                    const sortedPriority = [...productPriority].sort((a, b) => a.priority - b.priority);
                    
                    await axios.put(`${config.apiUrl}/api/products/priority`, {
                      priority_settings: sortedPriority
                    });
                    
                    // 重新載入優先順序設定
                    await fetchProductPriority();
                    
                    setShowPriorityModal(false);
                    alert('產品優先順序更新成功！已自動排序。');
                  } catch (error) {
                    alert('更新失敗: ' + error.message);
                  }
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                儲存設定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;
