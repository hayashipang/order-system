// ==========================================================
//  filters.js
//  ✅ 抽取自 adminPanelUtils.js、useCustomers.js、useHistoryIO.js 中的純過濾函數（無副作用）
//  ✅ 保持邏輯完全不變
// ==========================================================

// ==========================================================
// ✅ 客戶篩選邏輯
// ==========================================================

/**
 * ✅ 客戶篩選（包含搜尋關鍵字和來源篩選）
 * @param {Array} customers - 客戶列表
 * @param {string} searchTerm - 搜尋關鍵字
 * @param {string} sourceFilter - 來源篩選（可選）
 * @returns {Array} 過濾後的客戶列表
 */
export function filterCustomers(customers, searchTerm, sourceFilter) {
  let filtered = customers;

  // 按搜尋關鍵字篩選
  if (searchTerm.trim()) {
    filtered = filtered.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm)) ||
      (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  // 按來源篩選
  if (sourceFilter) {
    filtered = filtered.filter(customer => customer.source === sourceFilter);
  }

  return filtered;
}

/**
 * ✅ 訂單歷史客戶篩選邏輯
 * @param {Array} customers - 客戶列表
 * @param {string} searchTerm - 搜尋關鍵字
 * @returns {Array} 過濾後的客戶列表
 */
export function filterHistoryCustomers(customers, searchTerm) {
  let filtered = customers;

  // 按搜尋關鍵字篩選
  if (searchTerm.trim()) {
    filtered = filtered.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm)) ||
      (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }

  return filtered;
}

// ==========================================================
// ✅ 向後兼容：導出 Util 後綴版本
// ==========================================================

/**
 * ✅ 客戶篩選（Util 後綴版本，向後兼容）
 */
export const filterCustomersUtil = filterCustomers;

/**
 * ✅ 訂單歷史客戶篩選（Util 後綴版本，向後兼容）
 */
export const filterHistoryCustomersUtil = filterHistoryCustomers;

