// ==========================================================
//  date.js
//  ✅ 抽取自 adminPanelUtils.js 中的純日期工具函數（無副作用）
//  ✅ 保持邏輯完全不變
// ==========================================================

// ==========================================================
// ✅ 日期工具函數
// ==========================================================

/**
 * ✅ 取得今天的日期字串 (YYYY-MM-DD)
 * @returns {string} 今天的日期字串
 */
export function getTodayDateString() {
  const today = new Date();
  return today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    String(today.getDate()).padStart(2, '0');
}

/**
 * ✅ 格式化日期字符串（用於顯示）
 * @param {string} dateStr - 日期字串
 * @returns {string} 格式化後的日期字串
 */
export function formatDateString(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Taipei'
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * ✅ 格式化日期時間字符串（用於顯示）
 * @param {string} dateStr - 日期時間字串
 * @returns {string} 格式化後的日期時間字串
 */
export function formatDateTimeString(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Taipei'
    });
  } catch (e) {
    return dateStr;
  }
}

