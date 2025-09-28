import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const KitchenDashboard = () => {
  const [productionList, setProductionList] = useState([]);
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


  const handleRefresh = () => {
    setLastRefresh(new Date());
    fetchProductionList(selectedDate);
    fetchInventoryData();
    if (showWeeklyView) {
      fetchWeeklyData();
    }
  };


  useEffect(() => {
    fetchProductionList(selectedDate);
    fetchInventoryData();
  }, [selectedDate]);


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
        
        
        {/* 標籤切換 */}
        
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

        {/* 庫存狀態概覽 */}
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>📦 庫存狀態概覽</h3>
          {inventoryData.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px'
            }}>
              {inventoryData.map((product) => {
                const isLowStock = product.current_stock <= product.min_stock;
                return (
                  <div
                    key={product.id}
                    style={{
                      padding: '12px',
                      borderRadius: '6px',
                      backgroundColor: isLowStock ? '#fff5f5' : '#f0fff4',
                      border: `2px solid ${isLowStock ? '#e74c3c' : '#27ae60'}`,
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ 
                      fontWeight: 'bold', 
                      marginBottom: '5px',
                      color: isLowStock ? '#e74c3c' : '#27ae60'
                    }}>
                      {product.name}
                    </div>
                    <div style={{ 
                      fontSize: '18px', 
                      fontWeight: 'bold',
                      color: isLowStock ? '#e74c3c' : '#27ae60'
                    }}>
                      {product.current_stock}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666',
                      marginTop: '2px'
                    }}>
                      {isLowStock ? '⚠️ 庫存不足' : '✅ 庫存正常'}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              載入庫存資料中...
            </div>
          )}
        </div>

        {error && <div className="error">{error}</div>}

        {/* 廚房製作清單內容 */}
            {showWeeklyView && (
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
            {productionList.length > 0 ? (
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
            ) : (
              <div className="loading">
                當日無製作項目
              </div>
            )}
          </>
        )}

      </div>

      <div className="card">
        <h2>使用說明</h2>
        <div style={{ lineHeight: '1.6', color: '#666' }}>
          <p>• 此頁面顯示當日需要製作的所有產品總數量</p>
          <p>• 廚房員工只需專注於製作數量，不需要知道客戶資訊</p>
          <p>• 可以切換日期查看不同日期的製作需求</p>
          <p>• 完成製作後，點擊「標記完成」按鈕更新產品狀態</p>
          <p>• 狀態會自動同步到「客戶訂單」頁面</p>
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
    </div>
  );
};

export default KitchenDashboard;
