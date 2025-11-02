import React from 'react';

export default function ShippingManagement({
  user,
  showWeeklyOverview,
  setShowWeeklyOverview,
  shippingDate,
  setShippingDate,
  weeklyShippingData,
  shippingOrders,
  inventoryData,
  handleUpdateShippingStatus
}) {
  return (
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
}

