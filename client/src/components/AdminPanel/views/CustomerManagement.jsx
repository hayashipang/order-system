import React from 'react';

export default function CustomerManagement({
  error,
  success,
  setActiveTab,
  downloadOptions,
  setDownloadOptions,
  handleBatchDownload,
  handleSeparateDownload,
  loading,
  uploadOptions,
  setUploadOptions,
  handleBatchUpload,
  handleSeparateUpload,
  editingCustomer,
  editCustomerForm,
  setEditCustomerForm,
  handleUpdateCustomer,
  cancelEditCustomer,
  customerSearchTerm,
  handleCustomerSearch,
  customerSourceFilter,
  handleSourceFilter,
  filteredCustomers,
  newOrder,
  setNewOrder,
  startEditCustomer,
  handleDeleteCustomer
}) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>客戶管理</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="button success"
            onClick={() => setActiveTab('new-customer')}
            style={{ 
              padding: '10px 20px', 
              fontSize: '16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ 新增客戶
          </button>
        </div>
      </div>
      
      {/* 分離下載功能 */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📥 資料下載</h3>
        
        {/* 下載選項 */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={downloadOptions.customers}
              onChange={(e) => setDownloadOptions(prev => ({ ...prev, customers: e.target.checked }))}
            />
            <span>👥 客戶資料</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={downloadOptions.products}
              onChange={(e) => setDownloadOptions(prev => ({ ...prev, products: e.target.checked }))}
            />
            <span>📦 產品資料</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={downloadOptions.orders}
              onChange={(e) => setDownloadOptions(prev => ({ ...prev, orders: e.target.checked }))}
            />
            <span>📋 訂單資料</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <input
              type="checkbox"
              checked={downloadOptions.posOrders}
              onChange={(e) => setDownloadOptions(prev => ({ ...prev, posOrders: e.target.checked }))}
            />
            <span>🛒 POS銷售訂單</span>
          </label>
        </div>

        {/* 下載按鈕 */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleBatchDownload}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📥 批量下載
          </button>
          
          <button
            onClick={() => handleSeparateDownload('customers')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            👥 客戶
          </button>
          
          <button
            onClick={() => handleSeparateDownload('products')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              color: '#212529',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📦 產品
          </button>
          
          <button
            onClick={() => handleSeparateDownload('orders')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📋 訂單
          </button>
          
          <button
            onClick={() => handleSeparateDownload('posOrders')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fd7e14',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🛒 POS訂單
          </button>
        </div>
      </div>
      
      {/* 分離上傳功能 */}
      <div style={{ 
        backgroundColor: '#fff3cd', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        border: '1px solid #ffeaa7'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#856404' }}>📤 資料上傳</h3>
        
        {/* 上傳選項 */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={uploadOptions.customers}
              onChange={(e) => setUploadOptions(prev => ({ ...prev, customers: e.target.checked }))}
            />
            <span>👥 客戶資料</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={uploadOptions.products}
              onChange={(e) => setUploadOptions(prev => ({ ...prev, products: e.target.checked }))}
            />
            <span>📦 產品資料</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={uploadOptions.orders}
              onChange={(e) => setUploadOptions(prev => ({ ...prev, orders: e.target.checked }))}
            />
            <span>📋 訂單資料</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <input
              type="checkbox"
              checked={uploadOptions.posOrders}
              onChange={(e) => setUploadOptions(prev => ({ ...prev, posOrders: e.target.checked }))}
            />
            <span>🛒 POS銷售訂單</span>
          </label>
        </div>

        {/* 上傳按鈕 */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleBatchUpload}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#fd7e14',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📤 批量上傳
          </button>
          
          <button
            onClick={() => handleSeparateUpload('customers')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            👥 客戶
          </button>
          
          <button
            onClick={() => handleSeparateUpload('products')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffc107',
              color: '#212529',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📦 產品
          </button>
          
          <button
            onClick={() => handleSeparateUpload('orders')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6f42c1',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            📋 訂單
          </button>
          
          <button
            onClick={() => handleSeparateUpload('posOrders')}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🛒 POS訂單
          </button>
        </div>
        
        <div style={{ 
          marginTop: '10px', 
          fontSize: '12px', 
          color: '#856404',
          backgroundColor: '#fff3cd',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #ffeaa7'
        }}>
          ⚠️ <strong>注意：</strong>上傳會清空現有資料並替換為新資料。請確保已備份重要資料。
        </div>
      </div>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      {/* 編輯客戶表單 */}
      {editingCustomer && (
        <div className="card" style={{ marginBottom: '20px', backgroundColor: '#f8f9fa' }}>
          <h3>編輯客戶：{editingCustomer.name}</h3>
          <form onSubmit={handleUpdateCustomer}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">客戶姓名</label>
                <input
                  type="text"
                  className="form-input"
                  value={editCustomerForm.name}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, name: e.target.value })}
                  placeholder="請輸入客戶姓名"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">聯絡電話</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editCustomerForm.phone}
                  onChange={(e) => setEditCustomerForm({ ...editCustomerForm, phone: e.target.value })}
                  placeholder="請輸入聯絡電話"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">送貨地點</label>
              <textarea
                className="form-textarea"
                value={editCustomerForm.address}
                onChange={(e) => setEditCustomerForm({ ...editCustomerForm, address: e.target.value })}
                placeholder="請輸入送貨地點"
              />
            </div>
            <div className="form-group">
              <label className="form-label">便利商店店名</label>
              <input
                type="text"
                className="form-input"
                value={editCustomerForm.family_mart_address}
                onChange={(e) => setEditCustomerForm({ ...editCustomerForm, family_mart_address: e.target.value })}
                placeholder="請輸入便利商店店名"
              />
            </div>
            <div className="form-group">
              <label className="form-label">客戶來源</label>
              <select
                className="form-select"
                value={editCustomerForm.source}
                onChange={(e) => setEditCustomerForm({ ...editCustomerForm, source: e.target.value })}
                required
              >
                <option value="直接來店訂購">直接來店訂購</option>
                <option value="FB訂購">FB訂購</option>
                <option value="IG訂購">IG訂購</option>
                <option value="蝦皮訂購">蝦皮訂購</option>
                <option value="全家好賣訂購">全家好賣訂購</option>
                <option value="7-11賣貨便訂購">7-11賣貨便訂購</option>
                <option value="其他訂購">其他訂購</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">付款方式</label>
              <select
                className="form-select"
                value={editCustomerForm.payment_method}
                onChange={(e) => setEditCustomerForm({ ...editCustomerForm, payment_method: e.target.value })}
                required
              >
                <option value="貨到付款">貨到付款</option>
                <option value="信用卡">信用卡</option>
                <option value="LinePay">LinePay</option>
                <option value="現金">現金</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">訂單編號</label>
              <input
                type="text"
                className="form-input"
                value={editCustomerForm.order_number}
                onChange={(e) => setEditCustomerForm({ ...editCustomerForm, order_number: e.target.value })}
                placeholder="請輸入訂單編號（可選）"
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="button success" disabled={loading}>
                {loading ? '更新中...' : '更新客戶'}
              </button>
              <button 
                type="button" 
                className="button secondary"
                onClick={cancelEditCustomer}
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* 客戶搜尋和篩選 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '10px' }}>
          <div className="form-group">
            <label className="form-label">搜尋客戶</label>
            <input
              type="text"
              className="form-input"
              placeholder="輸入客戶姓名、電話或地址關鍵字..."
              value={customerSearchTerm}
              onChange={(e) => handleCustomerSearch(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">客戶來源</label>
            <select
              className="form-select"
              value={customerSourceFilter}
              onChange={(e) => handleSourceFilter(e.target.value)}
            >
              <option value="">全部來源</option>
              <option value="直接來店訂購">直接來店訂購</option>
              <option value="FB訂購">FB訂購</option>
              <option value="IG訂購">IG訂購</option>
              <option value="蝦皮訂購">蝦皮訂購</option>
              <option value="全家好賣訂購">全家好賣訂購</option>
              <option value="7-11賣貨便訂購">7-11賣貨便訂購</option>
              <option value="其他訂購">其他訂購</option>
            </select>
          </div>
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          找到 {filteredCustomers.length} 位客戶
          {customerSourceFilter && ` (來源: ${customerSourceFilter})`}
        </div>
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
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>訂單編號</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>客戶姓名</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>聯絡電話</th>
                <th style={{ padding: '15px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>送貨地點</th>
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>來源</th>
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>付款方式</th>
                <th style={{ padding: '15px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '15px', textAlign: 'center', color: '#666', fontSize: '14px', fontWeight: '500' }}>
                    {customer.order_number || '-'}
                  </td>
                  <td style={{ padding: '15px', fontWeight: '500' }}>{customer.name}</td>
                  <td style={{ padding: '15px' }}>{customer.phone || '-'}</td>
                  <td style={{ padding: '15px', color: '#666' }}>{customer.address || '-'}</td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: customer.source?.includes('蝦皮') ? '#ff6b35' : 
                                     customer.source?.includes('IG') ? '#e1306c' :
                                     customer.source?.includes('FB') ? '#1877f2' :
                                     customer.source?.includes('全家') ? '#00a651' :
                                     customer.source?.includes('7-11') ? '#ff6600' : '#27ae60',
                      color: 'white'
                    }}>
                      {customer.source || '直接來店訂購'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: customer.payment_method === '信用卡' ? '#3498db' : 
                                     customer.payment_method === 'LinePay' ? '#00c300' :
                                     customer.payment_method === '現金' ? '#95a5a6' : '#e74c3c',
                      color: 'white'
                    }}>
                      {customer.payment_method || '貨到付款'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        className="button"
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          console.log('🔄 從客戶管理下單，更新日期到:', today);
                          setNewOrder({
                            ...newOrder,
                            customer_id: customer.id,
                            order_date: today,
                            delivery_date: '',      // 不要自動塞今天
                            production_date: ''     // 不要自動塞
                          });
                          setActiveTab('new-order');
                        }}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        下單
                      </button>
                      <button
                        className="button secondary"
                        onClick={() => startEditCustomer(customer)}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        編輯
                      </button>
                      <button
                        className="button danger"
                        onClick={() => handleDeleteCustomer(customer.id, customer.name)}
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
          
          {filteredCustomers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              {customerSearchTerm ? '找不到符合條件的客戶' : '尚無客戶資料'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

