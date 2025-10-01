import React, { useState, useEffect } from 'react';
import { orderAPI } from '../services/api';

const SalesHistory = ({ onReloadProducts }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [filters, setFilters] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    order_type: 'walk-in' // 預設只顯示現場銷售
  });

  // 載入銷售歷史
  const loadSalesHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await orderAPI.getOrderHistory(filters);
      setOrders(response.data);
    } catch (err) {
      setError('載入銷售歷史失敗');
      console.error('載入銷售歷史錯誤:', err);
    } finally {
      setLoading(false);
    }
  };

  // 刪除銷售記錄
  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('確定要刪除這筆銷售記錄嗎？此操作無法復原。')) {
      return;
    }

    try {
      await orderAPI.deleteOrder(orderId);
      setSuccess('銷售記錄已刪除');
      // 重新載入銷售歷史
      await loadSalesHistory();
      // 通知父組件重新載入產品列表（更新庫存）
      if (onReloadProducts) {
        onReloadProducts();
      }
      // 3秒後清除成功訊息
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('刪除銷售記錄失敗');
      console.error('刪除銷售記錄錯誤:', err);
    }
  };

  // 計算今日總銷售金額
  const calculateTodayTotal = () => {
    const today = new Date().toISOString().split('T')[0];
    return orders
      .filter(order => order.order_date === today)
      .reduce((total, order) => total + (order.subtotal || 0), 0);
  };

  useEffect(() => {
    loadSalesHistory();
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // 處理篩選變更
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 格式化日期
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-TW');
  };

  // 格式化時間
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Taipei'
    });
  };

  return (
    <div style={{ 
      background: 'white', 
      borderRadius: '12px', 
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '2px solid #e1e5e9'
      }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ color: '#2d3748', marginBottom: '0.5rem' }}>銷售歷史</h2>
          <div style={{ 
            fontSize: '1.1rem', 
            fontWeight: '600', 
            color: '#667eea',
            background: '#f0f4ff',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: '2px solid #e1e5e9',
            display: 'inline-block'
          }}>
            今日總銷售: NT$ {calculateTodayTotal().toFixed(0)}
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'flex-end',
          gap: '0.5rem'
        }}>
          <button
            className="btn btn-secondary"
            onClick={loadSalesHistory}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap'
            }}
          >
            {loading ? '載入中...' : '重新載入'}
          </button>
          <div style={{ 
            fontSize: '0.8rem', 
            color: '#718096',
            textAlign: 'right',
            maxWidth: '120px',
            lineHeight: '1.2'
          }}>
            手動刷新銷售數據
          </div>
        </div>
      </div>

      {/* 篩選器 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '500' 
          }}>
            開始日期:
          </label>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => handleFilterChange('start_date', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #cbd5e0',
              borderRadius: '4px'
            }}
          />
        </div>
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '500' 
          }}>
            結束日期:
          </label>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => handleFilterChange('end_date', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #cbd5e0',
              borderRadius: '4px'
            }}
          />
        </div>
        <div>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '500' 
          }}>
            訂單類型:
          </label>
          <select
            value={filters.order_type}
            onChange={(e) => handleFilterChange('order_type', e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem',
              border: '1px solid #cbd5e0',
              borderRadius: '4px'
            }}
          >
            <option value="">全部</option>
            <option value="walk-in">現場銷售</option>
            <option value="online">網路訂單</option>
          </select>
        </div>
      </div>

      {/* 成功訊息 */}
      {success && (
        <div className="success">
          {success}
        </div>
      )}

      {/* 錯誤訊息 */}
      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {/* 載入中 */}
      {loading && (
        <div className="loading">
          載入銷售歷史中...
        </div>
      )}

      {/* 銷售列表 */}
      {!loading && !error && (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {orders.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#718096', 
              padding: '2rem' 
            }}>
              沒有找到銷售記錄
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                style={{
                  border: '1px solid #e1e5e9',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: order.order_type === 'walk-in' ? '#f0fff4' : '#f8f9fa'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <div>
                    <div style={{ 
                      fontWeight: '600', 
                      color: '#2d3748',
                      marginBottom: '0.25rem'
                    }}>
                      訂單 #{order.id} - {order.customer_name}
                    </div>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: '#718096' 
                    }}>
                      {formatDate(order.order_date)} {formatTime(order.order_time || order.order_date)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontWeight: '600', 
                      color: '#667eea',
                      fontSize: '1.1rem'
                    }}>
                      銷售總金額: NT$ {order.subtotal || order.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toFixed(0)}
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#718096',
                      background: order.order_type === 'walk-in' ? '#c6f6d5' : '#e2e8f0',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      marginTop: '0.25rem'
                    }}>
                      {order.order_type === 'walk-in' ? '現場銷售' : '網路訂單'}
                    </div>
                  </div>
                </div>

                {/* 訂單項目 */}
                <div style={{ marginTop: '0.5rem' }}>
                  {order.items.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.9rem',
                        color: '#4a5568',
                        padding: '0.25rem 0'
                      }}
                    >
                      <span>
                        {item.product_name} × {item.quantity}
                        {item.is_gift && <span style={{ color: '#e53e3e' }}> 🎁</span>}
                      </span>
                      <span>NT$ {(item.quantity * item.unit_price).toFixed(0)}</span>
                    </div>
                  ))}
                </div>

                {/* 現場銷售特有資訊 */}
                {order.order_type === 'walk-in' && (
                  <div style={{ 
                    marginTop: '0.5rem',
                    padding: '0.5rem',
                    background: '#e6fffa',
                    borderRadius: '4px',
                    fontSize: '0.9rem',
                    color: '#234e52',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div>付款: NT$ {order.customer_payment} | 找零: NT$ {order.change}</div>
                      <div>操作員: {order.created_by}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      style={{
                        background: '#e53e3e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#c53030'}
                      onMouseOut={(e) => e.target.style.background = '#e53e3e'}
                    >
                      刪除
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
