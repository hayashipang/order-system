import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  // const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
    // fetchCustomers();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // const fetchCustomers = async () => {
  //   try {
  //     const response = await axios.get('/api/customers');
  //     setCustomers(response.data);
  //   } catch (error) {
  //     console.error('Error fetching customers:', error);
  //   }
  // };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/orders/${orderId}`, { status: newStatus });
      fetchOrders(); // 重新載入訂單
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toString().includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className="customer-orders">
      <h2>客戶訂單管理</h2>
      
      {/* 篩選和搜尋 */}
      <div className="card">
        <div className="filters">
          <div className="filter-group">
            <label>狀態篩選：</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="form-control"
            >
              <option value="all">全部</option>
              <option value="pending">待處理</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
          
          <div className="search-group">
            <input
              type="text"
              placeholder="搜尋客戶名稱或訂單編號..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </div>
        </div>
      </div>

      {/* 訂單列表 */}
      <div className="card">
        <h3>訂單列表 ({filteredOrders.length})</h3>
        {filteredOrders.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>訂單編號</th>
                <th>客戶名稱</th>
                <th>訂單日期</th>
                <th>交貨日期</th>
                <th>狀態</th>
                <th>金額</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customer_name}</td>
                  <td>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td>{new Date(order.delivery_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status === 'pending' ? '待處理' : 
                       order.status === 'completed' ? '已完成' : '已取消'}
                    </span>
                  </td>
                  <td>NT$ {order.subtotal?.toLocaleString() || 0}</td>
                  <td>
                    <div className="action-buttons">
                      {order.status === 'pending' && (
                        <>
                          <button 
                            className="btn btn-secondary"
                            onClick={() => handleStatusUpdate(order.id, 'completed')}
                          >
                            完成
                          </button>
                          <button 
                            className="btn btn-danger"
                            onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                          >
                            取消
                          </button>
                        </>
                      )}
                      {order.status === 'completed' && (
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleStatusUpdate(order.id, 'pending')}
                        >
                          重新開啟
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>沒有找到符合條件的訂單</p>
        )}
      </div>
    </div>
  );
};

export default CustomerOrders;
