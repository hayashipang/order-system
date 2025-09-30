import React from 'react';

const InventoryOverview = ({ inventoryData }) => {
  return (
    <div style={{
      marginBottom: '20px',
      padding: '15px',
      background: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #dee2e6'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>📦 庫存狀態概覽</h3>
      {inventoryData.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '10px'
        }}>
          {inventoryData.map((product) => {
            const isLowStock = product.current_stock <= product.min_stock;
            return (
              <div
                key={product.id}
                style={{
                  padding: '12px',
                  borderRadius: '6px',
                  backgroundColor: isLowStock ? '#fff5f5' : '#f0fff4',
                  border: `2px solid ${isLowStock ? '#e74c3c' : '#27ae60'}`,
                  textAlign: 'center'
                }}
              >
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '5px',
                  color: isLowStock ? '#e74c3c' : '#27ae60'
                }}>
                  {product.name}
                </div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold',
                  color: isLowStock ? '#e74c3c' : '#27ae60'
                }}>
                  {product.current_stock}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666',
                  marginTop: '2px'
                }}>
                  {isLowStock ? '⚠️ 庫存不足' : '✅ 庫存正常'}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
          載入庫存資料中...
        </div>
      )}
    </div>
  );
};

export default InventoryOverview;
