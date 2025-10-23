import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    current_stock: '',
    min_stock: ''
  });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await axios.put(`/api/products/${editingProduct.id}`, formData);
      } else {
        await axios.post('/api/products', formData);
      }
      
      setShowForm(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        price: '',
        description: '',
        current_stock: '',
        min_stock: ''
      });
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      current_stock: product.current_stock.toString(),
      min_stock: product.min_stock.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (window.confirm('確定要刪除這個產品嗎？')) {
      try {
        await axios.delete(`/api/products/${productId}`);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      price: '',
      description: '',
      current_stock: '',
      min_stock: ''
    });
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
    <div className="product-management">
      <h2>產品管理</h2>
      
      <div className="card">
        <div className="section-header">
          <h3>產品列表</h3>
          <button 
            className="btn"
            onClick={() => setShowForm(true)}
          >
            新增產品
          </button>
        </div>

        {products.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>產品名稱</th>
                <th>價格</th>
                <th>當前庫存</th>
                <th>最低庫存</th>
                <th>庫存狀態</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id}>
                  <td>
                    <div>
                      <strong>{product.name}</strong>
                      {product.description && (
                        <div className="product-description">{product.description}</div>
                      )}
                    </div>
                  </td>
                  <td>NT$ {product.price}</td>
                  <td>{product.current_stock}</td>
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
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handleEdit(product)}
                      >
                        編輯
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDelete(product.id)}
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>暫無產品</p>
        )}
      </div>

      {/* 產品表單 */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingProduct ? '編輯產品' : '新增產品'}</h3>
              <button 
                className="close-btn"
                onClick={handleCancel}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="product-form">
              <div className="form-group">
                <label htmlFor="name">產品名稱 *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="form-control"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="price">價格 *</label>
                <input
                  type="number"
                  id="price"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="form-control"
                  required
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">描述</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-control"
                  rows="3"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="current_stock">當前庫存 *</label>
                  <input
                    type="number"
                    id="current_stock"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({...formData, current_stock: e.target.value})}
                    className="form-control"
                    required
                    min="0"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="min_stock">最低庫存 *</label>
                  <input
                    type="number"
                    id="min_stock"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                    className="form-control"
                    required
                    min="0"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  取消
                </button>
                <button type="submit" className="btn">
                  {editingProduct ? '更新' : '新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
