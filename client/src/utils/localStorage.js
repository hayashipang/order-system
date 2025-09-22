// 本地存儲工具函數
const STORAGE_KEY = 'order-system-data';

// 獲取本地數據
export const getLocalData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('讀取本地數據失敗:', error);
  }
  
  // 如果沒有本地數據，返回預設數據
  return {
    users: [
      { id: 1, username: 'admin', password: 'admin123', role: 'admin' },
      { id: 2, username: 'kitchen', password: 'kitchen123', role: 'kitchen' }
    ],
    customers: [
      {
        id: 1,
        name: "測試客戶",
        phone: "0912345678",
        address: "台北市",
        source: "網路"
      }
    ],
    products: [
      { id: 1, name: "蔬果73-元氣綠", price: 120, description: "綠色蔬果系列，富含維生素" },
      { id: 2, name: "蔬果73-活力紅", price: 120, description: "紅色蔬果系列，抗氧化" },
      { id: 3, name: "蔬果73-亮妍莓", price: 130, description: "莓果系列，美容養顏" },
      { id: 4, name: "蔬菜73-幸運果", price: 120, description: "黃橘色蔬果系列，提升免疫力" },
      { id: 5, name: "蔬菜100-順暢綠", price: 150, description: "100% 綠色蔬菜，促進消化" },
      { id: 6, name: "蔬菜100-養生黑", price: 160, description: "100% 黑色養生，滋補強身" },
      { id: 7, name: "蔬菜100-養眼晶(有機枸杞)", price: 180, description: "100% 有機枸杞，護眼明目" },
      { id: 8, name: "蔬菜100-法國黑巧70", price: 200, description: "100% 法國黑巧克力，濃郁香醇" }
    ],
    orders: [
      {
        id: 1,
        customer_id: 1,
        order_date: "2025-01-22",
        delivery_date: "2025-01-22",
        status: "completed",
        notes: ""
      }
    ],
    order_items: [
      {
        id: 1,
        order_id: 1,
        product_name: "蔬果73-亮妍莓",
        quantity: 1,
        unit_price: 130,
        special_notes: "",
        status: "completed"
      }
    ]
  };
};

// 保存數據到本地
export const saveLocalData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('保存本地數據失敗:', error);
    return false;
  }
};

// 生成新的 ID
export const generateId = (data, key) => {
  const items = data[key] || [];
  if (items.length === 0) return 1;
  return Math.max(...items.map(item => item.id)) + 1;
};
