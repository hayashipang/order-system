import React from 'react';

const InventoryOverview = ({ inventoryData }) => {
  // 確保 inventoryData 是陣列
  const safeInventoryData = Array.isArray(inventoryData) ? inventoryData : [];
  
  return (
    <div style={{
      marginBottom: '20px',
      padding: '15px',
      background: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ margin: '0', color: '#2c3e50' }}>📦 庫存狀態概覽</h3>
      </div>

      {safeInventoryData.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px'
        }}>
          {safeInventoryData.map((product, index) => {
            // 處理不同的資料結構
            const productName = product.name || product.product_name || '未命名商品';
            const currentStock = Number(product.current_stock || 0);
            const minStock = Number(product.min_stock || 10); // 預設最低庫存為 10
            const isLowStock = currentStock <= minStock;
            
            return (
              <div
                key={product.id || index}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: isLowStock ? '#fff5f5' : '#f0fff4',
                  border: `2px solid ${isLowStock ? '#e74c3c' : '#27ae60'}`,
                  textAlign: 'center'
                }}
              >
                <div style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#2c3e50',
                  marginBottom: '8px'
                }}>
                  {productName}
                </div>
                <div style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: isLowStock ? '#e74c3c' : '#27ae60',
                  marginBottom: '4px'
                }}>
                  {currentStock} 瓶
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6c757d'
                }}>
                  最低庫存: {minStock} 瓶
                </div>
                {isLowStock && (
                  <div style={{
                    fontSize: '12px',
                    color: '#e74c3c',
                    fontWeight: 'bold',
                    marginTop: '4px'
                  }}>
                    ⚠️ 庫存不足
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          color: '#6c757d',
          padding: '20px'
        }}>
          暫無庫存資料
        </div>
      )}
    </div>
  );
};

export default InventoryOverview;