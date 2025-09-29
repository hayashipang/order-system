import React from 'react';

const ProductGrid = ({ products, selectedProducts, onProductSelect }) => {
  // 獲取庫存狀態
  const getStockStatus = (stock) => {
    if (stock === 0) return { status: 'out', color: '#e53e3e', text: '缺貨' };
    if (stock <= 10) return { status: 'low', color: '#dd6b20', text: '庫存偏低' };
    return { status: 'good', color: '#38a169', text: '庫存充足' };
  };

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
              className={`product-card ${isSelected ? 'selected' : ''} ${isOutOfStock ? 'out-of-stock' : ''}`}
              onClick={() => !isOutOfStock && onProductSelect(product)}
              style={{
                opacity: isOutOfStock ? 0.6 : 1,
                cursor: isOutOfStock ? 'not-allowed' : 'pointer'
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
                  color: '#e53e3e',
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  暫停銷售
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
