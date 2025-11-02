import React, { useState } from 'react';
import SourceTag from './SourceTag';

const OrderCard = ({ order, onSchedule, onComplete, isScheduled = false }) => {
  const [manufacturingQuantities, setManufacturingQuantities] = useState({});
  // 格式化日期
  const formatDate = (dateStr) => {
    if (!dateStr) return '未設定';
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Taipei'
    });
  };

  // 計算總數量
  const getTotalQuantity = () => {
    if (!order.items) return 0;
    return order.items.reduce((total, item) => total + (item.quantity || 0), 0);
  };

  // 獲取產品列表（最多顯示3個，超過顯示"等X項"）
  const getProductSummary = () => {
    if (!order.items || order.items.length === 0) return '無產品';
    
    const productNames = order.items.map(item => item.product_name).filter(Boolean);
    if (productNames.length <= 3) {
      return productNames.join('、');
    } else {
      return `${productNames.slice(0, 3).join('、')} 等${productNames.length}項`;
    }
  };

  // 簡化的卡片樣式
  const cardStyle = {
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    borderColor: '#dee2e6'
  };

  return (
    <div 
      className="order-card"
      style={{
        background: cardStyle.background,
        border: `2px solid ${cardStyle.borderColor}`,
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
    >

      {/* 卡片標題區域 */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#2c3e50',
            flex: 1
          }}>
            {order.customer_name || '未命名客戶'}
          </h3>
          {order.id && (
            <span style={{
              background: '#6c757d',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 'bold'
            }}>
              #{order.id}
            </span>
          )}
        </div>
        
        {/* 來源標籤 */}
        <div style={{ marginBottom: '8px' }}>
          <SourceTag source={order.source} fee={order.shopee_fee} />
        </div>
      </div>

      {/* 日期資訊 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginBottom: '16px',
        padding: '12px',
        background: 'rgba(255,255,255,0.7)',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.3)'
      }}>
        <div>
          <div style={{
            fontSize: '11px',
            color: '#6c757d',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '4px'
          }}>
            📅 訂單日期
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#495057'
          }}>
            {formatDate(order.order_date)}
          </div>
        </div>
        
        <div>
          <div style={{
            fontSize: '11px',
            color: '#6c757d',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '4px'
          }}>
            🚚 出貨日期
          </div>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            color: order.delivery_date === new Date().toISOString().split('T')[0] ? '#e74c3c' : '#28a745'
          }}>
            {formatDate(order.delivery_date)}
          </div>
        </div>
      </div>

      {/* 產品資訊 */}
      <div style={{
        marginBottom: '16px',
        padding: '12px',
        background: 'rgba(255,255,255,0.8)',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.3)'
      }}>
        <div style={{
          fontSize: '11px',
          color: '#6c757d',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '8px'
        }}>
          📦 產品清單
        </div>
        

        {/* 詳細產品列表 */}
        {order.items && order.items.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            {order.items.slice(0, 3).map((item, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '4px 0',
                borderBottom: index < Math.min(order.items.length, 3) - 1 ? '1px solid rgba(0,0,0,0.1)' : 'none'
              }}>
                <span style={{
                  fontSize: '13px',
                  color: '#495057',
                  flex: 1
                }}>
                  {item.product_name}
                </span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#007bff',
                  background: 'rgba(0,123,255,0.1)',
                  padding: '2px 8px',
                  borderRadius: '12px'
                }}>
                  {item.quantity}個
                </span>
              </div>
            ))}
            
            {order.items.length > 3 && (
              <div style={{
                fontSize: '12px',
                color: '#6c757d',
                textAlign: 'center',
                marginTop: '4px',
                fontStyle: 'italic'
              }}>
                ... 還有 {order.items.length - 3} 項產品
              </div>
            )}
          </div>
        )}
      </div>

      {/* 總數量統計 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px',
        background: 'rgba(255,255,255,0.9)',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.3)',
        marginBottom: '16px'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#6c757d',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          總數量
        </div>
        <div style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#007bff',
          background: 'linear-gradient(135deg, #007bff, #0056b3)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {getTotalQuantity()} 個
        </div>
      </div>

    </div>
  );
};

export default OrderCard;
