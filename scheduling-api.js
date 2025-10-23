// 訂單排程相關的API端點
// 這個檔案包含v3新增的排程功能API，不修改現有API

const express = require('express');
const router = express.Router();

// 獲取未排程的訂單
router.get('/api/scheduling/unscheduled-orders', (req, res) => {
  try {
    // 篩選出未排程的訂單（manufacturing_date 為 null）
    const unscheduledOrders = db.orders.filter(order => 
      order.manufacturing_date === null && 
      order.status !== 'completed' &&
      order.status !== 'cancelled'
    );
    
    // 按 production_order 排序
    unscheduledOrders.sort((a, b) => (a.production_order || 0) - (b.production_order || 0));
    
    res.json(unscheduledOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新訂單的製造日期
router.put('/api/scheduling/orders/:id/manufacturing-date', (req, res) => {
  const { id } = req.params;
  const { manufacturing_date } = req.body;
  
  try {
    const orderIndex = db.orders.findIndex(o => o.id === parseInt(id));
    if (orderIndex === -1) {
      res.status(404).json({ error: '訂單不存在' });
      return;
    }
    
    // 更新製造日期
    db.orders[orderIndex].manufacturing_date = manufacturing_date;
    db.orders[orderIndex].updated_at = new Date().toISOString();
    
    saveData();
    res.json({ 
      message: '製造日期更新成功', 
      order: db.orders[orderIndex] 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新訂單的生產順序
router.put('/api/scheduling/orders/:id/production-order', (req, res) => {
  const { id } = req.params;
  const { production_order } = req.body;
  
  try {
    const orderIndex = db.orders.findIndex(o => o.id === parseInt(id));
    if (orderIndex === -1) {
      res.status(404).json({ error: '訂單不存在' });
      return;
    }
    
    // 更新生產順序
    db.orders[orderIndex].production_order = production_order;
    db.orders[orderIndex].updated_at = new Date().toISOString();
    
    saveData();
    res.json({ 
      message: '生產順序更新成功', 
      order: db.orders[orderIndex] 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 批量更新生產順序
router.put('/api/scheduling/orders/batch-production-order', (req, res) => {
  const { orders } = req.body; // [{ id, production_order }, ...]
  
  try {
    orders.forEach(({ id, production_order }) => {
      const orderIndex = db.orders.findIndex(o => o.id === parseInt(id));
      if (orderIndex !== -1) {
        db.orders[orderIndex].production_order = production_order;
        db.orders[orderIndex].updated_at = new Date().toISOString();
      }
    });
    
    saveData();
    res.json({ message: '批量更新生產順序成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 獲取指定日期的製造排程
router.get('/api/scheduling/manufacturing/:date', (req, res) => {
  const { date } = req.params;
  
  try {
    // 篩選出指定日期的製造訂單
    const manufacturingOrders = db.orders.filter(order => 
      order.manufacturing_date === date && 
      order.status !== 'completed' &&
      order.status !== 'cancelled'
    );
    
    // 按 production_order 排序
    manufacturingOrders.sort((a, b) => (a.production_order || 0) - (b.production_order || 0));
    
    res.json(manufacturingOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 獲取訂單的詳細信息（包含訂單項目）
router.get('/api/scheduling/orders/:id/details', (req, res) => {
  const { id } = req.params;
  
  try {
    const order = db.orders.find(o => o.id === parseInt(id));
    if (!order) {
      res.status(404).json({ error: '訂單不存在' });
      return;
    }
    
    // 獲取訂單項目
    const orderItems = db.order_items.filter(item => item.order_id === parseInt(id));
    
    res.json({
      ...order,
      items: orderItems
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

