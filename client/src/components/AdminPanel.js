import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    lowStockProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 獲取統計數據
      const statsResponse = await axios.get('/api/admin/stats');
      setStats(statsResponse.data);
      
      // 獲取最近訂單
      const ordersResponse = await axios.get('/api/orders?limit=5&sort=desc');
      setRecentOrders(ordersResponse.data);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
    <div className="admin-panel">
      <h2>管理面板</h2>
      
      {/* 統計卡片 */}
      <div className="stats-grid grid grid-4">
        <div className="card stat-card">
          <h3>總訂單數</h3>
          <div className="stat-number">{stats.totalOrders}</div>
        </div>
        
        <div className="card stat-card">
          <h3>待處理訂單</h3>
          <div className="stat-number pending">{stats.pendingOrders}</div>
        </div>
        
        <div className="card stat-card">
          <h3>已完成訂單</h3>
          <div className="stat-number completed">{stats.completedOrders}</div>
        </div>
        
        <div className="card stat-card">
          <h3>總營收</h3>
          <div className="stat-number revenue">NT$ {stats.totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      {/* 庫存警告 */}
      {stats.lowStockProducts > 0 && (
        <div className="card alert-card">
          <h3>⚠️ 庫存警告</h3>
          <p>有 {stats.lowStockProducts} 個產品庫存不足，請及時補貨。</p>
          <a href="/inventory" className="btn">查看庫存</a>
        </div>
      )}

      {/* 最近訂單 */}
      <div className="card">
        <h3>最近訂單</h3>
        {recentOrders.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>訂單編號</th>
                <th>客戶</th>
                <th>日期</th>
                <th>狀態</th>
                <th>金額</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.customer_name}</td>
                  <td>{new Date(order.order_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status === 'pending' ? '待處理' : 
                       order.status === 'completed' ? '已完成' : '已取消'}
                    </span>
                  </td>
                  <td>NT$ {order.subtotal?.toLocaleString() || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>暫無訂單記錄</p>
        )}
      </div>

      {/* 快速操作 */}
      <div className="card">
        <h3>快速操作</h3>
        <div className="quick-actions grid grid-3">
          <a href="/orders" className="btn">查看所有訂單</a>
          <a href="/kitchen" className="btn">廚房製作</a>
          <a href="/products" className="btn">產品管理</a>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
