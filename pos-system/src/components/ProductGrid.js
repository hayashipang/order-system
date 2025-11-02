import React from 'react';

const ProductGrid = ({ products, selectedProducts, onProductSelect }) => {
  // 獲取庫存狀態
  const getStockStatus = (stock) => {
    if (stock === 0) return { status: 'out', color: '#e53e3e', text: '缺貨' };
    if (stock <= 10) return { status: 'low', color: '#dd6b20', text: '庫存偏低' };
    return { status: 'good', color: '#38a169', text: '庫存充足' };
  };

  if (!products || products.length === 0) {
    return (
      <div className="product-section">
        <h2 style={{ marginBottom: '1rem', color: '#2d3748' }}>產品選擇</h2>
        <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
          尚無產品資料
        </div>
      </div>
    );
  }

  return (
    <div className="product-section">
      <h2 style={{ marginBottom: '1rem', color: '#2d3748' }}>產品選擇</h2>
      <div className="product-grid">
        {products.map((product) => {
          const isSelected = selectedProducts.some(
            (selected) => selected.id === product.id
          );
          const stockInfo = getStockStatus(product.current_stock || 0);
          const isOutOfStock = product.current_stock === 0;
          
          return (
            <div
              key={product.id}
              className={`product-card ${isSelected ? 'selected' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('點擊產品:', product.name, '庫存:', product.current_stock);
                onProductSelect(product);
              }}
              style={{
                opacity: isOutOfStock ? 0.8 : 1,
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            >
              <div className="product-name">{product.name}</div>
              <div className="product-price">NT$ {product.price}</div>
              
              {/* 庫存顯示 */}
              <div style={{
                marginTop: '0.5rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: '500',
                background: stockInfo.color,
                color: 'white',
                textAlign: 'center'
              }}>
                庫存: {product.current_stock || 0} 件
              </div>
              
              {product.description && (
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: '#718096', 
                  marginTop: '0.5rem' 
                }}>
                  {product.description}
                </div>
              )}
              
              {isOutOfStock && (
                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.8rem',
                  color: '#dd6b20',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  庫存不足，仍可銷售
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductGrid;
