import React, { useState, useEffect } from 'react';
import ProductGrid from './components/ProductGrid';
import CashierPanel from './components/CashierPanel';
import SalesHistory from './components/SalesHistory';
// 根據環境選擇API配置
const apiConfig = process.env.NODE_ENV === 'production' 
  ? require('./services/api.production') 
  : require('./services/api');

console.log('🔧 POS系統環境:', process.env.NODE_ENV);
console.log('🔧 使用API配置:', apiConfig);

const { productAPI, orderAPI } = apiConfig;

function App() {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('pos'); // 'pos' 或 'history'
  const [successMessage, setSuccessMessage] = useState('');

  // 載入產品列表
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('開始載入產品列表...');
      const response = await productAPI.getProducts();
      console.log('產品列表載入成功:', response.data);
      setProducts(response.data);
    } catch (err) {
      console.error('載入產品錯誤:', err);
      setError(`載入產品列表失敗: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 重新載入產品列表（供SalesHistory使用）
  const reloadProducts = () => {
    loadProducts();
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // 產品選擇處理
  const handleProductSelect = (product) => {
    const existingItemIndex = cartItems.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {
      // 如果產品已在購物車中，增加數量
      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += 1;
      setCartItems(updatedItems);
    } else {
      // 如果產品不在購物車中，新增到購物車
      const newItem = {
        id: product.id,
        name: product.name,
        unit_price: product.price,
        quantity: 1,
        special_notes: '',
        is_gift: false
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  // 更新商品數量
  const handleUpdateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedItems = [...cartItems];
    updatedItems[index].quantity = newQuantity;
    setCartItems(updatedItems);
  };

  // 移除商品
  const handleRemoveItem = (index) => {
    const updatedItems = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedItems);
  };

  // 清空購物車
  const handleClearCart = () => {
    setCartItems([]);
  };

  // 完成交易
  const handleCompleteTransaction = async (orderData) => {
    try {
      const response = await orderAPI.createPOSOrder(orderData);
      console.log('交易成功:', response.data);
      
      // 更新庫存：每個銷售的商品庫存-1
      const updatedProducts = products.map(product => {
        const soldItem = orderData.items.find(item => item.product_name === product.name);
        if (soldItem) {
          const newStock = Math.max(0, product.current_stock - soldItem.quantity);
          return {
            ...product,
            current_stock: newStock
          };
        }
        return product;
      });
      setProducts(updatedProducts);
      
      // 同步庫存更新到後端
      console.log('開始同步庫存到後端...');
      for (const product of updatedProducts) {
        const soldItem = orderData.items.find(item => item.product_name === product.name);
        if (soldItem) {
          console.log(`準備更新庫存: ${product.name}, 新庫存: ${product.current_stock}`);
          try {
            const updateData = {
              name: product.name,
              price: product.price,
              description: product.description,
              current_stock: product.current_stock,
              min_stock: product.min_stock
            };
            console.log('發送更新請求:', updateData);
            const result = await productAPI.updateProduct(product.id, updateData);
            console.log(`庫存已更新: ${product.name} -> ${product.current_stock}`, result.data);
          } catch (err) {
            console.error(`更新庫存失敗: ${product.name}`, err);
            console.error('錯誤詳情:', err.response?.data || err.message);
          }
        }
      }
      console.log('庫存同步完成');
      
      // 顯示成功訊息
      setSuccessMessage(`交易完成！訂單編號: ${response.data.id}`);
      
      // 清空購物車
      setCartItems([]);
      
      // 3秒後清除成功訊息
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (err) {
      console.error('交易失敗:', err);
      throw err; // 重新拋出錯誤讓 CashierPanel 處理
    }
  };

  // 渲染導航
  const renderNavigation = () => (
    <div style={{
      display: 'flex',
      gap: '1rem',
      marginBottom: '1.5rem'
    }}>
      <button
        className={`btn ${currentView === 'pos' ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => setCurrentView('pos')}
      >
        收銀台
      </button>
      <button
        className={`btn ${currentView === 'history' ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => setCurrentView('history')}
      >
        銷售歷史
      </button>
    </div>
  );

  // 渲染 POS 收銀介面
  const renderPOSView = () => {
    if (loading) {
      return (
        <div className="loading">
          載入產品列表中...
        </div>
      );
    }

    if (error) {
      return (
        <div className="error">
          {error}
          <button 
            className="btn btn-secondary" 
            onClick={loadProducts}
            style={{ marginTop: '1rem' }}
          >
            重新載入
          </button>
        </div>
      );
    }

    return (
      <div className="pos-container">
        <ProductGrid
          products={products}
          selectedProducts={cartItems}
          onProductSelect={handleProductSelect}
        />
        <CashierPanel
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onCompleteTransaction={handleCompleteTransaction}
          onClearCart={handleClearCart}
        />
      </div>
    );
  };

  return (
    <div className="App">
      <header className="header">
        <h1>果然盈 POS 收銀系統</h1>
      </header>
      
      <main className="container">
        {renderNavigation()}
        
        {/* 錯誤訊息 */}
        {error && (
          <div className="error" style={{color: 'red', padding: '10px', background: '#ffe6e6'}}>
            {error}
          </div>
        )}
        
        {/* 成功訊息 */}
        {successMessage && (
          <div className="success">
            {successMessage}
          </div>
        )}
        
            {/* 主要內容 */}
            {currentView === 'pos' ? renderPOSView() : <SalesHistory onReloadProducts={reloadProducts} />}
      </main>
    </div>
  );
}

export default App;
