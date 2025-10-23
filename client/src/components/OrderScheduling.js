import React, { useState, useEffect } from 'react';

const OrderScheduling = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 載入訂單數據
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('載入訂單失敗');
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      setError('載入訂單失敗: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 切換訂單選擇
  const toggleOrderSelection = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  // 更新訂單數量
  const updateOrderQuantity = (orderId, productId, newQuantity) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? {
              ...order,
              items: order.items.map(item => 
                item.product_id === productId 
                  ? { ...item, quantity: parseInt(newQuantity) || 0 }
                  : item
              )
            }
          : order
      )
    );
  };

  // 拖拽排序
  const moveOrder = (dragIndex, hoverIndex) => {
    const draggedOrder = orders[dragIndex];
    const newOrders = [...orders];
    newOrders.splice(dragIndex, 1);
    newOrders.splice(hoverIndex, 0, draggedOrder);
    setOrders(newOrders);
  };

  // 計算總製作量
  const calculateTotalProduction = () => {
    const production = {};
    orders.forEach(order => {
      if (selectedOrders.has(order.id)) {
        order.items.forEach(item => {
          const productName = item.product_name || `產品${item.product_id}`;
          if (!production[productName]) {
            production[productName] = 0;
          }
          production[productName] += item.quantity || 0;
        });
      }
    });
    return production;
  };

  // 儲存排程
  const saveSchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/scheduling/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders: orders,
          selectedOrders: Array.from(selectedOrders),
          productionDate: new Date().toISOString().split('T')[0]
        })
      });
      
      if (!response.ok) throw new Error('儲存排程失敗');
      
      alert('排程已儲存！');
    } catch (err) {
      setError('儲存失敗: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">載入中...</div>;

  return (
    <div className="order-scheduling">
      <div className="header">
        <h2>訂單排程</h2>
        <div className="actions">
          <button 
            className="btn btn-primary" 
            onClick={saveSchedule}
            disabled={selectedOrders.size === 0}
          >
            儲存排程
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {/* 總製作量顯示 */}
      <div className="production-summary">
        <h3>今日製作量</h3>
        <div className="production-items">
          {Object.entries(calculateTotalProduction()).map(([product, quantity]) => (
            <div key={product} className="production-item">
              <span className="product-name">{product}</span>
              <span className="quantity">{quantity} 瓶</span>
            </div>
          ))}
        </div>
      </div>

      {/* 訂單卡片 */}
      <div className="orders-grid">
        {orders.map((order, index) => (
          <div 
            key={order.id} 
            className={`order-card ${selectedOrders.has(order.id) ? 'selected' : ''}`}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
              if (dragIndex !== index) {
                moveOrder(dragIndex, index);
              }
            }}
          >
            <div className="card-header">
              <input
                type="checkbox"
                checked={selectedOrders.has(order.id)}
                onChange={() => toggleOrderSelection(order.id)}
              />
              <span className="order-number">訂單 #{order.id}</span>
              <span className="customer-name">{order.customer_name || '現場訂單'}</span>
            </div>

            <div className="card-content">
              <div className="order-items">
                {order.items && order.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="order-item">
                    <span className="product-name">
                      {item.product_name || `產品${item.product_id}`}
                    </span>
                    <div className="quantity-control">
                      <button 
                        onClick={() => updateOrderQuantity(order.id, item.product_id, (item.quantity || 0) - 1)}
                        disabled={!item.quantity || item.quantity <= 0}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={item.quantity || 0}
                        onChange={(e) => updateOrderQuantity(order.id, item.product_id, e.target.value)}
                        min="0"
                      />
                      <button 
                        onClick={() => updateOrderQuantity(order.id, item.product_id, (item.quantity || 0) + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-footer">
              <span className="delivery-date">
                交貨: {order.delivery_date || '未設定'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="empty-state">
          <p>目前沒有訂單</p>
        </div>
      )}
    </div>
  );
};

export default OrderScheduling;
