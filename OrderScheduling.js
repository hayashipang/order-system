import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from './config';

const OrderScheduling = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [draggedOrder, setDraggedOrder] = useState(null);
  const [dragOverOrder, setDragOverOrder] = useState(null);

  // 獲取未排程的訂單
  const fetchUnscheduledOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${config.apiUrl}/api/orders`);
      // 篩選出未排程的訂單（manufacturing_date 為 null）
      const unscheduledOrders = response.data.filter(order => 
        order.manufacturing_date === null && order.status !== 'completed'
      );
      setOrders(unscheduledOrders);
    } catch (err) {
      setError('載入訂單失敗: ' + err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // 更新訂單的製造日期
  const updateOrderManufacturingDate = async (orderId, manufacturingDate) => {
    try {
      await axios.put(`${config.apiUrl}/api/orders/${orderId}`, {
        manufacturing_date: manufacturingDate
      });
      // 重新載入訂單列表
      fetchUnscheduledOrders();
    } catch (err) {
      setError('更新訂單失敗: ' + err.message);
    }
  };

  // 拖拉開始
  const handleDragStart = (e, order) => {
    setDraggedOrder(order);
    e.dataTransfer.effectAllowed = 'move';
  };

  // 拖拉結束
  const handleDragEnd = () => {
    setDraggedOrder(null);
    setDragOverOrder(null);
  };

  // 拖拉懸停
  const handleDragOver = (e, order) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverOrder(order);
  };

  // 拖拉離開
  const handleDragLeave = () => {
    setDragOverOrder(null);
  };

  // 拖拉放下
  const handleDrop = (e, targetOrder) => {
    e.preventDefault();
    
    if (draggedOrder && targetOrder && draggedOrder.id !== targetOrder.id) {
      // 交換訂單的生產順序
      const draggedIndex = orders.findIndex(order => order.id === draggedOrder.id);
      const targetIndex = orders.findIndex(order => order.id === targetOrder.id);
      
      const newOrders = [...orders];
      [newOrders[draggedIndex], newOrders[targetIndex]] = [newOrders[targetIndex], newOrders[draggedIndex]];
      
      setOrders(newOrders);
      
      // 更新後端排序
      updateOrderProductionOrder(newOrders);
    }
    
    setDraggedOrder(null);
    setDragOverOrder(null);
  };

  // 更新訂單的生產順序
  const updateOrderProductionOrder = async (orders) => {
    try {
      for (let i = 0; i < orders.length; i++) {
        await axios.put(`${config.apiUrl}/api/orders/${orders[i].id}`, {
          production_order: i + 1
        });
      }
    } catch (err) {
      setError('更新排序失敗: ' + err.message);
    }
  };

  // 設定製造日期
  const handleSetManufacturingDate = (orderId, date) => {
    updateOrderManufacturingDate(orderId, date);
  };

  // 取消製造日期
  const handleCancelManufacturingDate = (orderId) => {
    updateOrderManufacturingDate(orderId, null);
  };

  useEffect(() => {
    fetchUnscheduledOrders();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', color: '#2c3e50' }}>
        📅 訂單排程管理
      </h2>
      
      {error && (
        <div style={{ 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          載入中...
        </div>
      ) : (
        <div>
          {/* 日期選擇器 */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ marginRight: '10px', fontWeight: 'bold' }}>
              製造日期:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
          </div>

          {/* 訂單卡片列表 */}
          <div style={{ display: 'grid', gap: '15px' }}>
            {orders.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                color: '#666',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px'
              }}>
                目前沒有未排程的訂單
              </div>
            ) : (
              orders.map((order, index) => (
                <div
                  key={order.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, order)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, order)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, order)}
                  style={{
                    padding: '20px',
                    backgroundColor: dragOverOrder?.id === order.id ? '#e3f2fd' : '#fff',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    cursor: 'move',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    opacity: draggedOrder?.id === order.id ? 0.5 : 1
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={{ 
                          backgroundColor: '#3498db', 
                          color: 'white', 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          #{order.id}
                        </span>
                        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                          {order.customer_name || '現場客戶'}
                        </span>
                        <span style={{ color: '#666', fontSize: '14px' }}>
                          {order.order_date}
                        </span>
                      </div>
                      
                      <div style={{ marginBottom: '10px' }}>
                        <strong>訂單內容:</strong>
                        <div style={{ marginTop: '5px', fontSize: '14px' }}>
                          {/* 這裡需要從 order_items 獲取訂單項目 */}
                          <span style={{ color: '#666' }}>載入中...</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ color: '#666', fontSize: '14px' }}>
                          狀態: {order.status}
                        </span>
                        <span style={{ color: '#666', fontSize: '14px' }}>
                          金額: ${order.subtotal}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button
                        onClick={() => handleSetManufacturingDate(order.id, selectedDate)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#27ae60',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        排程到 {selectedDate}
                      </button>
                      
                      {order.manufacturing_date && (
                        <button
                          onClick={() => handleCancelManufacturingDate(order.id)}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          取消排程
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {order.manufacturing_date && (
                    <div style={{ 
                      marginTop: '10px', 
                      padding: '8px', 
                      backgroundColor: '#d4edda', 
                      borderRadius: '4px',
                      fontSize: '14px',
                      color: '#155724'
                    }}>
                      ✅ 已排程製造日期: {order.manufacturing_date}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderScheduling;

