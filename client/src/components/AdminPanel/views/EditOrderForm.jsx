import React from 'react';

export default function EditOrderForm({
  error,
  success,
  handleUpdateOrder,
  editingOrder,
  setEditingOrder,
  customers,
  products,
  updateEditingOrderItem,
  removeEditingOrderItem,
  loading
}) {
  return (
    <div className="card">
      <h2>編輯訂單</h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleUpdateOrder}>
        <div className="form-group">
          <label className="form-label">客戶</label>
          <select
            className="form-select"
            value={editingOrder.customer_id}
            onChange={(e) => setEditingOrder({ ...editingOrder, customer_id: e.target.value })}
            required
          >
            <option value="">請選擇客戶</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.phone || '無電話'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">訂單日期</label>
          <input
            type="date"
            className="form-input"
            value={editingOrder.order_date}
            onChange={(e) => setEditingOrder({ ...editingOrder, order_date: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">交貨日期</label>
          <input
            type="date"
            className="form-input"
            value={editingOrder.delivery_date}
            onChange={(e) => setEditingOrder({ ...editingOrder, delivery_date: e.target.value })}
            required
          />
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

          {editingOrder.items.map((item, index) => (
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

                    updateEditingOrderItem(index, 'product_name', raw);
                    updateEditingOrderItem(index, 'quantity', 1);

                    if (selectedProduct && !item.is_gift) {
                      updateEditingOrderItem(index, 'unit_price', selectedProduct.price);
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
                  onChange={(e) => updateEditingOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  min="1"
                  required
                />
                <input
                  type="number"
                  className="form-input"
                  value={item.unit_price}
                  onChange={(e) => updateEditingOrderItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
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
                  onChange={(e) => updateEditingOrderItem(index, 'special_notes', e.target.value)}
                />

                <div className="subtotal-display">
                  小計: NT$ {((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toLocaleString()}
                </div>

                {editingOrder.items.length > 1 && (
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => removeEditingOrderItem(index)}
                  >
                    移除
                  </button>
                )}
              </div>
            </div>
          ))}

        </div>

        <div className="form-group">
          <label className="form-label">備註</label>
          <textarea
            className="form-textarea"
            value={editingOrder.notes}
            onChange={(e) => setEditingOrder({ ...editingOrder, notes: e.target.value })}
            placeholder="訂單備註..."
          />
        </div>

        <button type="submit" className="button success" disabled={loading}>
          {loading ? '更新中...' : '更新訂單'}
        </button>
      </form>
    </div>
  );
}

