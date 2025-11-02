import React from 'react';

export default function InventoryManagement({
  error,
  success,
  handleInventoryTransaction,
  inventoryForm,
  setInventoryForm,
  products,
  loading,
  handleResetAllStock,
  inventoryData,
  handleResetInventoryTransactions,
  handleDeleteInventoryTransaction,
  inventoryTransactions
}) {
  return (
    <div className="card">
      <h2>📦 庫存管理</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        💡 管理產品庫存，記錄進貨和出貨操作。系統會自動記錄操作時間。
      </p>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* 庫存異動操作表單 */}
      <div className="card" style={{ marginBottom: '20px', background: '#f8f9fa' }}>
        <h3>庫存異動操作</h3>
        <form onSubmit={handleInventoryTransaction}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr 120px 1fr 150px', 
            gap: '15px', 
            marginBottom: '15px',
            alignItems: 'end'
          }}>
            <div className="form-group">
              <label className="form-label">選擇產品</label>
              <select
                className="form-select"
                value={inventoryForm.product_id}
                onChange={(e) => setInventoryForm({ ...inventoryForm, product_id: e.target.value })}
                required
                style={{ width: '100%' }}
              >
                <option value="">請選擇產品</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">異動類型</label>
              <select
                className="form-select"
                value={inventoryForm.transaction_type}
                onChange={(e) => setInventoryForm({ ...inventoryForm, transaction_type: e.target.value })}
                required
                style={{ width: '100%' }}
              >
                <option value="in">📥 進貨</option>
                <option value="out">📤 出貨</option>
              </select>
            </div>
            
            <div className="form-group">
              <label className="form-label">數量</label>
              <input
                type="number"
                className="form-input"
                value={inventoryForm.quantity}
                onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: e.target.value })}
                placeholder="請輸入數量"
                min="1"
                required
                style={{ width: '100%' }}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">備註</label>
              <input
                type="text"
                className="form-input"
                value={inventoryForm.notes}
                onChange={(e) => setInventoryForm({ ...inventoryForm, notes: e.target.value })}
                placeholder="可選備註"
                style={{ width: '100%' }}
              />
            </div>
            
            <div className="form-group">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: '#27ae60',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                  transition: 'all 0.3s ease'
                }}
              >
                {loading ? '處理中...' : '確認異動'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 庫存狀態表格 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0 }}>庫存狀態</h3>
          <button
            type="button"
            onClick={handleResetAllStock}
            disabled={loading}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 'bold',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.3s ease'
            }}
            title="將所有產品的庫存設置為0"
          >
            🗑️ 一鍵歸零
          </button>
        </div>
        {loading ? (
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
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>目前庫存</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>最低庫存</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>庫存狀態</th>
                  <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>最後更新</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((product) => {
                  const isLowStock = product.current_stock <= product.min_stock;
                  return (
                    <tr key={product.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '15px', fontWeight: '500' }}>{product.name}</td>
                      <td style={{ 
                        padding: '15px', 
                        textAlign: 'center', 
                        fontWeight: 'bold',
                        color: isLowStock ? '#e74c3c' : '#27ae60'
                      }}>
                        {product.current_stock}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>{product.min_stock}</td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: isLowStock ? '#e74c3c' : '#27ae60',
                          color: 'white'
                        }}>
                          {isLowStock ? '⚠️ 庫存不足' : '✅ 庫存正常'}
                        </span>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                        {product.updated_at ? new Date(product.updated_at).toLocaleString('zh-TW') : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 庫存異動記錄 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3>庫存異動記錄</h3>
          <button
            type="button"
            onClick={handleResetInventoryTransactions}
            style={{
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            disabled={loading}
          >
            🗑️ 重置所有記錄
          </button>
        </div>
        {loading ? (
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
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>產品名稱</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>異動類型</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>數量</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>備註</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>操作時間</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {inventoryTransactions.map((transaction) => (
                  <tr key={transaction.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{transaction.product_name}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: transaction.transaction_type === 'in' ? '#27ae60' : '#e74c3c',
                        color: 'white'
                      }}>
                        {transaction.transaction_type === 'in' ? '📥 進貨' : '📤 出貨'}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'center', 
                      fontWeight: 'bold',
                      color: transaction.transaction_type === 'in' ? '#27ae60' : '#e74c3c'
                    }}>
                      {transaction.transaction_type === 'in' ? '+' : '-'}{transaction.quantity}
                    </td>
                    <td style={{ padding: '12px', color: '#666' }}>{transaction.notes || '-'}</td>
                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                      {transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleString('zh-TW') : '-'}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleDeleteInventoryTransaction(transaction.id)}
                        style={{
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        disabled={loading}
                        title="刪除此筆記錄"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {inventoryTransactions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                尚無庫存異動記錄
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

