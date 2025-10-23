import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import CustomerOrders from './components/CustomerOrders';
import InventoryOverview from './components/InventoryOverview';
import KitchenDashboard from './components/KitchenDashboard';
import ProductManagement from './components/ProductManagement';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 檢查本地存儲中的認證狀態
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>載入中...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <h1>果然盈訂單管理系統</h1>
          <div className="user-info">
            <span>歡迎，{user?.username}</span>
            <button onClick={handleLogout} className="logout-btn">登出</button>
          </div>
        </header>
        
        <nav className="app-nav">
          <a href="/admin">管理面板</a>
          <a href="/orders">客戶訂單</a>
          <a href="/inventory">庫存管理</a>
          <a href="/kitchen">廚房製作</a>
          <a href="/products">產品管理</a>
        </nav>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/orders" element={<CustomerOrders />} />
            <Route path="/inventory" element={<InventoryOverview />} />
            <Route path="/kitchen" element={<KitchenDashboard />} />
            <Route path="/products" element={<ProductManagement />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
