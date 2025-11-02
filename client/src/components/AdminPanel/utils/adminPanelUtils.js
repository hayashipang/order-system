// ✅ 計算訂單總金額（包含信用卡手續費）
export function calculateTotalAmount(order, shippingFee, customers) {
  const itemsTotal = order.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0);
  
  let shippingAdjustment = 0;
  if (order.shipping_type === 'free') {
    shippingAdjustment = -shippingFee; // 免運費對我們是成本
  }
  // 客戶付運費給快遞公司，不計入我們的收入
  
  // 計算信用卡手續費
  let creditCardFee = 0;
  if (order.customer_id) {
    const selectedCustomer = customers.find(c => c.id === parseInt(order.customer_id));
    if (selectedCustomer && selectedCustomer.payment_method === '信用卡') {
      // 計算付費產品總金額（排除贈品）
      const paidItemsTotal = order.items
        .filter(item => !item.is_gift)
        .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      
      // 手續費 = 付費產品金額 × 2%
      creditCardFee = Math.round(paidItemsTotal * 0.02);
    }
  }
  
  // 計算蝦皮費用
  let shopeeFee = 0;
  if (order.customer_id) {
    const selectedCustomer = customers.find(c => c.id === parseInt(order.customer_id));
    if (selectedCustomer && selectedCustomer.source === '蝦皮訂購') {
      // 計算付費產品總金額（排除贈品）
      const paidItemsTotal = order.items
        .filter(item => !item.is_gift)
        .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      
      // 成交手續費 = 付費產品金額 × 5.5%
      const transactionFee = paidItemsTotal * 0.055;
      // 金流與系統處理費 = 付費產品金額 × 2%
      const paymentFee = paidItemsTotal * 0.02;
      // 總手續費 = 成交手續費 + 金流與系統處理費，四捨五入到整數
      shopeeFee = Math.round(transactionFee + paymentFee);
    }
  }
  
  return itemsTotal + shippingAdjustment - creditCardFee - shopeeFee;
}

// ✅ 計算信用卡手續費
export function calculateCreditCardFee(order, customers) {
  if (!order.customer_id) return 0;
  
  const selectedCustomer = customers.find(c => c.id === parseInt(order.customer_id));
  if (!selectedCustomer || selectedCustomer.payment_method !== '信用卡') return 0;
  
  // 計算付費產品總金額（排除贈品）
  const paidItemsTotal = order.items
    .filter(item => !item.is_gift)
    .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  
  // 手續費 = 付費產品金額 × 2%
  return Math.round(paidItemsTotal * 0.02);
}

// ✅ 計算蝦皮費用
export function calculateShopeeFee(order, customers) {
  if (!order.customer_id) return 0;
  
  const selectedCustomer = customers.find(c => c.id === parseInt(order.customer_id));
  if (!selectedCustomer || selectedCustomer.source !== '蝦皮訂購') return 0;
  
  // 計算付費產品總金額（排除贈品）
  const paidItemsTotal = order.items
    .filter(item => !item.is_gift)
    .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  
  // 成交手續費 = 付費產品金額 × 5.5%
  const transactionFee = paidItemsTotal * 0.055;
  // 金流與系統處理費 = 付費產品金額 × 2%
  const paymentFee = paidItemsTotal * 0.02;
  // 總手續費 = 成交手續費 + 金流與系統處理費，四捨五入到整數
  return Math.round(transactionFee + paymentFee);
}

// ✅ 計算編輯訂單的信用卡手續費
export function calculateEditCreditCardFee(orderForm, customers) {
  if (!orderForm.customer_id) return 0;
  
  const selectedCustomer = customers.find(c => c.id === parseInt(orderForm.customer_id));
  if (!selectedCustomer || selectedCustomer.payment_method !== '信用卡') return 0;
  
  // 計算付費產品總金額（排除贈品）
  const paidItemsTotal = orderForm.items
    .filter(item => !item.is_gift)
    .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  
  // 手續費 = 付費產品金額 × 2%
  return Math.round(paidItemsTotal * 0.02);
}

// ✅ 計算編輯訂單的蝦皮費用
export function calculateEditShopeeFee(orderForm, customers) {
  if (!orderForm.customer_id) return 0;
  
  const selectedCustomer = customers.find(c => c.id === parseInt(orderForm.customer_id));
  if (!selectedCustomer || selectedCustomer.source !== '蝦皮訂購') return 0;
  
  // 計算付費產品總金額（排除贈品）
  const paidItemsTotal = orderForm.items
    .filter(item => !item.is_gift)
    .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  
  // 成交手續費 = 付費產品金額 × 5.5%
  const transactionFee = paidItemsTotal * 0.055;
  // 金流與系統處理費 = 付費產品金額 × 2%
  const paymentFee = paidItemsTotal * 0.02;
  // 總手續費 = 成交手續費 + 金流與系統處理費，四捨五入到整數
  return Math.round(transactionFee + paymentFee);
}

