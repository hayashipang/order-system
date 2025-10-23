import React, { useState, useEffect } from 'react';
import axios from 'axios';

const KitchenDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [posOrders, setPosOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('customer');

  useEffect(() => {
    fetchOrders();
    fetchPosOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders?status=pending');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosOrders = async () => {
    try {
      const response = await axios.get('/api/pos-orders?status=pending');
      setPosOrders(response.data);
    } catch (error) {
      console.error('Error fetching POS orders:', error);
    }
  };

  const handleItemStatusUpdate = async (orderId, itemId, newStatus) => {
    try {
      await axios.put(`/api/orders/${orderId}/items/${itemId}`, { 
        status: newStatus 
      });
      fetchOrders();
      fetchPosOrders();
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const getOrderItems = (order) => {
    return order.items || [];
  };

  const getPendingItems = (items) => {
    return items.filter(item => item.status === 'pending');
  };

  const getCompletedItems = (items) => {
    return items.filter(item => item.status === 'completed');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className="kitchen-dashboard">
      <h2>廚房製作面板</h2>
      
      {/* 標籤頁 */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'customer' ? 'active' : ''}`}
          onClick={() => setActiveTab('customer')}
        >
          客戶訂單 ({orders.length})
        </button>
        <button 
          className={`tab ${activeTab === 'pos' ? 'active' : ''}`}
          onClick={() => setActiveTab('pos')}
        >
          現場訂單 ({posOrders.length})
        </button>
      </div>

      {/* 客戶訂單 */}
      {activeTab === 'customer' && (
        <div className="orders-section">
          <h3>客戶訂單</h3>
          {orders.length > 0 ? (
            <div className="orders-grid">
              {orders.map(order => {
                const items = getOrderItems(order);
                const pendingItems = getPendingItems(items);
                const completedItems = getCompletedItems(items);
                
                return (
                  <div key={order.id} className="card order-card">
                    <div className="order-header">
                      <h4>訂單 #{order.id}</h4>
                      <span className="customer-name">{order.customer_name}</span>
                      <span className="order-date">
                        {new Date(order.delivery_date).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="order-items">
                      <h5>待製作 ({pendingItems.length})</h5>
                      {pendingItems.map(item => (
                        <div key={item.id} className="order-item">
                          <span className="item-name">{item.product_name}</span>
                          <span className="item-quantity">x{item.quantity}</span>
                          <button 
                            className="btn btn-secondary"
                            onClick={() => handleItemStatusUpdate(order.id, item.id, 'completed')}
                          >
                            完成
                          </button>
                        </div>
                      ))}
                      
                      {completedItems.length > 0 && (
                        <>
                          <h5>已完成 ({completedItems.length})</h5>
                          {completedItems.map(item => (
                            <div key={item.id} className="order-item completed">
                              <span className="item-name">{item.product_name}</span>
                              <span className="item-quantity">x{item.quantity}</span>
                              <span className="status-badge status-completed">已完成</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>暫無待處理的客戶訂單</p>
          )}
        </div>
      )}

      {/* 現場訂單 */}
      {activeTab === 'pos' && (
        <div className="orders-section">
          <h3>現場訂單</h3>
          {posOrders.length > 0 ? (
            <div className="orders-grid">
              {posOrders.map(order => {
                const items = getOrderItems(order);
                const pendingItems = getPendingItems(items);
                const completedItems = getCompletedItems(items);
                
                return (
                  <div key={order.id} className="card order-card">
                    <div className="order-header">
                      <h4>現場訂單 #{order.id}</h4>
                      <span className="customer-name">{order.customer_name}</span>
                      <span className="order-date">
                        {new Date(order.order_time).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="order-items">
                      <h5>待製作 ({pendingItems.length})</h5>
                      {pendingItems.map(item => (
                        <div key={item.id} className="order-item">
                          <span className="item-name">{item.product_name}</span>
                          <span className="item-quantity">x{item.quantity}</span>
                          <button 
                            className="btn btn-secondary"
                            onClick={() => handleItemStatusUpdate(order.id, item.id, 'completed')}
                          >
                            完成
                          </button>
                        </div>
                      ))}
                      
                      {completedItems.length > 0 && (
                        <>
                          <h5>已完成 ({completedItems.length})</h5>
                          {completedItems.map(item => (
                            <div key={item.id} className="order-item completed">
                              <span className="item-name">{item.product_name}</span>
                              <span className="item-quantity">x{item.quantity}</span>
                              <span className="status-badge status-completed">已完成</span>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p>暫無待處理的現場訂單</p>
          )}
        </div>
      )}
    </div>
  );
};

export default KitchenDashboard;
