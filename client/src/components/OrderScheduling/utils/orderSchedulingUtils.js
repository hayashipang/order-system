// ✅ 解析 items 的安全函數
export function parseOrderItems(items) {
  try {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    if (typeof items === "string") {
      const s = items.trim();
      if (!s || s === "[]") return [];
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch (err) {
    console.error("❌ parseOrderItems 解析失敗:", err);
    return [];
  }
}

// ✅ 取得星期名稱
export function getWeekdayName(dateStr) {
  const date = new Date(dateStr);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return weekdays[date.getDay()];
}

// ✅ 根據訂單數量獲取顏色
export function getOrderCountColor(orderCount) {
  if (orderCount === 0) return '#e9ecef'; // 淺灰
  if (orderCount <= 3) return '#28a745'; // 綠色
  if (orderCount <= 6) return '#ffc107'; // 黃色
  return '#dc3545'; // 紅色
}

