const fs = require('fs');
const path = require('path');

// 更新資料庫結構，新增 manufacturing_date 和 production_order 欄位
const updateDatabaseV3 = () => {
  try {
    // 讀取現有資料
    const dataPath = path.join(__dirname, 'data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log('開始更新資料庫結構 v3...');
    
    // 更新訂單結構
    if (data.orders) {
      data.orders.forEach((order, index) => {
        // 新增 manufacturing_date 欄位（預設為 null，表示未排程）
        if (!order.manufacturing_date) {
          order.manufacturing_date = null;
        }
        
        // 新增 production_order 欄位（預設為訂單ID，用於排序）
        if (!order.production_order) {
          order.production_order = order.id;
        }
        
        // 新增 v3 版本標記
        if (!order.v3_updated) {
          order.v3_updated = true;
        }
      });
      
      console.log(`已更新 ${data.orders.length} 筆訂單`);
    }
    
    // 備份原始資料
    const backupPath = path.join(__dirname, `data.v3.backup.${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(data, null, 2));
    console.log(`已備份原始資料到: ${backupPath}`);
    
    // 儲存更新後的資料
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    console.log('資料庫結構更新完成！');
    
    // 顯示更新摘要
    console.log('\n=== v3 更新摘要 ===');
    console.log('新增欄位:');
    console.log('- manufacturing_date: 製造日期（null = 未排程）');
    console.log('- production_order: 生產順序（用於拖拉排序）');
    console.log('- v3_updated: 版本標記');
    
    return true;
  } catch (error) {
    console.error('更新資料庫時發生錯誤:', error);
    return false;
  }
};

// 執行更新
if (require.main === module) {
  updateDatabaseV3();
}

module.exports = updateDatabaseV3;

