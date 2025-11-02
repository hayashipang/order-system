import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

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
  
  // 確保所有輸入字段都有初始值，避免 React 警告
  const getFormValue = (field) => formData[field] || '';

  // 運費設定狀態
  const [shippingFee, setShippingFee] = useState(120);
  const [editingShippingFee, setEditingShippingFee] = useState(false);

  // 產品優先順序設定狀態 (已移除未使用的變數)

  useEffect(() => {
    fetchProducts();
    fetchShippingFee();
  }, []);

  const fetchShippingFee = async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/api/shipping-fee`);
      setShippingFee(response.data.shippingFee);
    } catch (err) {
      console.error('載入運費設定失敗:', err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      // 使用真正的 API 載入產品列表
      const response = await axios.get(`${config.apiUrl}/api/products`);
      setProducts(response.data);
    } catch (err) {
      setError('載入產品列表失敗: ' + err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 同步產品優先順序設定
  const syncProductPriority = async () => {
    try {
      // 調用後端API來同步優先順序設定
      await axios.post(`${config.apiUrl}/api/products/sync-priority`);
      console.log('產品優先順序同步成功');
    } catch (err) {
      console.error('同步產品優先順序失敗:', err);
      // 不顯示錯誤給用戶，因為這不是關鍵操作
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('提交產品數據:', formData);
      console.log('編輯中的產品:', editingProduct);
      
      if (editingProduct) {
        // 更新產品
        console.log('更新產品 API URL:', `${config.apiUrl}/api/products/${editingProduct.id}`);
        const response = await axios.put(`${config.apiUrl}/api/products/${editingProduct.id}`, formData);
        console.log('更新產品響應:', response.data);
        setSuccess('產品更新成功！');
      } else {
        // 新增產品
        console.log('新增產品 API URL:', `${config.apiUrl}/api/products`);
        const response = await axios.post(`${config.apiUrl}/api/products`, formData);
        console.log('新增產品響應:', response.data);
        setSuccess('產品新增成功！');
      }
      
      // 重置表單並重新載入
      setFormData({ name: '', price: '', description: '' });
      setEditingProduct(null);
      setShowForm(false);
      await fetchProducts();
      
      // 同步更新產品優先順序設定
      await syncProductPriority();
    } catch (err) {
      console.error('產品操作錯誤:', err);
      console.error('錯誤響應:', err.response?.data);
      setError('操作失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      price: product.price ? product.price.toString() : '',
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
      await fetchProducts();
      
      // 同步更新產品優先順序設定
      await syncProductPriority();
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

  const handleShippingFeeUpdate = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.put(`${config.apiUrl}/api/shipping-fee`, { shippingFee });
      setSuccess('運費設定更新成功！');
      setEditingShippingFee(false);
    } catch (err) {
      setError('更新運費設定失敗: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
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
                  value={getFormValue('name')}
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
                  value={getFormValue('price')}
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
                  value={getFormValue('description')}
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
        <h2>運費設定</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <label style={{ fontWeight: 'bold' }}>運費金額：</label>
          {editingShippingFee ? (
            <>
              <input
                type="number"
                value={shippingFee}
                onChange={(e) => setShippingFee(parseFloat(e.target.value) || 0)}
                style={{ width: '100px', padding: '5px' }}
                min="0"
                step="1"
              />
              <button 
                className="button success"
                onClick={handleShippingFeeUpdate}
                disabled={loading}
              >
                儲存
              </button>
              <button 
                className="button secondary"
                onClick={() => setEditingShippingFee(false)}
              >
                取消
              </button>
            </>
          ) : (
            <>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
                NT$ {shippingFee}
              </span>
              <button 
                className="button primary"
                onClick={() => setEditingShippingFee(true)}
              >
                編輯
              </button>
            </>
          )}
        </div>
        <div style={{ lineHeight: '1.6', color: '#666', fontSize: '14px' }}>
          <p>• 運費金額用於新增訂單時的運費計算</p>
          <p>• 客戶可選擇「免運費」或「支付運費給快遞公司」</p>
          <p>• 免運費時，我們吸收運費成本（-NT$ 120）</p>
          <p>• 客戶付運費時，費用給快遞公司，不計入我們收入</p>
        </div>
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
