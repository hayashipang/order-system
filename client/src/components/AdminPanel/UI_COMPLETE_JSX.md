# AdminPanel 完整 JSX 内容

## 主 return 区块（4332-4532行）

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {user?.role === 'admin' && (
            <>
          <button 
            className={`nav-button ${activeTab === 'new-order' ? 'active' : ''}`}
            onClick={() => setActiveTab('new-order')}
            style={{ 
              backgroundColor: activeTab === 'new-order' ? '#27ae60' : '#2ecc71', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ 新增訂單
          </button>
          <button 
            className={`nav-button ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
            style={{ 
              backgroundColor: activeTab === 'customers' ? '#3498db' : '#5dade2', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ 客戶管理
          </button>
          <button 
            className={`nav-button ${activeTab === 'order-history' ? 'active' : ''}`}
            onClick={() => setActiveTab('order-history')}
            style={{ 
              backgroundColor: activeTab === 'order-history' ? '#9b59b6' : '#bb8fce', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📋 訂單歷史
          </button>
            </>
          )}
          <button 
            className={`nav-button ${activeTab === 'inventory-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory-management')}
            style={{ 
              backgroundColor: activeTab === 'inventory-management' ? '#8e44ad' : '#a569bd', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📦 庫存管理
          </button>
          {/* 參數測試功能已移除 */}
          <button 
            className={`nav-button ${activeTab === 'shipping-management' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipping-management')}
            style={{ 
              backgroundColor: activeTab === 'shipping-management' ? '#e67e22' : '#f39c12', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {user?.role === 'kitchen' ? '🚚 廚房出貨訂單' : '🚚 出貨管理'}
          </button>
          {editingOrder && (
            <button 
              className={`nav-button ${activeTab === 'edit-order' ? 'active' : ''}`}
              onClick={() => setActiveTab('edit-order')}
              style={{ 
                backgroundColor: activeTab === 'edit-order' ? '#e67e22' : '#f39c12', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ✏️ 編輯訂單
            </button>
          )}
        </div>
      </div>

      {activeTab === 'new-order' && renderNewOrderForm()}
      {activeTab === 'customers' && renderCustomerManagement()}
      {activeTab === 'new-customer' && renderNewCustomerForm()}
      {activeTab === 'order-history' && renderOrderHistory()}
      {activeTab === 'inventory-management' && renderInventoryManagement()}
      {/* 智能排程功能已移除 */}
      {/* 參數測試內容已移除 */}
      {false && (
        <div style={{ padding: '20px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <h2 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>🧪 智能參數測試與優化</h2>
            <p style={{ margin: '0', opacity: 0.9 }}>
              使用AI演算法優化排程參數，提升系統效率
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* 功能介紹卡片 */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>🎯 測試功能</h3>
              <ul style={{ color: '#666', lineHeight: '1.6' }}>
                <li>多種AI優化演算法</li>
                <li>參數敏感性分析</li>
                <li>績效指標評估</li>
                <li>智能參數推薦</li>
              </ul>
            </div>

            {/* 演算法介紹卡片 */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>🤖 AI演算法</h3>
              <ul style={{ color: '#666', lineHeight: '1.6' }}>
                <li><strong>遺傳算法</strong> - 模擬生物進化</li>
                <li><strong>粒子群優化</strong> - 快速收斂</li>
                <li><strong>模擬退火</strong> - 避免局部最優</li>
                <li><strong>強化學習</strong> - 動態學習</li>
              </ul>
            </div>

            {/* 優化目標卡片 */}
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>📊 優化目標</h3>
              <ul style={{ color: '#666', lineHeight: '1.6' }}>
                <li>提升訂單完成率</li>
                <li>優化產能利用率</li>
                <li>減少加班時數</li>
                <li>提高客戶滿意度</li>
              </ul>
            </div>
          </div>

          {/* 操作按鈕已移除 */}

          {/* 使用說明 */}
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            marginTop: '20px',
            border: '1px solid #e9ecef'
          }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>📖 使用說明</h3>
            <ol style={{ color: '#666', lineHeight: '1.8' }}>
              <li><strong>設定測試參數</strong> - 調整日產能、人力數量等基礎參數</li>
              <li><strong>選擇策略參數</strong> - 設定未完成訂單處理方式和新訂單插入策略</li>
              <li><strong>選擇AI演算法</strong> - 根據需求選擇適合的優化演算法</li>
              <li><strong>執行測試</strong> - 系統會生成測試訂單並執行優化</li>
              <li><strong>查看結果</strong> - 分析推薦參數和預期改善效果</li>
              <li><strong>應用參數</strong> - 一鍵應用推薦的參數到實際系統</li>
            </ol>
          </div>
        </div>
      )}
      {activeTab === 'shipping-management' && renderShippingManagement()}
      {activeTab === 'edit-order' && renderEditOrderForm()}
      
      {/* 參數測試彈窗已移除 */}
    </div>
  );

## renderNewOrderForm (1047-1415行)

```jsx
  const renderNewOrderForm = () => (
    <div className="card">
      <h2>新增訂單</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <form onSubmit={handleAddOrder}>
        <div className="form-group">
          <label className="form-label">客戶</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              className="form-select"
              value={newOrder.customer_id}
              onChange={(e) => setNewOrder({ ...newOrder, customer_id: e.target.value })}
              required
              style={{ flex: 1 }}
            >
              <option value="">請選擇客戶 ({customers.length} 位客戶)</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} - {customer.phone || '無電話'}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="button secondary"
              onClick={() => setActiveTab('customers')}
              style={{ padding: '12px 16px', fontSize: '14px' }}
            >
              查看客戶列表
            </button>
          </div>
          {newOrder.customer_id && (
            <div style={{ 
              marginTop: '8px', 
              padding: '8px 12px', 
              background: '#e8f4fd', 
              borderRadius: '6px',
              fontSize: '14px',
              color: '#2c3e50'
            }}>
              已選擇客戶: {customers.find(c => c.id === parseInt(newOrder.customer_id))?.name}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">訂單日期</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="date"
                className="form-input"
                value={newOrder.order_date}
                onChange={(e) => setNewOrder({ ...newOrder, order_date: e.target.value })}
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  console.log('🔄 手動更新訂單日期到:', today);
                  setNewOrder(prev => ({ ...prev, order_date: today }));
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📅 今天
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">交貨日期</label>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="date"
                className="form-input"
                value={newOrder.delivery_date}
                onChange={(e) => setNewOrder({ ...newOrder, delivery_date: e.target.value })}
                required
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  console.log('🔄 手動更新交貨日期到:', today);
                  setNewOrder(prev => ({ ...prev, delivery_date: today }));
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📅 今天
              </button>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">訂單項目</label>
          
          {/* 表頭 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 80px 100px 1fr 120px 80px',
            gap: '10px',
            marginBottom: '10px',
            padding: '10px',
            background: '#e9ecef',
            borderRadius: '8px',
            fontWeight: 'bold',
            fontSize: '14px',
            color: '#495057'
          }}>
            <div>產品</div>
            <div style={{ textAlign: 'center' }}>數量</div>
            <div style={{ textAlign: 'center' }}>單價</div>
            <div>特殊要求</div>
            <div style={{ textAlign: 'center' }}>小計</div>
            <div style={{ textAlign: 'center' }}>操作</div>
          </div>

          {newOrder.items.map((item, index) => (
            <div key={index} style={{
              backgroundColor: item.is_gift ? '#fff3cd' : '#f8f9fa',
              border: item.is_gift ? '2px solid #ffc107' : '1px solid #e9ecef',
              borderRadius: item.is_gift ? '8px' : '0',
              padding: item.is_gift ? '10px' : '0',
              marginBottom: item.is_gift ? '10px' : '0'
            }}>
              {item.is_gift && (
                <div style={{
                  color: '#856404',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  🎁 贈送項目
                </div>
              )}
              <div className="item-row">
              <select
                className="form-select"
                value={item.product_name}
                onChange={(e) => {
                  const raw = e.target.value || '';
                  console.log('產品選擇變更:', raw);
                  const norm = raw.trim().toLowerCase();
                  const selectedProduct = products.find(p => (p.name || '').trim().toLowerCase() === norm);
                  console.log('找到的產品:', selectedProduct);
                  // 設定產品名稱
                  updateOrderItem(index, 'product_name', raw);
                  // 一律從 1 開始（不依賴 current_stock）
                  updateOrderItem(index, 'quantity', 1);
                  // 如果是贈送項目，保持價格為 -30；否則帶入產品售價
                  if (selectedProduct && !item.is_gift) {
                    updateOrderItem(index, 'unit_price', selectedProduct.price);
                  }
                }}
                required
              >
                <option value="">請選擇產品</option>
                {products.map(product => (
                  <option key={product.id} value={product.name}>
                    {product.name} - NT$ {product.price}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="form-input"
                value={item.quantity}
                onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                min="1"
                required
              />
              <input
                type="number"
                className="form-input"
                value={item.unit_price}
                onChange={(e) => updateOrderItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                min={item.is_gift ? undefined : "0"}
                step="0.01"
                placeholder="單價"
                required
              />
              <input
                type="text"
                className="form-input"
                placeholder="特殊要求"
                value={item.special_notes}
                onChange={(e) => updateOrderItem(index, 'special_notes', e.target.value)}
              />
              <div className="subtotal-display">
                小計: NT$ {((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toLocaleString()}
              </div>
              {newOrder.items.length > 1 && (
                <button
                  type="button"
                  className="remove-button"
                  onClick={() => removeOrderItem(index)}
                >
                  移除
                </button>
              )}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button
            type="button"
            className="add-item-button"
            onClick={addOrderItem}
          >
            + 新增產品
          </button>
            <button
              type="button"
              onClick={addGiftItem}
              style={{
                backgroundColor: '#e67e22',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 20px',
                cursor: 'pointer'
              }}
            >
              🎁 贈送1瓶
            </button>
          </div>
          
          <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            background: '#e8f4fd', 
            borderRadius: '8px',
            textAlign: 'right'
          }}>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: '#e74c3c' 
            }}>
              訂單總計: NT$ {(newOrder.items || []).reduce((total, item) => total + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">備註</label>
          <textarea
            className="form-textarea"
            value={newOrder.notes}
            onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
            placeholder="訂單備註..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">運費選項</label>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="shipping_type"
                value="none"
                checked={newOrder.shipping_type === 'none'}
                onChange={(e) => setNewOrder({ ...newOrder, shipping_type: e.target.value })}
              />
              <span>無運費</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="shipping_type"
                value="paid"
                checked={newOrder.shipping_type === 'paid'}
                onChange={(e) => setNewOrder({ ...newOrder, shipping_type: e.target.value })}
              />
              <span>客戶付運費 NT$ {shippingFee} (給快遞公司)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="shipping_type"
                value="free"
                checked={newOrder.shipping_type === 'free'}
                onChange={(e) => setNewOrder({ ...newOrder, shipping_type: e.target.value })}
              />
              <span>免運費 (扣 NT$ {shippingFee})</span>
            </label>
          </div>
        </div>

        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          background: '#e8f4fd', 
          borderRadius: '8px',
          textAlign: 'right'
        }}>
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            color: '#e74c3c' 
          }}>
            最終總計: NT$ {(calculateTotalAmount(newOrder, shippingFee, customers) || 0).toLocaleString()}
          </div>
          
          {/* 顯示明細 */}
            <div style={{ 
              fontSize: '14px', 
              color: '#7f8c8d',
            marginTop: '5px',
            lineHeight: '1.4'
          }}>
            <div>產品總計: NT$ {(newOrder.items || []).reduce((total, item) => total + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0).toLocaleString()}</div>
            
            {/* 信用卡手續費 */}
            {calculateCreditCardFee(newOrder, customers) > 0 && (
              <div style={{ color: '#e67e22', fontWeight: 'bold' }}>
                💳 信用卡手續費扣除 (2%): NT$ {(calculateCreditCardFee(newOrder, customers) || 0).toLocaleString()}
              </div>
            )}
            
            {/* 蝦皮費用 */}
            {calculateShopeeFee(newOrder, customers) > 0 && (
              <div style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                🛒 蝦皮訂單費用扣除 (7.5%): NT$ {(calculateShopeeFee(newOrder, customers) || 0).toLocaleString()}
              </div>
            )}
            
            
            {/* 運費說明 */}
            {newOrder.shipping_type !== 'none' && (
              <div>
              {newOrder.shipping_type === 'paid' ? 
                  `運費: NT$ ${shippingFee} (客戶另付給快遞公司)` :
                  `免運費成本: NT$ ${shippingFee}`
              }
            </div>
          )}
          </div>
        </div>

        <button type="submit" className="button success" disabled={loading}>
          {loading ? '建立中...' : '建立訂單'}
        </button>
      </form>
    </div>
  );
```

## renderNewCustomerForm (1417-1523行)

```jsx
  const renderNewCustomerForm = () => (
    <div className="card">
      <h2>新增客戶</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <form onSubmit={handleAddCustomer}>
        <div className="form-group">
          <label className="form-label">客戶姓名</label>
          <input
            type="text"
            className="form-input"
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            placeholder="請輸入客戶姓名"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">聯絡電話</label>
          <input
            type="tel"
            className="form-input"
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            placeholder="請輸入聯絡電話"
          />
        </div>

        <div className="form-group">
          <label className="form-label">送貨地點</label>
          <textarea
            className="form-textarea"
            value={newCustomer.address}
            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
            placeholder="請輸入送貨地點"
          />
        </div>

        <div className="form-group">
          <label className="form-label">便利商店店名</label>
          <input
            type="text"
            className="form-input"
            value={newCustomer.family_mart_address}
            onChange={(e) => setNewCustomer({ ...newCustomer, family_mart_address: e.target.value })}
            placeholder="請輸入便利商店店名"
          />
        </div>

        <div className="form-group">
          <label className="form-label">客戶來源</label>
          <select
            className="form-select"
            value={newCustomer.source}
            onChange={(e) => setNewCustomer({ ...newCustomer, source: e.target.value })}
            required
          >
            <option value="蝦皮訂購">蝦皮訂購</option>
            <option value="網路訂購">網路訂購</option>
            <option value="現場訂購">現場訂購</option>
            <option value="親自送達">親自送達</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">付款方式</label>
          <select
            className="form-select"
            value={newCustomer.payment_method}
            onChange={(e) => setNewCustomer({ ...newCustomer, payment_method: e.target.value })}
            required
          >
            <option value="銀行匯款">銀行匯款</option>
            <option value="面交付款">面交付款</option>
            <option value="信用卡付款">信用卡付款</option>
            <option value="LinePay">LinePay</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">訂單編號</label>
          <input
            type="text"
            className="form-input"
            value={newCustomer.order_number}
            onChange={(e) => setNewCustomer({ ...newCustomer, order_number: e.target.value })}
            placeholder="請輸入訂單編號（可選）"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="button success" disabled={loading}>
            {loading ? '新增中...' : '新增客戶'}
          </button>
          <button 
            type="button" 
            className="button secondary"
            onClick={() => setActiveTab('customers')}
          >
            查看客戶列表
          </button>
        </div>
      </form>
    </div>
  );
```

## renderEditOrderForm (1525-1772行)

```jsx
  const renderEditOrderForm = () => (
    <div className="card">
      <h2>編輯訂單 #{editingOrder}</h2>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}
      
      <form onSubmit={handleUpdateOrder}>
        <div className="form-group">
          <label className="form-label">客戶</label>
          <select
            className="form-select"
            value={editOrderForm.customer_id}
            onChange={(e) => setEditOrderForm({ ...editOrderForm, customer_id: e.target.value })}
            required
          >
            <option value="">請選擇客戶</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.phone}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">訂單日期</label>
            <input
              type="date"
              className="form-input"
              value={editOrderForm.order_date}
              onChange={(e) => setEditOrderForm({ ...editOrderForm, order_date: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">交貨日期</label>
            <input
              type="date"
              className="form-input"
              value={editOrderForm.delivery_date}
              onChange={(e) => setEditOrderForm({ ...editOrderForm, delivery_date: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">運費設定</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              className="form-select"
              value={editOrderForm.shipping_type}
              onChange={(e) => setEditOrderForm({ ...editOrderForm, shipping_type: e.target.value })}
            >
              <option value="none">無運費</option>
              <option value="paid">客戶付運費</option>
              <option value="free">免運費</option>
            </select>
            {editOrderForm.shipping_type === 'free' && (
              <span style={{ color: '#e74c3c', fontSize: '14px' }}>
                我們將吸收 NT$ {shippingFee} 運費成本
              </span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">訂單項目</label>
          {editOrderForm.items.map((item, index) => (
            <div key={index} style={{
              backgroundColor: item.is_gift ? '#fff3cd' : 'transparent',
              border: item.is_gift ? '2px solid #ffc107' : 'none',
              borderRadius: item.is_gift ? '8px' : '0',
              padding: item.is_gift ? '10px' : '0',
              marginBottom: item.is_gift ? '10px' : '0'
            }}>
              {item.is_gift && (
                <div style={{
                  color: '#856404',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  🎁 贈送項目
                </div>
              )}
              <div className="item-row">
              <select
                className="form-input"
                value={item.product_name}
                onChange={(e) => {
                  console.log('編輯訂單 - 產品選擇變更:', e.target.value);
                  console.log('編輯訂單 - 當前產品列表:', products);
                  console.log('編輯訂單 - 產品列表長度:', products.length);
                  const selectedProduct = products.find(p => p.name === e.target.value);
                  console.log('編輯訂單 - 找到的產品:', selectedProduct);
                  
                  // 一次性更新產品名稱和價格，避免狀態競爭
                  const updatedItems = [...editOrderForm.items];
                  updatedItems[index] = { 
                    ...updatedItems[index], 
                    product_name: e.target.value,
                    unit_price: (selectedProduct && !item.is_gift) ? selectedProduct.price : updatedItems[index].unit_price
                  };
                  const newForm = { ...editOrderForm, items: updatedItems };
                  setEditOrderForm(newForm);
                  console.log('編輯訂單 - 一次性更新完成:', newForm);
                }}
                required
              >
                <option value="">請選擇產品</option>
                {products.length > 0 ? (
                  products.map(product => (
                    <option key={product.id} value={product.name}>
                      {product.name} - NT$ {product.price}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>載入中...</option>
                )}
              </select>
              <input
                type="number"
                className="form-input"
                value={item.quantity}
                onChange={(e) => updateEditOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                min="1"
                required
              />
              <input
                type="number"
                className="form-input"
                value={item.unit_price}
                onChange={(e) => updateEditOrderItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                min={item.is_gift ? undefined : "0"}
                step="0.01"
                placeholder="單價"
                required
              />
              <input
                type="text"
                className="form-input"
                placeholder="特殊要求"
                value={item.special_notes}
                onChange={(e) => updateEditOrderItem(index, 'special_notes', e.target.value)}
              />
              <select
                className="form-input"
                value={item.status}
                onChange={(e) => updateEditOrderItem(index, 'status', e.target.value)}
              >
                <option value="pending">待製作</option>
                <option value="completed">已完成</option>
              </select>
              <div style={{ 
                display: 'flex',
                gap: '5px',
                alignItems: 'center'
              }}>
                <button
                  type="button"
                  onClick={() => removeEditOrderItem(index)}
                  disabled={editOrderForm.items.length === 1}
                  style={{
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    cursor: editOrderForm.items.length === 1 ? 'not-allowed' : 'pointer',
                    opacity: editOrderForm.items.length === 1 ? 0.5 : 1
                  }}
                >
                  ✕
                </button>
              </div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={addEditOrderItem}
              style={{
                backgroundColor: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 20px',
                cursor: 'pointer'
              }}
            >
              + 新增項目
            </button>
            <button
              type="button"
              onClick={() => {
                setEditOrderForm({
                  ...editOrderForm,
                  items: [...editOrderForm.items, { product_name: '隨機口味', quantity: 1, unit_price: -30, special_notes: '', status: 'pending', is_gift: true }]
                });
              }}
              style={{
                backgroundColor: '#e67e22',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '10px 20px',
                cursor: 'pointer'
              }}
            >
              🎁 贈送1瓶
            </button>
          </div>
        </div>


        <div className="form-group">
          <label className="form-label">備註</label>
          <textarea
            className="form-textarea"
            value={editOrderForm.notes}
            onChange={(e) => setEditOrderForm({ ...editOrderForm, notes: e.target.value })}
            placeholder="訂單備註..."
            rows="3"
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="submit" className="button success" disabled={loading}>
            {loading ? '更新中...' : '更新訂單'}
          </button>
          <button 
            type="button" 
            className="button secondary"
            onClick={() => {
              setEditingOrder(null);
              setActiveTab('order-history');
            }}
          >
            取消編輯
          </button>
        </div>
      </form>
    </div>
  );
```

## renderCustomerManagement (2421-3001行)

```jsx
  const renderCustomerManagement = () => (
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
```

## renderOrderHistory (3085-3615行)

```jsx
  const renderOrderHistory = () => (
    <div className="card">
      <h2>訂單歷史查詢</h2>
      
      {/* 客戶搜尋區域 */}
      <div style={{ marginBottom: '20px' }}>
        <div className="form-group">
          <label className="form-label">搜尋客戶</label>
          <input
            type="text"
            className="form-input"
            placeholder="輸入客戶姓名、電話或地址關鍵字..."
            value={historyCustomerSearchTerm}
            onChange={(e) => handleHistoryCustomerSearch(e.target.value)}
          />
        </div>
        {filteredHistoryCustomers.length > 0 && (
          <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
            找到 {filteredHistoryCustomers.length} 位客戶
          </div>
        )}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
        <div className="form-group">
          <label className="form-label">選擇客戶</label>
          <select
            className="form-select"
            value={historyFilters.customer_id}
            onChange={(e) => setHistoryFilters({ ...historyFilters, customer_id: e.target.value })}
          >
            <option value="">全部客戶</option>
            {filteredHistoryCustomers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name} ({customer.phone})
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">訂單類型</label>
          <select
            className="form-select"
            value={historyFilters.order_type}
            onChange={(e) => setHistoryFilters({ ...historyFilters, order_type: e.target.value })}
          >
            <option value="">全部訂單</option>
            <option value="online">網路訂單</option>
            <option value="walk-in">現場銷售</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">開始日期</label>
          <input
            type="date"
            className="form-input"
            value={historyFilters.start_date}
            onChange={(e) => setHistoryFilters({ ...historyFilters, start_date: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label className="form-label">結束日期</label>
          <input
            type="date"
            className="form-input"
            value={historyFilters.end_date}
            onChange={(e) => setHistoryFilters({ ...historyFilters, end_date: e.target.value })}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
      <button 
        className="button" 
        onClick={() => fetchOrderHistory(true)} // 強制重新載入
        disabled={loading}
      >
        {loading ? '查詢中...' : '🔍 查詢訂單'}
      </button>

      <button 
        className="button" 
        onClick={() => {
          const today = new Date().toISOString().split('T')[0];
          setHistoryFilters({
            customer_id: '',
            start_date: today, // ✅ 清除篩選後，恢復為今天
            end_date: today,   // ✅ 清除篩選後，恢復為今天
            order_type: ''
          });
          setHistoryCustomerSearchTerm('');
          setFilteredHistoryCustomers(customers);
          setOrderHistory([]);
        }}
        style={{ backgroundColor: '#95a5a6', color: 'white' }}
      >
        🗑️ 清除篩選
      </button>

      {orderHistory.length > 0 && (
          <>
          <button 
            className="button" 
            onClick={exportToCSV}
            style={{ backgroundColor: '#27ae60', color: 'white' }}
          >
            📊 匯出 CSV
          </button>
            <button 
              className="button" 
              onClick={deleteOrderHistory}
              disabled={loading}
              style={{ backgroundColor: '#e74c3c', color: 'white' }}
              title="刪除符合當前篩選條件的所有訂單"
            >
              🗑️ 刪除歷史訂單
            </button>
          </>
        )}
      </div>

      {/* 顯示當前篩選條件 */}
      {(historyCustomerSearchTerm || historyFilters.customer_id || historyFilters.start_date || historyFilters.end_date || historyFilters.order_type) && (
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          border: '1px solid #dee2e6'
        }}>
          <strong>當前篩選條件：</strong>
          {historyCustomerSearchTerm && (
            <span style={{ marginLeft: '10px', color: '#6f42c1' }}>
              搜尋："{historyCustomerSearchTerm}"
            </span>
          )}
          {historyFilters.customer_id && (
            <span style={{ marginLeft: '10px', color: '#007bff' }}>
              客戶：{customers.find(c => c.id === parseInt(historyFilters.customer_id))?.name || '未知客戶'}
            </span>
          )}
          {historyFilters.start_date && (
            <span style={{ marginLeft: '10px', color: '#28a745' }}>
              開始日期：{historyFilters.start_date}
            </span>
          )}
          {historyFilters.end_date && (
            <span style={{ marginLeft: '10px', color: '#dc3545' }}>
              結束日期：{historyFilters.end_date}
            </span>
          )}
          {historyFilters.order_type && (
            <span style={{ marginLeft: '10px', color: '#6f42c1' }}>
              訂單類型：{historyFilters.order_type === 'online' ? '網路訂單' : '現場銷售'}
            </span>
          )}
        </div>
      )}

      {orderHistory.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            fontSize: '14px',
            backgroundColor: 'white',
              borderRadius: '8px', 
            overflow: 'hidden',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' }}>客戶名稱</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' }}>訂單日期</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' }}>出貨日期</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' }}>訂購產品</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>數量</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>單價</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>小計</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>狀態</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left', fontWeight: 'bold' }}>備註</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center', fontWeight: 'bold' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {orderHistory.map((order, orderIndex) => {
                const items = order.items && order.items.length > 0 ? order.items : [];
                const hasFreeShipping = order.shipping_type === 'free' && order.shipping_fee < 0;
                
                // 確保每個訂單都有唯一的 key
                const orderKey = order.id || `order-${orderIndex}-${order.customer_name || 'unknown'}`;
                
                return (
                  <React.Fragment key={orderKey}>
                    {/* 產品項目 */}
                    {items.map((item, itemIndex) => (
                      <tr key={`${orderKey}-item-${itemIndex}`} style={{ 
                        backgroundColor: orderIndex % 2 === 0 ? 'white' : '#f8f9fa' 
                      }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.customer_name || '未知客戶'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.order_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.delivery_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {item.is_gift ? (
                            <span style={{ color: '#e67e22', fontWeight: 'bold' }}>
                              🎁 {item.product_name} (贈送)
                            </span>
                          ) : (
                            item.product_name
                          )}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                          ${item.unit_price}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold' }}>
                          ${item.quantity * item.unit_price}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                            background: order.shipping_status === 'shipped' ? '#27ae60' : '#f39c12',
                  color: 'white',
                  fontSize: '12px'
                }}>
                            {order.shipping_status === 'shipped' ? '已出貨' : '待出貨'}
                </span>
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.order_type === 'walk-in' 
                            ? `付款方式: ${order.notes?.includes('cash') ? 'cash' : 'card'}`
                            : (item.special_notes || order.notes)
                          }
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          {itemIndex === 0 ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                onClick={() => handleEditOrder(order.id)}
                                style={{
                                  backgroundColor: '#f39c12',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                ✏️ 編輯
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order.id, order.customer_name || '未知客戶', order.order_date)}
                                style={{
                                  backgroundColor: '#e74c3c',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                🗑️ 刪除
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                    
                    {/* 免運費項目 */}
                    {hasFreeShipping ? (
                      <tr key={`${orderKey}-freeshipping`} style={{ 
                        backgroundColor: '#fff3cd',
                        border: '2px solid #ffc107'
                      }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.customer_name || '未知客戶'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.order_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.delivery_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', color: '#e74c3c' }}>
                          🚚 免運費
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          1
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                          ${Math.abs(order.shipping_fee)}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold', color: '#e74c3c' }}>
                          -${Math.abs(order.shipping_fee)}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          {/* ✅ 免運費行的狀態欄位空白，因為備註欄位已經有說明 */}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          免運費優惠
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          {/* 免運費行不需要編輯按鈕 */}
                        </td>
                      </tr>
                    ) : null}
                    
                    {/* 信用卡手續費項目 */}
                    {order.credit_card_fee && order.credit_card_fee > 0 ? (
                      <tr key={`${orderKey}-creditcardfee`} style={{ 
                        backgroundColor: '#fef5e7',
                        border: '2px solid #e67e22'
                      }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.customer_name || '未知客戶'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.order_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.delivery_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', color: '#e67e22' }}>
                          💳 信用卡手續費
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          1
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                          ${order.credit_card_fee}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold', color: '#e67e22' }}>
                          -${order.credit_card_fee}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          {/* ✅ 信用卡手續費行的狀態欄位空白，因為備註欄位已經有說明 */}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          信用卡手續費扣除
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          {/* 手續費行不需要編輯按鈕 */}
                        </td>
                      </tr>
                    ) : null}
                    
                    {/* 蝦皮費用項目 */}
                    {order.shopee_fee && order.shopee_fee > 0 ? (
                      <tr key={`${orderKey}-shopeefee`} style={{ 
                        backgroundColor: '#fef2f2',
                        border: '2px solid #e74c3c'
                      }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.customer_name || '未知客戶'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.order_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.delivery_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', fontWeight: 'bold', color: '#e74c3c' }}>
                          🛒 蝦皮訂單費用
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          1
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                          ${order.shopee_fee}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right', fontWeight: 'bold', color: '#e74c3c' }}>
                          -${order.shopee_fee}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          {/* ✅ 蝦皮訂單費用行的狀態欄位空白，因為備註欄位已經有說明 */}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          蝦皮訂單費用扣除
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          {/* 手續費行不需要編輯按鈕 */}
                        </td>
                      </tr>
                    ) : null}
                    
                    
                    {/* 無產品的情況 - 已隱藏，避免顯示無意義的 "0" */}
                    {/* {items.length === 0 && !hasFreeShipping && (
                      <tr key={orderKey} style={{ 
                        backgroundColor: orderIndex % 2 === 0 ? 'white' : '#f8f9fa' 
                      }}>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.customer_name || '未知客戶'}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.order_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {new Date(order.delivery_date).toLocaleDateString('zh-TW', {
                            timeZone: 'Asia/Taipei',
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', color: '#999' }}>
                          無產品
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          0
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                          $0
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                          $0
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  background: order.status === 'shipped' ? '#27ae60' : '#f39c12',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  {order.status === 'shipped' ? '已出貨' : '待出貨'}
                </span>
              </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                          {order.notes}
                        </td>
                        <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleEditOrder(order.id)}
                              style={{
                                backgroundColor: '#f39c12',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✏️ 編輯
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id, order.customer_name, order.order_date)}
                              style={{
                                backgroundColor: '#e74c3c',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              🗑️ 刪除
                            </button>
                          </div>
                        </td>
                      </tr>
                    */}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
```

## renderShippingManagement (3617-4028行)

```jsx
  const renderShippingManagement = () => (
    <div className="card">
      <h2>{user?.role === 'kitchen' ? '🚚 廚房出貨訂單' : '🚚 出貨管理'}</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        💡 選擇配送日期來查看當天需要出貨的訂單。只有製作完成的訂單才能標記為已出貨。
      </p>
      
      {/* 日期選擇和視圖切換 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowWeeklyOverview(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: showWeeklyOverview ? '#95a5a6' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📅 單日出貨
          </button>
          <button
            onClick={() => setShowWeeklyOverview(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: showWeeklyOverview ? '#3498db' : '#95a5a6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            📊 週出貨概覽
          </button>
        </div>
        
        {!showWeeklyOverview && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              選擇配送日期：
            </label>
            <input
              type="date"
              value={shippingDate}
              onChange={(e) => setShippingDate(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                width: '200px'
              }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              選擇日期後會自動載入該日期的出貨訂單
            </div>
          </div>
        )}
        
        {showWeeklyOverview && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
              選擇週開始日期：
            </label>
            <input
              type="date"
              value={shippingDate}
              onChange={(e) => setShippingDate(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                width: '200px'
              }}
            />
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              選擇日期後會自動載入該週的出貨概覽
            </div>
          </div>
        )}
      </div>

      {/* 週出貨概覽 */}
      {showWeeklyOverview && (
        <div style={{ marginBottom: '20px' }}>
          <h3>📊 未來一週出貨概覽</h3>
          {weeklyShippingData.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
              {weeklyShippingData.map((dayData, index) => {
                const date = new Date(dayData.date);
                const isToday = dayData.date === new Date().toISOString().split('T')[0];
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                
                return (
                  <div
                    key={dayData.date}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '15px',
                      backgroundColor: isToday ? '#e8f5e8' : isWeekend ? '#f8f9fa' : '#fff',
                      borderLeft: isToday ? '4px solid #27ae60' : isWeekend ? '4px solid #95a5a6' : '4px solid #3498db'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '10px', color: isToday ? '#27ae60' : '#333' }}>
                      {date.toLocaleDateString('zh-TW', { 
                        month: 'short', 
                        day: 'numeric', 
                        weekday: 'short',
                        timeZone: 'Asia/Taipei'
                      })}
                      {isToday && ' (今天)'}
                    </div>
                    
                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      <div>📦 訂單數: <strong>{dayData.order_count}</strong></div>
                      <div>📋 項目數: <strong>{dayData.item_count}</strong></div>
                      <div>🔢 總數量: <strong>{dayData.total_quantity}</strong></div>
                      {user?.role === 'admin' && (
                        <div>💰 總金額: <strong>${dayData.total_amount}</strong></div>
                      )}
                      <div style={{ marginTop: '8px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#e74c3c', color: 'white', fontSize: '12px' }}>
                        待出貨: {dayData.pending_orders}
                      </div>
                      <div style={{ marginTop: '4px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#27ae60', color: 'white', fontSize: '12px' }}>
                        已出貨: {dayData.shipped_orders}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>📊 該週沒有出貨訂單</p>
            </div>
          )}
        </div>
      )}

      {/* 出貨訂單列表 */}
      {!showWeeklyOverview && shippingOrders.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>客戶資訊</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'left' }}>產品明細</th>
                {user?.role === 'admin' && (
                  <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>訂單金額</th>
                )}
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>製作狀態</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>出貨狀態</th>
                <th style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {shippingOrders.map((order, orderIndex) => {
                // ✅ 檢查製作狀態：改為檢查庫存是否足夠，而不是檢查 production_date
                // 解析訂單項目
                let orderItems = [];
                try {
                  if (Array.isArray(order.items)) {
                    orderItems = order.items;
                  } else if (typeof order.items === 'string') {
                    orderItems = order.items.trim() ? JSON.parse(order.items) : [];
                  }
                } catch (e) {
                  orderItems = [];
                }
                
                // 檢查每個產品的庫存是否足夠
                let hasInsufficientStock = false;
                let insufficientProducts = [];
                
                for (const item of orderItems) {
                  const productName = item.product_name || item.name;
                  const requiredQty = Number(item.quantity) || 0;
                  
                  if (productName && requiredQty > 0) {
                    // 從庫存數據中查找該產品
                    const product = inventoryData.find(p => {
                      const name1 = (p.name || '').trim().toLowerCase().replace(/\s+/g, '');
                      const name2 = (productName || '').trim().toLowerCase().replace(/\s+/g, '');
                      return name1 === name2;
                    });
                    
                    const currentStock = product ? (Number(product.current_stock) || 0) : 0;
                    
                    if (currentStock < requiredQty) {
                      hasInsufficientStock = true;
                      insufficientProducts.push(`${productName}(${currentStock}/${requiredQty})`);
                    }
                  }
                }
                
                // 製作狀態：如果有庫存不足，顯示「庫存不足」，否則顯示「可出貨」
                const productionStatus = hasInsufficientStock ? '庫存不足' : '可出貨';
                const canShip = !hasInsufficientStock;
                
                // 確保每個訂單都有唯一的 key
                const orderKey = order.id || `shipping-order-${orderIndex}-${order.customer_name || 'unknown'}`;
                
                return (
                  <tr key={orderKey}>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {/* 訂單編號 - 第一欄 */}
                      {order.order_number && (
                        <div style={{ 
                          background: '#3498db', 
                          color: 'white', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          marginBottom: '6px',
                          display: 'inline-block'
                        }}>
                          📋 {order.order_number}
                        </div>
                      )}
                      
                      {/* 客戶姓名 - 第二欄 */}
                      <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '16px' }}>{order.customer_name || '未知客戶'}</div>
                      
                      {/* 聯絡電話 - 第三欄 */}
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>📞 {order.phone}</div>
                      
                      {/* 送貨地點 - 第四欄 */}
                      {order.address && (
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>📍 {order.address}</div>
                      )}
                      
                      {/* 便利商店店名 - 第五欄 */}
                      {order.family_mart_address && (
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>🏪 {order.family_mart_address}</div>
                      )}
                      
                      {/* 來源 - 第六欄（彩色標籤顯示） */}
                      {order.source && (
                        <div style={{ marginBottom: '2px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: '500',
                            backgroundColor: order.source?.includes('蝦皮') ? '#ff6b35' : 
                                           order.source?.includes('IG') ? '#e1306c' :
                                           order.source?.includes('FB') ? '#1877f2' :
                                           order.source?.includes('全家') ? '#00a651' :
                                           order.source?.includes('7-11') ? '#ff6600' : '#27ae60',
                            color: 'white'
                          }}>
                            🛒 {order.source}
                          </span>
                        </div>
                      )}
                      
                      {/* 付款方式 - 第七欄（彩色標籤顯示） */}
                      {order.payment_method && (
                        <div style={{ marginBottom: '4px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: '500',
                            backgroundColor: order.payment_method === '信用卡' ? '#3498db' : 
                                           order.payment_method === 'LinePay' ? '#00c300' :
                                           order.payment_method === '現金' ? '#95a5a6' : '#e74c3c',
                            color: 'white'
                          }}>
                            💳 {order.payment_method}
                          </span>
                        </div>
                      )}
                      
                      {order.order_notes && (
                        <div style={{ fontSize: '12px', color: '#e67e22', marginTop: '4px' }}>
                          📝 {order.order_notes}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6' }}>
                      {order.items && order.items.length > 0 ? (
                        <div>
                          {order.items.map((item, index) => (
                            <div key={index} style={{ 
                              marginBottom: '8px', 
                              padding: '8px', 
                              backgroundColor: '#f8f9fa', 
                              borderRadius: '4px',
                              border: item.is_gift ? '2px solid #f39c12' : '1px solid #dee2e6'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span style={{ fontWeight: 'bold' }}>
                                    {item.is_gift && '🎁 '}{item.product_name}
                                  </span>
                                  {item.special_notes && (
                                    <div style={{ fontSize: '11px', color: '#e67e22', marginTop: '2px' }}>
                                      💬 {item.special_notes}
                                    </div>
                                  )}
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '16px' }}>
                                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>數量: {item.quantity}</div>
                                  {user?.role === 'admin' && (
                                    <div style={{ fontWeight: 'bold' }}>單價: ${item.unit_price}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: '#999', fontStyle: 'italic' }}>無產品</div>
                      )}
                    </td>
                    {user?.role === 'admin' && (
                      <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>${order.customer_total}</div>
                        {order.shipping_fee !== 0 && (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            運費: ${order.shipping_fee}
                          </div>
                        )}
                        {order.credit_card_fee && order.credit_card_fee > 0 && (
                          <div style={{ fontSize: '12px', color: '#e67e22', fontWeight: 'bold' }}>
                            💳 手續費扣除: ${order.credit_card_fee}
                          </div>
                        )}
                        {order.shopee_fee && order.shopee_fee > 0 && (
                          <div style={{ fontSize: '12px', color: '#e74c3c', fontWeight: 'bold' }}>
                            🛒 蝦皮費用扣除: ${order.shopee_fee}
                          </div>
                        )}
                      </td>
                    )}
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        background: canShip ? '#27ae60' : '#e74c3c',
                        color: 'white',
                        fontSize: '12px'
                      }}
                      title={hasInsufficientStock ? `不足：${insufficientProducts.join(', ')}` : ''}
                      >
                        {productionStatus}
                      </span>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        background: order.shipping_status === 'shipped' ? '#27ae60' : '#e74c3c',
                        color: 'white',
                        fontSize: '12px'
                      }}>
                        {order.shipping_status === 'shipped' ? '已出貨' : '待出貨'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #dee2e6', textAlign: 'center' }}>
                      {order.shipping_status === 'shipped' ? (
                        <button
                          onClick={() => handleUpdateShippingStatus(order.id, 'pending')}
                          style={{
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                        >
                          📦 標記待出貨
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateShippingStatus(order.id, 'shipped')}
                          disabled={!canShip}
                          style={{
                            backgroundColor: canShip ? '#27ae60' : '#95a5a6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            cursor: canShip ? 'pointer' : 'not-allowed',
                            fontSize: '12px'
                          }}
                        >
                          🚚 標記已出貨
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <p>📦 該配送日期沒有訂單需要出貨</p>
        </div>
      )}
    </div>
  );
```

## renderInventoryManagement (4030-4330行)

```jsx
  const renderInventoryManagement = () => (
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
```

---

✅ 包含所有 7 个 render 函数 + 主 return 区块
