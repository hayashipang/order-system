import React, { useState, useEffect } from 'react';
import { parseOrderItems, getProductName, getQuantity } from '../utils/orderUtils';

const ProductListTable = ({ orders = [], inventory, onQuantityChange, onSchedule, onDeleteSchedule, onComplete }) => {
  const [productSummary, setProductSummary] = useState({});
  const [manufacturingQuantities, setManufacturingQuantities] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // 計算產品總統計 - 超強安全版（支援排程數量）
  useEffect(() => {
    const productMap = new Map();

    try {
      orders.forEach((order) => {
        const rawItems = parseOrderItems(order.items);

        const scheduled = order.scheduled_quantities || {}; // ✅ 排程後數量
        const extra = order.extra_stock || {};              // ✅ 多做庫存

        rawItems.forEach((item) => {
          const name = getProductName(item);
          if (!name) return;

          // ✅ 排程後 → 使用排程數量
          const scheduledQty = Number(scheduled[name] || 0);

          // ✅ 多做庫存
          const extraQty = Number(extra[name] || 0);

          // ✅ 原始訂單數量
          const rawQty = getQuantity(item);

          // ✅ 決定最後顯示的數量
          const finalQty =
            scheduledQty > 0 || extraQty > 0
              ? scheduledQty + extraQty // ✅ 排程數量最優先
              : rawQty; // ✅ 回到原始訂單

          const prev = productMap.get(name) || {
            product_name: name,
            quantity: 0,
            originalQuantity: 0,
            manufacturingQuantity: 0
          };

          productMap.set(name, {
            product_name: name,
            quantity: prev.quantity + finalQty,
            originalQuantity: prev.originalQuantity + rawQty,
            manufacturingQuantity: prev.manufacturingQuantity + finalQty
          });
        });
      });
    } catch (err) {
      console.error("❌ ProductListTable 聚合失敗:", err);
    }

    // 轉換為舊格式以保持兼容性
    const summary = {};
    const initialManufacturing = {};
    
    productMap.forEach((product, name) => {
      summary[name] = {
        productName: name,
        originalQuantity: product.originalQuantity,
        manufacturingQuantity: product.manufacturingQuantity
      };
      initialManufacturing[name] = product.manufacturingQuantity;
    });

    setProductSummary(summary);
    setManufacturingQuantities(initialManufacturing);
  }, [orders]);

  // 處理數量變更
  const handleQuantityChange = (productName, newQuantity) => {
    const quantity = Math.max(0, parseInt(newQuantity) || 0);
    setManufacturingQuantities(prev => ({
      ...prev,
      [productName]: quantity
    }));
    
    if (onQuantityChange) {
      onQuantityChange(productName, quantity);
    }
  };

  // 處理加減按鈕
  const handleQuantityAdjust = (productName, delta) => {
    const currentQuantity = manufacturingQuantities[productName] || 0;
    const newQuantity = Math.max(0, currentQuantity + delta);
    handleQuantityChange(productName, newQuantity);
  };

  // 計算總統計
  const getTotalStats = () => {
    const productCount = Object.keys(productSummary).length;
    const totalQuantity = Object.values(manufacturingQuantities).reduce((sum, qty) => sum + qty, 0);
    const originalTotalQuantity = Object.values(productSummary).reduce((sum, product) => sum + product.originalQuantity, 0);
    return { productCount, totalQuantity, originalTotalQuantity };
  };

  const totalStats = getTotalStats();

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <h3 style={{
        margin: '0 0 20px 0',
        color: '#2c3e50',
        fontSize: '18px',
        fontWeight: 'bold',
        borderBottom: '2px solid #e9ecef',
        paddingBottom: '10px'
      }}>
        📋 產品清單總統計（排程後數量）
      </h3>

      {Object.keys(productSummary).length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6c757d',
          fontSize: '16px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
          <div>無品項資料可顯示（items 或排程數量可能為空）</div>
        </div>
      ) : (
        <>
          {/* 產品清單表格 */}
          <div style={{
            overflowX: 'auto',
            marginBottom: '20px'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #dee2e6',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{
                  background: '#f8f9fa',
                  borderBottom: '2px solid #dee2e6'
                }}>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    fontWeight: 'bold',
                    color: '#495057',
                    borderRight: '1px solid #dee2e6',
                    width: '35%'
                  }}>
                    產品名稱
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: '#495057',
                    borderRight: '1px solid #dee2e6',
                    width: '20%'
                  }}>
                    原訂單總數
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: '#495057',
                    borderRight: '1px solid #dee2e6',
                    width: '15%'
                  }}>
                    可接單實際庫存
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: '#495057',
                    borderRight: '1px solid #dee2e6',
                    width: '15%'
                  }}>
                    預備庫存
                  </th>
                  <th style={{
                    padding: '12px 16px',
                    textAlign: 'right',
                    fontWeight: 'bold',
                    color: '#495057',
                    width: '25%'
                  }}>
                    預計製造總數
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.values(productSummary).map((product, index) => (
                  <tr key={product.productName} style={{
                    borderBottom: index < Object.values(productSummary).length - 1 ? '1px solid #dee2e6' : 'none',
                    background: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                  }}>
                    <td style={{
                      padding: '12px 16px',
                      borderRight: '1px solid #dee2e6',
                      fontWeight: 'bold',
                      color: '#2c3e50'
                    }}>
                      {product.productName}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      borderRight: '1px solid #dee2e6',
                      color: '#007bff',
                      fontWeight: 'bold'
                    }}>
                      {product.originalQuantity}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      borderRight: '1px solid #dee2e6',
                      color: '#28a745',
                      fontWeight: 'bold'
                    }}>
                      {inventory && inventory[product.productName] ? inventory[product.productName] : 0}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right',
                      borderRight: '1px solid #dee2e6',
                      color: '#17a2b8',
                      fontWeight: 'bold'
                    }}>
                      {(() => {
                        const currentStock = inventory && inventory[product.productName] ? inventory[product.productName] : 0;
                        const manufacturingQty = manufacturingQuantities[product.productName] || 0;
                        const orderQty = product.originalQuantity;
                        const excessStock = manufacturingQty - orderQty;
                        return Math.max(0, currentStock + excessStock);
                      })()}
                    </td>
                    <td style={{
                      padding: '12px 16px',
                      textAlign: 'right'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '8px'
                      }}>
                        <button
                          onClick={() => handleQuantityAdjust(product.productName, -1)}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={manufacturingQuantities[product.productName] || 0}
                          onChange={(e) => handleQuantityChange(product.productName, e.target.value)}
                          style={{
                            width: '80px',
                            padding: '6px 8px',
                            border: '1px solid #ced4da',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}
                          min="0"
                        />
                        <button
                          onClick={() => handleQuantityAdjust(product.productName, 1)}
                          style={{
                            background: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 總計統計 */}
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#2c3e50'
              }}>
                📊 總計：{totalStats.productCount}項產品，原訂單總數量{totalStats.originalTotalQuantity}瓶
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#007bff'
              }}>
                📈 預計製造總數量：{totalStats.totalQuantity}瓶
              </div>
            </div>
          </div>

          {/* 操作按鈕 */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '20px'
          }}>
            <button
              onClick={() => {
                setShowConfirmModal(true);
              }}
              style={{
                background: 'linear-gradient(135deg, #28a745, #20c997)',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(40,167,69,0.3)',
                transition: 'all 0.2s ease',
                minWidth: '180px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(40,167,69,0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(40,167,69,0.3)';
              }}
            >
              📅 確認排程
            </button>
            
            <button
              onClick={() => {
                if (window.confirm('確定要刪除當天的排程嗎？此操作將清除當前日期的所有排程訂單。')) {
                  if (onDeleteSchedule) {
                    onDeleteSchedule();
                  } else {
                    console.log('刪除當天排程');
                    alert('當天排程已刪除');
                  }
                }
              }}
              style={{
                background: 'linear-gradient(135deg, #dc3545, #c82333)',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold',
                boxShadow: '0 4px 8px rgba(220,53,69,0.3)',
                transition: 'all 0.2s ease',
                minWidth: '180px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(220,53,69,0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 8px rgba(220,53,69,0.3)';
              }}
            >
              🗑️ 刪除排程
            </button>
            
            {onComplete && (
              <button
                onClick={() => {
                  if (window.confirm('確定要標記選中的訂單為已完成嗎？此操作將更新庫存。')) {
                    onComplete();
                  }
                }}
                style={{
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  color: 'white',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 8px rgba(76,175,80,0.3)',
                  transition: 'all 0.2s ease',
                  minWidth: '180px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 12px rgba(76,175,80,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 8px rgba(76,175,80,0.3)';
                }}
              >
                ✅ 標記完成
              </button>
            )}
          </div>
        </>
      )}

      {/* 確認排程彈窗 */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              📅
            </div>
            <h3 style={{
              margin: '0 0 16px 0',
              color: '#2c3e50',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              確認排程
            </h3>
            <p style={{
              margin: '0 0 24px 0',
              color: '#6c757d',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              確定要確認排程嗎？
              <br />
              排程後將顯示在預定訂單UI中。
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#5a6268';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#6c757d';
                }}
              >
                取消
              </button>
              <button
                onClick={() => {
                  // 直接確認排程，不調整數量
                  if (onSchedule) {
                    onSchedule(manufacturingQuantities);
                  }
                  setShowConfirmModal(false);
                }}
                style={{
                  background: 'linear-gradient(135deg, #007bff, #0056b3)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(0,123,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                確認排程
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductListTable;