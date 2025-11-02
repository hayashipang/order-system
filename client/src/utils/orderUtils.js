// 統一的訂單項目解析工具函數
// 處理所有可能的 order.items 類型，確保不會爆炸

export function parseOrderItems(items) {
  try {
    if (!items) return [];

    if (Array.isArray(items)) return items;

    if (typeof items === "string") {
      if (items.trim() === "" || items === "[]") return [];
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    }

    if (typeof items === "object") {
      if (items.length !== undefined) return Array.from(items);
      return [];
    }

    return [];
  } catch (err) {
    console.error("❌ parseOrderItems 解析失敗:", err, "原始:", items);
    return [];
  }
}

// 安全獲取產品名稱
export function getProductName(item) {
  return item.product_name || item.name || "";
}

// 安全獲取數量
export function getQuantity(item) {
  return Number(item.quantity) || 0;
}

// 安全獲取價格
export function getPrice(item) {
  return Number(item.unit_price) || 0;
}

// 計算總金額
export function calculateAmount(item) {
  return getQuantity(item) * getPrice(item);
}








