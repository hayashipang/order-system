import React from 'react';

export default function OrderHistory({
  historyCustomerSearchTerm,
  handleHistoryCustomerSearch,
  filteredHistoryCustomers,
  historyFilters,
  setHistoryFilters,
  fetchOrderHistory,
  loading,
  customers,
  setHistoryCustomerSearchTerm,
  setFilteredHistoryCustomers,
  setOrderHistory,
  exportToCSV,
  deleteOrderHistory,
  orderHistory,
  handleEditOrder,
  handleDeleteOrder
}) {
  return (
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
}

