import React, { useState } from 'react';
import VirtualKeypad from './VirtualKeypad';

const CashierPanel = ({ 
  cartItems, 
  onUpdateQuantity, 
  onRemoveItem, 
  onCompleteTransaction,
  onClearCart 
}) => {
  const [customerPayment, setCustomerPayment] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  // 計算小計
  const subtotal = cartItems.reduce((total, item) => {
    return total + (item.quantity * item.unit_price);
  }, 0);

  // 計算找零
  const paymentAmount = parseFloat(customerPayment) || 0;
  const change = paymentAmount - subtotal;

  // 處理完成交易
  const handleCompleteTransaction = async () => {
    if (cartItems.length === 0) {
      alert('購物車是空的！');
      return;
    }

    if (paymentAmount < subtotal) {
      alert('付款金額不足！');
      return;
    }

    setIsProcessing(true);
    
    try {
      const orderData = {
        items: cartItems.map(item => ({
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          special_notes: item.special_notes || '',
          is_gift: item.is_gift || false
        })),
        subtotal: subtotal,
        customer_payment: paymentAmount,
        change: change,
        payment_method: paymentMethod,
        created_by: 'pos-system'
      };

      await onCompleteTransaction(orderData);
      
      // 清空表單
      setCustomerPayment('');
      setPaymentMethod('cash');
    } catch (error) {
      console.error('交易失敗:', error);
      alert('交易失敗，請重試！');
    } finally {
      setIsProcessing(false);
    }
  };

  // 處理清空購物車
  const handleClearCart = () => {
    if (cartItems.length > 0 && window.confirm('確定要清空購物車嗎？')) {
      onClearCart();
      setCustomerPayment('');
    }
  };

  // 虛擬鍵盤處理函數
  const handleKeypadPress = (key) => {
    setCustomerPayment(prev => prev + key);
  };

  const handleKeypadClear = () => {
    setCustomerPayment('');
  };

  const handleKeypadBackspace = () => {
    setCustomerPayment(prev => prev.slice(0, -1));
  };

  return (
    <div className="cashier-section">
      <div className="cart-header">
        <h2 style={{ color: '#2d3748' }}>收銀台</h2>
        <span style={{ 
          fontSize: '0.9rem', 
          color: '#718096' 
        }}>
          {cartItems.length} 項商品
        </span>
      </div>

      <div className="cart-section">
        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#718096', 
              padding: '2rem' 
            }}>
              購物車是空的
            </div>
          ) : (
            cartItems.map((item, index) => (
              <div key={index} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-details">
                    NT$ {item.unit_price} × {item.quantity} = NT$ {item.quantity * item.unit_price}
                  </div>
                  {item.special_notes && (
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#a0aec0', 
                      fontStyle: 'italic' 
                    }}>
                      備註: {item.special_notes}
                    </div>
                  )}
                </div>
                <div className="cart-item-controls">
                  <button
                    className="quantity-btn"
                    onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    className="quantity-input"
                    value={item.quantity}
                    onChange={(e) => onUpdateQuantity(index, parseInt(e.target.value) || 1)}
                    min="1"
                  />
                  <button
                    className="quantity-btn"
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                  >
                    +
                  </button>
                  <button
                    className="remove-btn"
                    onClick={() => onRemoveItem(index)}
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="cart-summary">
          <div className="summary-row">
            <span>小計:</span>
            <span>NT$ {subtotal.toFixed(0)}</span>
          </div>
          <div className="summary-total">
            <span>總計:</span>
            <span>NT$ {subtotal.toFixed(0)}</span>
          </div>
        </div>
      </div>

      <div className="payment-section">
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '500' 
          }}>
            付款方式:
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e1e5e9',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          >
            <option value="cash">現金</option>
            <option value="card">信用卡</option>
            <option value="mobile">行動支付</option>
          </select>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontWeight: '500' 
          }}>
            客戶付款金額:
          </label>
          <input
            type="text"
            className="payment-input"
            value={customerPayment}
            onChange={(e) => setCustomerPayment(e.target.value)}
            placeholder="輸入付款金額"
            readOnly
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e1e5e9',
              borderRadius: '8px',
              fontSize: '1.2rem',
              fontWeight: '600',
              textAlign: 'center',
              background: '#f8f9fa'
            }}
          />
        </div>

        {/* 虛擬數字鍵盤 */}
        <div style={{ marginBottom: '1rem' }}>
          <VirtualKeypad
            onKeyPress={handleKeypadPress}
            onClear={handleKeypadClear}
            onBackspace={handleKeypadBackspace}
          />
        </div>

        {customerPayment && paymentAmount >= subtotal && (
          <div className="change-display">
            <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>找零</div>
            <div className="change-amount">NT$ {change.toFixed(0)}</div>
          </div>
        )}

        <div className="action-buttons">
          <button
            className="btn btn-secondary"
            onClick={handleClearCart}
            disabled={cartItems.length === 0}
          >
            清空購物車
          </button>
          <button
            className="btn btn-success"
            onClick={handleCompleteTransaction}
            disabled={cartItems.length === 0 || paymentAmount < subtotal || isProcessing}
          >
            {isProcessing ? '處理中...' : '完成交易'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashierPanel;
