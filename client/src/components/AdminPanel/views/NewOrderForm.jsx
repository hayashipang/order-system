import React from 'react';

export default function NewOrderForm({
  error,
  success,
  handleAddOrder,
  newOrder,
  setNewOrder,
  customers,
  setActiveTab,
  products,
  updateOrderItem,
  removeOrderItem,
  addOrderItem,
  addGiftItem,
  shippingFee,
  calculateTotalAmount,
  calculateCreditCardFee,
  calculateShopeeFee,
  loading
}) {
  return (
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
                    const norm = raw.trim().toLowerCase();
                    const selectedProduct = products.find(p => (p.name || '').trim().toLowerCase() === norm);
                    updateOrderItem(index, 'product_name', raw);
                    updateOrderItem(index, 'quantity', 1);
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
          
          <div style={{ 
            fontSize: '14px', 
            color: '#7f8c8d',
            marginTop: '5px',
            lineHeight: '1.4'
          }}>
            <div>產品總計: NT$ {(newOrder.items || []).reduce((total, item) => total + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0).toLocaleString()}</div>
            
            {calculateCreditCardFee(newOrder, customers) > 0 && (
              <div style={{ color: '#e67e22', fontWeight: 'bold' }}>
                💳 信用卡手續費扣除 (2%): NT$ {(calculateCreditCardFee(newOrder, customers) || 0).toLocaleString()}
              </div>
            )}
            
            {calculateShopeeFee(newOrder, customers) > 0 && (
              <div style={{ color: '#e74c3c', fontWeight: 'bold' }}>
                🛒 蝦皮訂單費用扣除 (7.5%): NT$ {(calculateShopeeFee(newOrder, customers) || 0).toLocaleString()}
              </div>
            )}
            
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
}

