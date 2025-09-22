import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';
import { getLocalData } from '../utils/localStorage';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // 新增/編輯產品表單狀態
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      // 使用本地存儲數據
      const data = getLocalData();
      setProducts(data.products);
    } catch (err) {
      setError('載入產品列表失敗: ' + err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (editingProduct) {
        // 更新產品
        await axios.put(`${config.apiUrl}/api/products/${editingProduct.id}`, formData);
        setSuccess('產品更新成功！');
      } else {
        // 新增產品
        await axios.post(`${config.apiUrl}/api/products`, formData);
        setSuccess('產品新增成功！');
      }
      
      // 重置表單並重新載入
      setFormData({ name: '', price: '', description: '' });
      setEditingProduct(null);
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      setError('操作失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('確定要刪除這個產品嗎？')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await axios.delete(`${config.apiUrl}/api/products/${id}`);
      setSuccess('產品刪除成功！');
      fetchProducts();
    } catch (err) {
      setError('刪除失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', price: '', description: '' });
    setEditingProduct(null);
    setShowForm(false);
  };

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>產品管理</h2>
          <button 
            className="button success"
            onClick={() => setShowForm(true)}
          >
            + 新增產品
          </button>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {showForm && (
          <div className="card" style={{ marginBottom: '20px', background: '#f8f9fa' }}>
            <h3>{editingProduct ? '編輯產品' : '新增產品'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">產品名稱</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="請輸入產品名稱"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">價格 (元)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="請輸入價格"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">產品描述</label>
                <textarea
                  className="form-textarea"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="請輸入產品描述"
                  rows="3"
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="button success" disabled={loading}>
                  {loading ? '處理中...' : (editingProduct ? '更新產品' : '新增產品')}
                </button>
                <button type="button" className="button secondary" onClick={handleCancel}>
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {loading && !showForm ? (
          <div className="loading">載入中...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              background: 'white',
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>產品名稱</th>
                  <th style={{ padding: '15px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>價格</th>
                  <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>描述</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '15px', fontWeight: '500' }}>{product.name}</td>
                    <td style={{ padding: '15px', textAlign: 'right', color: '#e74c3c', fontWeight: 'bold' }}>
                      NT$ {parseFloat(product.price).toLocaleString()}
                    </td>
                    <td style={{ padding: '15px', color: '#666' }}>{product.description || '-'}</td>
                    <td style={{ padding: '15px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          className="button"
                          onClick={() => handleEdit(product)}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          編輯
                        </button>
                        <button
                          className="button danger"
                          onClick={() => handleDelete(product.id)}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          刪除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {products.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                尚無產品資料
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2>產品管理說明</h2>
        <div style={{ lineHeight: '1.6', color: '#666' }}>
          <p>• 可以新增、編輯、刪除產品資訊</p>
          <p>• 設定產品價格後，訂單會自動計算金額</p>
          <p>• 產品名稱必須唯一，不能重複</p>
          <p>• 價格請輸入數字，支援小數點</p>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
