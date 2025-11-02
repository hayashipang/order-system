import axios from 'axios';
import config from '../../../config';

// ✅ 取得運費設定
export async function fetchShippingFee() {
  try {
    const response = await axios.get(`${config.apiUrl}/api/shipping-fee`);
    return response.data.shippingFee;
  } catch (err) {
    console.error('載入運費設定失敗:', err);
    throw err;
  }
}

// ✅ 取得出貨訂單
export async function fetchShippingOrders(shippingDate) {
  try {
    const response = await axios.get(`${config.apiUrl}/api/orders/delivery/${shippingDate}`);
    return response.data.orders || [];
  } catch (err) {
    console.error('載入出貨訂單錯誤:', err);
    throw err;
  }
}

// ✅ 更新出貨狀態
export async function updateShippingStatus(orderId, status) {
  try {
    const response = await axios.put(`${config.apiUrl}/api/orders/${orderId}/shipping-status`, { status });
    return response.data;
  } catch (err) {
    console.error('更新出貨狀態錯誤:', err);
    throw err;
  }
}

// ✅ 取得週出貨概覽
export async function fetchWeeklyShippingData(shippingDate) {
  try {
    const response = await axios.get(`${config.apiUrl}/api/orders/shipping-weekly/${shippingDate}`);
    return response.data.weekly_data || [];
  } catch (err) {
    console.error('載入週出貨概覽錯誤:', err);
    throw err;
  }
}

// ✅ 取得客戶列表
export async function fetchCustomers() {
  try {
    const response = await axios.get(`${config.apiUrl}/api/customers`);
    return response.data;
  } catch (err) {
    console.error('載入客戶列表失敗:', err);
    throw err;
  }
}

// ✅ 取得產品列表（包含備用硬編碼產品）
export async function fetchProducts() {
  try {
    const response = await axios.get(`${config.apiUrl}/api/products`);
    return response.data;
  } catch (err) {
    console.error('載入產品列表失敗:', err);
    console.log('使用硬編碼產品資料...');
    // 如果 API 失敗，使用硬編碼的產品資料
    const hardcodedProducts = [
      { id: 1, name: "蔬果73-元氣綠", price: 134, description: "綠色蔬果系列，富含維生素" },
      { id: 2, name: "蔬果73-活力紅", price: 134, description: "紅色蔬果系列，抗氧化" },
      { id: 3, name: "蔬果73-亮妍莓", price: 134, description: "莓果系列，美容養顏" },
      { id: 4, name: "蔬菜73-幸運果", price: 134, description: "黃橘色蔬果系列，提升免疫力" },
      { id: 5, name: "蔬菜100-順暢綠", price: 134, description: "100% 綠色 蔬菜，促進消化" },
      { id: 6, name: "蔬菜100-養生黑", price: 134, description: "100% 黑色養生，滋補強身" },
      { id: 7, name: "蔬菜100-養眼晶", price: 139, description: "100% 有機枸杞，護眼明目" },
      { id: 8, name: "蔬菜100-法國黑巧70", price: 139, description: "100% 法國黑巧克力，70% 可可含量" },
      { id: 9, name: "隨機送", price: 0, description: "" }
    ];
    return hardcodedProducts;
  }
}

// ✅ 取得庫存資料
export async function fetchInventoryData() {
  try {
    const response = await axios.get(`${config.apiUrl}/api/inventory/scheduling`);
    return response.data || [];
  } catch (err) {
    console.error('載入庫存資料失敗:', err);
    throw err;
  }
}

// ✅ 取得庫存異動記錄
export async function fetchInventoryTransactions() {
  try {
    const response = await axios.get(`${config.apiUrl}/api/inventory/transactions`);
    return response.data || [];
  } catch (err) {
    console.error('載入庫存異動記錄失敗:', err);
    throw err;
  }
}

// ✅ 新增庫存異動記錄
export async function createInventoryTransaction(transactionData) {
  try {
    await axios.post(`${config.apiUrl}/api/inventory/transaction`, transactionData);
    return true;
  } catch (err) {
    console.error('庫存異動失敗:', err);
    throw err;
  }
}

// ✅ 刪除庫存異動記錄
export async function deleteInventoryTransaction(transactionId) {
  try {
    await axios.delete(`${config.apiUrl}/api/inventory/transaction/${transactionId}`);
    return true;
  } catch (err) {
    console.error('刪除庫存異動記錄失敗:', err);
    throw err;
  }
}

// ✅ 重置所有庫存異動記錄
export async function resetInventoryTransactions() {
  try {
    await axios.delete(`${config.apiUrl}/api/inventory/transactions/reset`);
    return true;
  } catch (err) {
    console.error('重置庫存異動記錄失敗:', err);
    throw err;
  }
}

// ✅ 重置所有產品庫存
export async function resetAllStock() {
  try {
    const response = await axios.put(`${config.apiUrl}/api/products/reset-stock`);
    return response.data;
  } catch (err) {
    console.error('庫存歸零錯誤:', err);
    throw err;
  }
}

// ✅ 更新客戶
export async function updateCustomer(customerId, customerData) {
  try {
    await axios.put(`${config.apiUrl}/api/customers/${customerId}`, customerData);
    return true;
  } catch (err) {
    console.error('更新客戶失敗:', err);
    throw err;
  }
}

// 別名：為了與重構代碼中的命名保持一致
export const updateCustomerApi = updateCustomer;

// ✅ 刪除客戶
export async function deleteCustomer(customerId) {
  try {
    await axios.delete(`${config.apiUrl}/api/customers/${customerId}`);
    return true;
  } catch (err) {
    console.error('刪除客戶失敗:', err);
    throw err;
  }
}

// 別名：為了與重構代碼中的命名保持一致
export const deleteCustomerApi = deleteCustomer;

// ✅ 取得訂單歷史
export async function fetchOrderHistory(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.order_type) params.append('order_type', filters.order_type);
    
    const url = `${config.apiUrl}/api/orders/history?${params.toString()}`;
    const response = await axios.get(url);
    
    // ✅ 後端返回格式為 { orders: [...], count: ... }，需要正確解析
    const data = response.data?.orders || (Array.isArray(response.data) ? response.data : []);
    return data;
  } catch (err) {
    console.error('載入訂單歷史錯誤:', err);
    throw err;
  }
}

// 別名：為了與重構代碼中的命名保持一致
export const fetchOrderHistoryApi = fetchOrderHistory;

// ✅ 新增訂單
export async function createOrder(orderData) {
  try {
    await axios.post(`${config.apiUrl}/api/orders`, orderData);
    return true;
  } catch (err) {
    console.error('建立訂單失敗:', err);
    throw err;
  }
}

// 別名：為了與重構代碼中的命名保持一致
export const addOrderApi = createOrder;

// ✅ 新增客戶
export async function createCustomer(customerData) {
  try {
    await axios.post(`${config.apiUrl}/api/customers`, customerData);
    return true;
  } catch (err) {
    console.error('新增客戶失敗:', err);
    throw err;
  }
}

// 別名：為了與重構代碼中的命名保持一致
export const addCustomerApi = createCustomer;

// ✅ 取得訂單詳情
export async function fetchOrder(orderId) {
  try {
    const response = await axios.get(`${config.apiUrl}/api/orders/${orderId}`);
    return response.data;
  } catch (err) {
    console.error('載入訂單失敗:', err);
    throw err;
  }
}

// 別名：為了與重構代碼中的命名保持一致
export const fetchOrderByIdApi = fetchOrder;

// ✅ 更新訂單
export async function updateOrder(orderId, orderData) {
  try {
    const response = await axios.put(`${config.apiUrl}/api/orders/${orderId}`, orderData);
    return response.data;
  } catch (err) {
    console.error('更新訂單失敗:', err);
    throw err;
  }
}

// 別名：為了與重構代碼中的命名保持一致
export const updateOrderApi = updateOrder;

// ✅ 刪除訂單
export async function deleteOrder(orderId) {
  try {
    await axios.delete(`${config.apiUrl}/api/orders/${orderId}`);
    return true;
  } catch (err) {
    console.error('刪除訂單失敗:', err);
    throw err;
  }
}

// 別名：為了與重構代碼中的命名保持一致
export const deleteOrderApi = deleteOrder;

// ✅ 匯出訂單歷史為 CSV
export async function exportOrderHistoryToCSV(filters) {
  try {
    const params = new URLSearchParams();
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.order_type) params.append('order_type', filters.order_type);
    
    const response = await fetch(`${config.apiUrl}/api/orders/history/export/csv?${params}`);
    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `訂單歷史_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return true;
    } else {
      throw new Error('匯出失敗，請稍後再試');
    }
  } catch (error) {
    console.error('匯出錯誤:', error);
    throw error;
  }
}

// 別名：為了與重構代碼中的命名保持一致
export const exportToCSV = exportOrderHistoryToCSV;

// ✅ 刪除訂單歷史（根據篩選條件）
export async function deleteOrderHistory(filters) {
  try {
    const params = new URLSearchParams();
    if (filters.customer_id) params.append('customer_id', filters.customer_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.order_type) params.append('order_type', filters.order_type);
    
    const url = `${config.apiUrl}/api/orders/history/delete?${params.toString()}`;
    const response = await axios.delete(url);
    return response.data;
  } catch (err) {
    console.error('刪除訂單歷史失敗:', err);
    throw err;
  }
}

// ✅ 分離下載資料
export async function downloadData(dataType) {
  let apiUrl;
  
  switch (dataType) {
    case 'customers':
      apiUrl = `${config.apiUrl}/api/customers`;
      break;
    case 'products':
      apiUrl = `${config.apiUrl}/api/products`;
      break;
    case 'orders':
      apiUrl = `${config.apiUrl}/api/orders/history`;
      break;
    case 'posOrders':
      apiUrl = `${config.apiUrl}/api/orders/history`;
      break;
    default:
      throw new Error('無效的資料類型');
  }

  const response = await axios.get(apiUrl);
  let data = response.data;
  
  // 如果是POS訂單，過濾出POS相關的訂單
  if (dataType === 'posOrders') {
    data = data.filter(order => 
      order.source === '現場訂購' || 
      order.created_by === 'pos-system' ||
      order.order_type === 'walk-in'
    );
  }
  
  return data;
}

// ✅ 批量下載資料
export async function batchDownload(downloadOptions) {
  const downloads = [];
  
  if (downloadOptions.customers) {
    downloads.push({ type: 'customers', url: `${config.apiUrl}/api/customers` });
  }
  if (downloadOptions.products) {
    downloads.push({ type: 'products', url: `${config.apiUrl}/api/products` });
  }
  if (downloadOptions.orders) {
    downloads.push({ type: 'orders', url: `${config.apiUrl}/api/orders/history` });
  }
  if (downloadOptions.posOrders) {
    downloads.push({ type: 'posOrders', url: `${config.apiUrl}/api/orders/history` });
  }

  if (downloads.length === 0) {
    throw new Error('請至少選擇一種資料類型');
  }

  // 並行下載所有選中的資料
  const responses = await Promise.all(
    downloads.map(download => axios.get(download.url))
  );

  // 創建包含所有資料的備份物件
  const backupData = {
    backup_date: new Date().toISOString(),
    download_types: downloads.map(d => d.type)
  };

  downloads.forEach((download, index) => {
    let data = responses[index].data;
    
    // 如果是POS訂單，過濾出POS相關的訂單
    if (download.type === 'posOrders') {
      data = data.filter(order => 
        order.source === '現場訂購' || 
        order.created_by === 'pos-system' ||
        order.order_type === 'walk-in'
      );
    }
    
    backupData[download.type] = data;
  });

  return backupData;
}

// ✅ 批量上傳資料（清空現有資料後上傳）
export async function batchUpload(uploadOptions, backupData) {
  // 清空現有資料
  if (uploadOptions.customers && backupData.customers) {
    const existingCustomers = await axios.get(`${config.apiUrl}/api/customers`);
    for (const customer of existingCustomers.data) {
      await axios.delete(`${config.apiUrl}/api/customers/${customer.id}`);
    }
  }
  
  if (uploadOptions.products && backupData.products) {
    const existingProducts = await axios.get(`${config.apiUrl}/api/products`);
    for (const product of existingProducts.data) {
      await axios.delete(`${config.apiUrl}/api/products/${product.id}`);
    }
  }
  
  if (uploadOptions.orders && backupData.orders) {
    const existingOrders = await axios.get(`${config.apiUrl}/api/orders/history`);
    for (const order of existingOrders.data) {
      await axios.delete(`${config.apiUrl}/api/orders/${order.id}`);
    }
  }

  // 上傳新資料
  if (uploadOptions.customers && backupData.customers) {
    for (const itemData of backupData.customers) {
      await axios.post(`${config.apiUrl}/api/customers`, itemData);
    }
  }

  if (uploadOptions.products && backupData.products) {
    for (const itemData of backupData.products) {
      await axios.post(`${config.apiUrl}/api/products`, itemData);
    }
  }

  if (uploadOptions.orders && backupData.orders) {
    for (const itemData of backupData.orders) {
      // 處理客戶ID映射
      const customer_id = itemData.customer_id;
      let resolvedCustomerId = customer_id;

      if (customer_id) {
        try {
          const customerResponse = await axios.get(`${config.apiUrl}/api/customers/${customer_id}`);
          if (customerResponse.data) {
            resolvedCustomerId = customerResponse.data.id;
          }
        } catch (err) {
          // 如果客戶不存在，嘗試通過名稱查找
          try {
            const customersResponse = await axios.get(`${config.apiUrl}/api/customers`);
            const matchingCustomer = customersResponse.data.find(c => 
              c.name === itemData.customer_name || c.phone === itemData.phone
            );
            
            if (matchingCustomer) {
              resolvedCustomerId = matchingCustomer.id;
            } else {
              // 如果找不到，創建一個默認客戶
              const defaultCustomer = {
                name: itemData.customer_name || '未命名客戶',
                phone: itemData.phone || '',
                address: itemData.address || '',
                source: itemData.source || '直接來店訂購',
                payment_method: itemData.payment_method || '貨到付款'
              };
              const newCustomerResponse = await axios.post(`${config.apiUrl}/api/customers`, defaultCustomer);
              resolvedCustomerId = newCustomerResponse.data.id;
            }
          } catch (err2) {
            console.error('處理客戶ID失敗:', err2);
          }
        }
      }

      const orderData = {
        ...itemData,
        customer_id: resolvedCustomerId
      };

      const apiUrl = itemData.source === '現場訂購' || itemData.order_type === 'walk-in'
        ? `${config.apiUrl}/api/shared/pos-orders`
        : `${config.apiUrl}/api/orders`;

      await axios.post(apiUrl, orderData, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return true;
}

// ✅ 分離上傳資料
export async function separateUpload(dataType, backupData) {
  // 清空現有資料
  if (dataType === 'customers') {
    const existingCustomers = await axios.get(`${config.apiUrl}/api/customers`);
    for (const customer of existingCustomers.data) {
      await axios.delete(`${config.apiUrl}/api/customers/${customer.id}`);
    }
  }
  
  if (dataType === 'products') {
    const existingProducts = await axios.get(`${config.apiUrl}/api/products`);
    for (const product of existingProducts.data) {
      await axios.delete(`${config.apiUrl}/api/products/${product.id}`);
    }
  }
  
  if (dataType === 'orders') {
    const existingOrders = await axios.get(`${config.apiUrl}/api/orders/history`);
    for (const order of existingOrders.data) {
      await axios.delete(`${config.apiUrl}/api/orders/${order.id}`);
    }
  }

  // 上傳新資料
  if (dataType === 'customers' && backupData.customers) {
    for (const itemData of backupData.customers) {
      await axios.post(`${config.apiUrl}/api/customers`, itemData);
    }
  }

  if (dataType === 'products' && backupData.products) {
    for (const itemData of backupData.products) {
      await axios.post(`${config.apiUrl}/api/products`, itemData);
    }
  }

  if (dataType === 'orders' && backupData.orders) {
    for (const itemData of backupData.orders) {
      // 處理客戶ID映射
      const customer_id = itemData.customer_id;
      let resolvedCustomerId = customer_id;

      if (customer_id) {
        try {
          const customerResponse = await axios.get(`${config.apiUrl}/api/customers/${customer_id}`);
          if (customerResponse.data) {
            resolvedCustomerId = customerResponse.data.id;
          }
        } catch (err) {
          // 如果客戶不存在，嘗試通過名稱查找
          try {
            const customersResponse = await axios.get(`${config.apiUrl}/api/customers`);
            const matchingCustomer = customersResponse.data.find(c => 
              c.name === itemData.customer_name || c.phone === itemData.phone
            );
            
            if (matchingCustomer) {
              resolvedCustomerId = matchingCustomer.id;
            } else {
              // 如果找不到，創建一個默認客戶
              const defaultCustomer = {
                name: itemData.customer_name || '未命名客戶',
                phone: itemData.phone || '',
                address: itemData.address || '',
                source: itemData.source || '直接來店訂購',
                payment_method: itemData.payment_method || '貨到付款'
              };
              const newCustomerResponse = await axios.post(`${config.apiUrl}/api/customers`, defaultCustomer);
              resolvedCustomerId = newCustomerResponse.data.id;
            }
          } catch (err2) {
            console.error('處理客戶ID失敗:', err2);
          }
        }
      }

      const orderData = {
        ...itemData,
        customer_id: resolvedCustomerId
      };

      const apiUrl = itemData.source === '現場訂購' || itemData.order_type === 'walk-in'
        ? `${config.apiUrl}/api/shared/pos-orders`
        : `${config.apiUrl}/api/orders`;

      await axios.post(apiUrl, orderData, {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return true;
}

