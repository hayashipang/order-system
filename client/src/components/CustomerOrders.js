import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

const CustomerOrders = () => {
  const [customerOrders, setCustomerOrders] = useState([]);
  const [totalDailyAmount, setTotalDailyAmount] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showWeeklyView, setShowWeeklyView] = useState(false);
  const [weeklyData, setWeeklyData] = useState([]);

  const fetchCustomerOrders = async (date) => {
    setLoading(true);
    setError('');
    try {
      // 使用真正的 API 載入客戶訂單
      const response = await axios.get(`${config.apiUrl}/api/orders/customers/${date}`);
      console.log('客戶訂單 API 響應:', response.data);
      
      // 確保數據結構正確
      const orders = response.data.orders || [];
      const totalAmount = response.data.totalAmount || 0;
      
      // 確保每個訂單都有必要的屬性
      const safeOrders = orders.map(order => ({
        ...order,
        customer_total: order.customer_total || 0,
        items: (order.items || []).map(item => ({
          ...item,
          unit_price: item.unit_price || 0,
          item_total: item.item_total || (item.quantity || 0) * (item.unit_price || 0)
        }))
      }));
      
      setCustomerOrders(safeOrders);
      setTotalDailyAmount(totalAmount);
    } catch (err) {
      console.error('載入客戶訂單錯誤:', err);
      setError('載入客戶訂單失敗: ' + err.message);
      setCustomerOrders([]);
      setTotalDailyAmount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerOrders(selectedDate);
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${config.apiUrl}/api/orders/${orderId}/status`, { status: newStatus });
      // 重新載入資料
      fetchCustomerOrders(selectedDate);
    } catch (err) {
      setError('更新訂單狀態失敗: ' + (err.response?.data?.error || err.message));
    }
  };

  const exportOrdersToCSV = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/orders/export/${selectedDate}`);
      const { files } = response.data;
      
      // 下載每個客戶的 CSV 檔案
      Object.keys(files).forEach(filename => {
        const csvContent = files[filename];
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
      
      alert(`成功匯出 ${Object.keys(files).length} 個客戶的訂單檔案！`);
    } catch (err) {
      setError('匯出失敗: ' + (err.response?.data?.error || err.message));
    }
  };

  const fetchWeeklyData = async () => {
    try {
      // 從今天開始的未來一週（包含今天）
      const today = new Date(selectedDate);
      const startDate = today.toISOString().split('T')[0];
      
      const response = await axios.get(`${config.apiUrl}/api/orders/weekly/${startDate}`);
      setWeeklyData(response.data.weekly_data);
    } catch (err) {
      setError('取得週資料失敗: ' + (err.response?.data?.error || err.message));
    }
  };

  const toggleWeeklyView = () => {
    if (!showWeeklyView) {
      fetchWeeklyData();
    }
    setShowWeeklyView(!showWeeklyView);
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

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return '待出貨';
      case 'shipped': return '已出貨';
      default: return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12'; // 橙色 - 待出貨
      case 'shipped': return '#27ae60'; // 綠色 - 已出貨
      default: return '#95a5a6';
    }
  };

  const getTotalOrders = () => {
    return customerOrders.length;
  };

  const getTotalItems = () => {
    return customerOrders.reduce((total, order) => {
      return total + order.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0);
    }, 0);
  };

  return (
    <div>
      <div className="card">
        <h2>客戶訂單管理</h2>
        
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
          <button
            className="export-button"
            onClick={exportOrdersToCSV}
            style={{
              padding: '8px 16px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              marginLeft: '10px'
            }}
          >
            📊 匯出 CSV
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {showWeeklyView && (
          <div style={{
            marginBottom: '20px',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '12px',
            border: '2px solid #e9ecef'
          }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>未來一週訂單概覽</h3>
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
                  <span>無訂單</span>
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
            {customerOrders.length > 0 ? (
              <>
                <div style={{ marginBottom: '20px', padding: '15px', background: '#e8f4fd', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>總計: {getTotalOrders()} 位客戶, {getTotalItems()} 瓶</strong>
                      <span style={{ marginLeft: '20px', color: '#666' }}>
                        {new Date(selectedDate).toLocaleDateString('zh-TW', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          weekday: 'long'
                        })}
                      </span>
                    </div>
                    <div style={{ 
                      background: '#27ae60', 
                      color: 'white', 
                      padding: '10px 20px', 
                      borderRadius: '8px',
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      當日總金額: NT$ {(totalDailyAmount || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                
                <div className="customer-orders">
                  {customerOrders.map((order, index) => (
                    <div key={index} className="customer-card">
                      <div className="customer-header">
                        <div>
                          {/* 訂單編號 - 第一欄 */}
                          {order.order_number && (
                            <div style={{ 
                              background: '#3498db', 
                              color: 'white', 
                              padding: '6px 12px', 
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              marginBottom: '8px',
                              display: 'inline-block'
                            }}>
                              📋 訂單編號: {order.order_number}
                            </div>
                          )}
                          
                          {/* 客戶姓名 - 第二欄 */}
                          <div className="customer-name" style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
                            {order.customer_name}
                          </div>
                          
                          {/* 聯絡電話 - 第三欄 */}
                          <div className="customer-phone" style={{ fontSize: '16px', marginBottom: '4px' }}>
                            📞 {order.phone}
                          </div>
                          
                          {/* 送貨地點 - 第四欄 */}
                          {order.address && (
                            <div className="customer-address" style={{ fontSize: '14px', marginBottom: '4px' }}>
                              📍 送貨地點: {order.address}
                            </div>
                          )}
                          
                          {/* 全家店名 - 第五欄 */}
                          {order.family_mart_address && (
                            <div className="customer-family-mart" style={{ fontSize: '14px', marginBottom: '4px' }}>
                              🏪 全家店名: {order.family_mart_address}
                            </div>
                          )}
                          
                          {/* 來源 - 第六欄（彩色標籤顯示） */}
                          {order.source && (
                            <div style={{ marginBottom: '4px' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: order.source?.includes('蝦皮') ? '#ff6b35' : 
                                               order.source?.includes('IG') ? '#e1306c' :
                                               order.source?.includes('FB') ? '#1877f2' :
                                               order.source?.includes('全家') ? '#00a651' :
                                               order.source?.includes('7-11') ? '#ff6600' : '#27ae60',
                                color: 'white'
                              }}>
                                🛒 來源: {order.source}
                              </span>
                            </div>
                          )}
                          
                          {/* 付款方式 - 第七欄（彩色標籤顯示） */}
                          {order.payment_method && (
                            <div style={{ marginBottom: '8px' }}>
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '500',
                                backgroundColor: order.payment_method === '信用卡' ? '#3498db' : 
                                               order.payment_method === 'LinePay' ? '#00c300' :
                                               order.payment_method === '現金' ? '#95a5a6' : '#e74c3c',
                                color: 'white'
                              }}>
                                💳 付款方式: {order.payment_method}
                              </span>
                            </div>
                          )}
                          
                          <div className="delivery-date" style={{ 
                            background: '#f39c12', 
                            color: 'white', 
                            padding: '6px 12px', 
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginTop: '8px',
                            display: 'inline-block'
                          }}>
                            📅 出貨日期: {new Date(order.delivery_date).toLocaleDateString('zh-TW')}
                          </div>
                          {order.order_notes && <div className="order-notes">備註: {order.order_notes}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <div style={{ 
                            background: '#e74c3c', 
                            color: 'white', 
                            padding: '8px 16px', 
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold'
                          }}>
                            總金額: NT$ {(order.customer_total || 0).toLocaleString()}
                          </div>
                          
                          {/* 信用卡手續費顯示 */}
                          {order.credit_card_fee && order.credit_card_fee > 0 && (
                            <div style={{ 
                              background: '#e67e22', 
                              color: 'white', 
                              padding: '4px 8px', 
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              💳 手續費扣除: NT$ {order.credit_card_fee.toLocaleString()}
                            </div>
                          )}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {order.shipping_type === 'free' && (
                              <span 
                                style={{ 
                                  backgroundColor: '#e74c3c',
                                  color: 'white',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}
                                title="免運費"
                              >
                                🚚 免運
                              </span>
                            )}
                            <span 
                              className="order-status"
                              style={{ backgroundColor: getStatusColor(order.status) }}
                            >
                              {getStatusText(order.status)}
                            </span>
                          </div>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.order_id, e.target.value)}
                            style={{
                              padding: '6px 12px',
                              border: '1px solid #ddd',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                          >
                            <option value="pending">待出貨</option>
                            <option value="shipped" disabled={order.status === 'pending' && !order.all_items_completed}>
                              {order.all_items_completed ? '已出貨' : '已出貨 (需完成所有產品)'}
                            </option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="order-items">
                        {order.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="order-item">
                            <div style={{ flex: 1 }}>
                              <div className="item-name">
                                {item.is_gift ? (
                                  <span style={{ color: '#e67e22', fontWeight: 'bold' }}>
                                    🎁 {item.product_name} (贈送)
                                  </span>
                                ) : (
                                  item.product_name
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                                單價: NT$ {(item.unit_price || 0).toLocaleString()}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div className="item-quantity">{item.quantity} 瓶</div>
                              <div style={{ 
                                background: item.item_status === 'completed' ? '#28a745' : '#dc3545', 
                                color: 'white', 
                                padding: '4px 8px', 
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold'
                              }}>
                                {item.item_status === 'completed' ? '已完成' : '待製作'}
                              </div>
                              <div style={{ 
                                background: '#3498db', 
                                color: 'white', 
                                padding: '4px 12px', 
                                borderRadius: '15px',
                                fontSize: '14px',
                                fontWeight: 'bold'
                              }}>
                                NT$ {(item.item_total || 0).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="loading">
                當日無客戶訂單
              </div>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h2>出貨說明</h2>
        <div style={{ lineHeight: '1.6', color: '#666' }}>
          <p>• 此頁面按客戶分組顯示訂單，方便出貨時按客戶打包</p>
          <p>• 可以更新訂單狀態：待製作 → 製作中 → 已完成 → 已出貨</p>
          <p>• 每個客戶的訂單會清楚顯示產品名稱和數量</p>
          <p>• 可以切換日期查看不同日期的客戶訂單</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrders;
