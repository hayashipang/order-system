import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import KitchenDashboard from './components/KitchenDashboard';
import CustomerOrders from './components/CustomerOrders';
import AdminPanel from './components/AdminPanel';
import ProductManagement from './components/ProductManagement';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('kitchen');

  useEffect(() => {
    // 檢查是否有儲存的登入狀態
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setCurrentPage('kitchen');
  };

  const renderPage = () => {
    console.log('Current page:', currentPage);
    console.log('User:', user);
    
    try {
      switch (currentPage) {
        case 'kitchen':
          return <KitchenDashboard />;
        case 'customers':
          return <CustomerOrders />;
        case 'admin':
          return <AdminPanel />;
        case 'products':
          return <ProductManagement />;
        default:
          return <KitchenDashboard />;
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      return <div>載入頁面時發生錯誤: {error.message}</div>;
    }
  };

  const renderNavigation = () => {
    if (!user) return null;

    const isAdmin = user.role === 'admin';
    
    return (
      <nav className="nav">
        <button 
          className={`nav-button ${currentPage === 'kitchen' ? 'active' : ''}`}
          onClick={() => setCurrentPage('kitchen')}
        >
          廚房製作
        </button>
        <button 
          className={`nav-button ${currentPage === 'customers' ? 'active' : ''}`}
          onClick={() => setCurrentPage('customers')}
        >
          客戶訂單
        </button>
        {isAdmin && (
          <>
            <button 
              className={`nav-button ${currentPage === 'products' ? 'active' : ''}`}
              onClick={() => setCurrentPage('products')}
            >
              產品管理
            </button>
            <button 
              className={`nav-button ${currentPage === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentPage('admin')}
            >
              後台管理
            </button>
          </>
        )}
        <button 
          className="nav-button"
          onClick={handleLogout}
          style={{ background: '#e74c3c', color: 'white' }}
        >
          登出
        </button>
      </nav>
    );
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">
      <header className="header">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <h1 style={{ margin: 0 }}>果然盈訂單管理系統</h1>
          <div style={{ 
            position: 'absolute', 
            right: 0, 
            color: 'white', 
            fontSize: '14px' 
          }}>
            歡迎，{user.username} ({user.role === 'admin' ? '管理者' : '廚房員工'})
          </div>
        </div>
        {renderNavigation()}
      </header>
      
      <main className="container">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
