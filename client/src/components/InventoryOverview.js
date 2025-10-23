import React, { useState, useEffect } from 'react';
import axios from 'axios';

const InventoryOverview = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockUpdate = async (productId, newStock) => {
    try {
      await axios.put(`/api/products/${productId}`, { 
        current_stock: newStock 
      });
      fetchProducts(); // 重新載入產品
    } catch (error) {
      console.error('Error updating stock:', error);
    }
  };

  const filteredProducts = products.filter(product => {
    if (filter === 'low') return product.current_stock <= product.min_stock;
    if (filter === 'out') return product.current_stock === 0;
    return true;
  });

  const lowStockCount = products.filter(p => p.current_stock <= p.min_stock).length;
  const outOfStockCount = products.filter(p => p.current_stock === 0).length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className="inventory-overview">
      <h2>庫存管理</h2>
      
      {/* 庫存統計 */}
      <div className="stats-grid grid grid-3">
        <div className="card stat-card">
          <h3>總產品數</h3>
          <div className="stat-number">{products.length}</div>
        </div>
        
        <div className="card stat-card">
          <h3>庫存不足</h3>
          <div className="stat-number warning">{lowStockCount}</div>
        </div>
        
        <div className="card stat-card">
          <h3>缺貨產品</h3>
          <div className="stat-number danger">{outOfStockCount}</div>
        </div>
      </div>

      {/* 篩選器 */}
      <div className="card">
        <div className="filters">
          <div className="filter-group">
            <label>庫存狀態：</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="form-control"
            >
              <option value="all">全部產品</option>
              <option value="low">庫存不足</option>
              <option value="out">缺貨</option>
            </select>
          </div>
        </div>
      </div>

      {/* 產品列表 */}
      <div className="card">
        <h3>產品庫存 ({filteredProducts.length})</h3>
        {filteredProducts.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>產品名稱</th>
                <th>當前庫存</th>
                <th>最低庫存</th>
                <th>庫存狀態</th>
                <th>價格</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id}>
                  <td>
                    <div>
                      <strong>{product.name}</strong>
                      {product.description && (
                        <div className="product-description">{product.description}</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <input
                      type="number"
                      value={product.current_stock}
                      onChange={(e) => {
                        const newStock = parseInt(e.target.value) || 0;
                        handleStockUpdate(product.id, newStock);
                      }}
                      className="form-control stock-input"
                      min="0"
                    />
                  </td>
                  <td>{product.min_stock}</td>
                  <td>
                    {product.current_stock === 0 ? (
                      <span className="status-badge status-cancelled">缺貨</span>
                    ) : product.current_stock <= product.min_stock ? (
                      <span className="status-badge status-pending">庫存不足</span>
                    ) : (
                      <span className="status-badge status-completed">正常</span>
                    )}
                  </td>
                  <td>NT$ {product.price}</td>
                  <td>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        const newStock = prompt('請輸入新的庫存數量:', product.current_stock);
                        if (newStock !== null && !isNaN(newStock)) {
                          handleStockUpdate(product.id, parseInt(newStock));
                        }
                      }}
                    >
                      更新庫存
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>沒有找到符合條件的產品</p>
        )}
      </div>
    </div>
  );
};

export default InventoryOverview;
