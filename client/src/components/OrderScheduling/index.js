import React from "react";
import { useOrderScheduling } from "./hooks/useOrderScheduling";
import { parseOrderItems, getWeekdayName, getOrderCountColor } from "./utils/orderSchedulingUtils";

export default function OrderScheduling() {
  const {
    // 狀態
    selectedOrderDate,
    setSelectedOrderDate,
    allUnScheduledOrdersByDate,
    allProducts,
    selectedOrderIds,
    setSelectedOrderIds,
    allUnScheduledOrders,
    selectedProductionDate,
    setSelectedProductionDate,
    selectedDeliveryDate,
    setSelectedDeliveryDate,
    lastSchedule,
    manualAdjustments,
    setManualAdjustments,
    availMap,
    weeklyData,
    shopeePriority,
    setShopeePriority,
    scheduledOrders,
    // 方法
    submitScheduling,
    undoLastSchedule,
    deleteDaySchedule,
    deleteAllHistorySchedules,
  } = useOrderScheduling();

  return (
    <div className="order-scheduling-page" style={{ 
      padding: 24, 
      width: "100vw",
      marginLeft: "calc(-50vw + 50%)",
      marginRight: "calc(-50vw + 50%)",
      boxSizing: "border-box"
    }}>
      <h2 style={{ marginTop: 0 }}>🗓 訂單排程</h2>
      
      {/* 過去一週和未來一週有訂單的日期 */}
      <div style={{
        marginBottom: 24,
        padding: 20,
        background: '#f8f9fa',
        borderRadius: 12,
        border: '2px solid #e9ecef'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>有訂單的日期（過去10天 + 未來4天）</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(15, 1fr)',
          gap: '10px',
          overflowX: 'auto'
        }}>
          {weeklyData.map((dayData, index) => (
            <div
              key={index}
              onClick={() => {
                setSelectedOrderDate(dayData.date);
              }}
              style={{
                background: getOrderCountColor(dayData.order_count),
                color: dayData.order_count === 0 ? '#6c757d' : 'white',
                padding: '15px 10px',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: selectedOrderDate === dayData.date ? '3px solid #3498db' : '2px solid transparent'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                {dayData.order_count}
              </div>
              <div style={{ fontSize: '16px', opacity: 0.9, fontWeight: '600' }}>
                {getWeekdayName(dayData.date)}
              </div>
              <div style={{ fontSize: '16px', opacity: 0.8, marginTop: '4px', fontWeight: '500' }}>
                {dayData.date.split('-')[1]}/{dayData.date.split('-')[2]}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '12px', height: '12px', background: '#e9ecef', borderRadius: '3px' }}></div>
              <span>無訂單</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '12px', height: '12px', background: '#28a745', borderRadius: '3px' }}></div>
              <span>1-3 筆</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '12px', height: '12px', background: '#ffc107', borderRadius: '3px' }}></div>
              <span>4-6 筆</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '12px', height: '12px', background: '#dc3545', borderRadius: '3px' }}></div>
              <span>6+ 筆</span>
            </div>
          </div>
        </div>
      </div>

      {lastSchedule?.scheduleId && (
        <div style={{
          background: '#fff7ed',
          border: '1px solid #fdba74',
          color: '#9a3412',
          padding: 12,
          borderRadius: 8,
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            已完成一個排程（日期：{lastSchedule.production_date}）。若有誤，您可以立即撤銷。
          </div>
          <div>
            <button onClick={undoLastSchedule} style={{
              padding: '8px 12px',
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 700
            }}>撤銷本次排程</button>
          </div>
        </div>
      )}

      {/* 未排程訂單（一週所有訂單） */}
      <div style={{ 
        background: "#fff", 
        borderRadius: 12, 
        padding: 20, 
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        marginBottom: 24
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>
            未排程訂單（過去10天 + 未來4天）
          </h3>
          {(() => {
            // 計算所有訂單數量
            const allOrders = [];
            Object.keys(allUnScheduledOrdersByDate)
              .sort()
              .forEach((date) => {
                const orders = allUnScheduledOrdersByDate[date];
                orders.forEach(order => {
                  allOrders.push({ ...order, order_date: date });
                });
              });
            
            const totalOrders = allOrders.length;
            const selectedCount = selectedOrderIds.length;
            const allSelected = totalOrders > 0 && selectedCount === totalOrders;
            const someSelected = selectedCount > 0 && selectedCount < totalOrders;
            
            return (
              <label style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 8, 
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                color: "#374151"
              }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = someSelected;
                    }
                  }}
                  onChange={(e) => {
                    if (e.target.checked) {
                      // 全選：選中所有訂單
                      const allOrderIds = allOrders.map(order => order.id);
                      setSelectedOrderIds(allOrderIds);
                    } else {
                      // 全不選：清空所有選中
                      setSelectedOrderIds([]);
                    }
                  }}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                全選
              </label>
            );
          })()}
        </div>
        
        {Object.keys(allUnScheduledOrdersByDate).length === 0 ? (
          <div style={{ color: "#777", textAlign: "center", padding: 40 }}>
            過去10天和未來4天沒有未排程訂單
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12
          }}>
            {(() => {
              // 將所有訂單合併並排序
              const allOrders = [];
              Object.keys(allUnScheduledOrdersByDate)
                .sort() // 按日期排序
                .forEach((date) => {
                  const orders = allUnScheduledOrdersByDate[date];
                  orders.forEach(order => {
                    allOrders.push({ ...order, order_date: date });
                  });
                });
              
              // 所有訂單按日期和建立時間排序
              allOrders.sort((a, b) => {
                // 先按日期排序
                if (a.order_date !== b.order_date) {
                  return a.order_date.localeCompare(b.order_date);
                }
                // 同一天內按建立時間排序（由早到晚）
                const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return timeA - timeB;
              });
              
              return allOrders.map((order) => {
                const items = parseOrderItems(order.items);
                return (
                  <div 
                    key={order.id} 
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 12,
                      padding: 16,
                      background: selectedOrderIds.includes(order.id) ? "#f0fff4" : "#fff",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      minHeight: "120px"
                    }}
                  >
                    {/* 日期顯示在卡片頂部 */}
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#666",
                      marginBottom: 4
                    }}>
                      {order.order_date}
                    </div>
                    
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(order.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrderIds([...selectedOrderIds, order.id]);
                          } else {
                            setSelectedOrderIds(selectedOrderIds.filter((id) => id !== order.id));
                          }
                        }}
                        style={{ width: 18, height: 18, marginTop: 2 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
                          {/* ✅ 檢查是否為蝦皮訂單 */}
                          {(() => {
                            const isShopee = order.source && (order.source.includes('蝦皮') || order.source.toLowerCase().includes('shopee'));
                            return (
                              <>
                                <span style={{ color: isShopee ? "#dc2626" : "#000" }}>
                                  #{order.id} {order.customer_name || "(未命名客戶)"}
                                </span>
                                {order.source && (
                                  <span style={{ 
                                    fontSize: 11, 
                                    fontWeight: 400, 
                                    color: isShopee ? "#dc2626" : "#666", 
                                    marginLeft: 6
                                  }}>
                                    ({order.source})
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {items.length === 0 ? (
                            <li style={{ fontSize: 11, color: "#666" }}>—</li>
                          ) : (
                            items.map((item, idx) => (
                              <li key={idx} style={{ fontSize: 11, color: "#666", marginBottom: 2 }}>
                                {item.product_name || item.name} × {item.quantity || 0}
                              </li>
                            ))
                          )}
                        </ul>
                        {order.notes && (
                          <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
                            備註：{order.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* 產品彙總（已選訂單） */}
      <div style={{ 
        background: "#fff", 
        borderRadius: 12, 
        padding: 20, 
        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
        marginBottom: 24
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>📦 產品彙總（已選訂單）</h3>
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 8, 
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            color: "#374151"
          }}>
            <input
              type="checkbox"
              checked={shopeePriority}
              onChange={(e) => setShopeePriority(e.target.checked)}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            蝦皮優先
          </label>
        </div>
        
        {selectedOrderIds.length === 0 ? (
          <div style={{ color: "#777", textAlign: "center", padding: 20 }}>
            尚未選擇任何訂單
          </div>
        ) : (
          <div>
            {/* 表格：原訂單數量（只讀）+ 製造 + 可用庫存 */}
            <div>
              <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600, color: "#374151" }}>
                原訂單數量（只讀）
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb" }}>
                <thead>
                  {/* ✅ 第一行：顯示訂單日期 */}
                  <tr style={{ backgroundColor: "#f0f9ff" }}>
                    {(() => {
                      // 獲取選中的訂單並排序（與下方保持一致）
                      const selectedOrders = allUnScheduledOrders.filter(o => selectedOrderIds.includes(o.id));
                      selectedOrders.sort((a, b) => {
                        if (shopeePriority) {
                          const isShopeeA = a.source && (a.source.includes('蝦皮') || a.source.toLowerCase().includes('shopee'));
                          const isShopeeB = b.source && (b.source.includes('蝦皮') || b.source.toLowerCase().includes('shopee'));
                          // 蝦皮訂單靠右：非蝦皮的靠左，蝦皮的靠右
                          if (isShopeeA && !isShopeeB) return 1;  // A是蝦皮，B不是 → A靠右
                          if (!isShopeeA && isShopeeB) return -1; // A不是，B是蝦皮 → B靠右
                          // 同類型內按日期排序
                          const dateA = a.order_date || a.created_at || '';
                          const dateB = b.order_date || b.created_at || '';
                          return dateA.localeCompare(dateB);
                        } else {
                          const dateA = a.order_date || a.created_at || '';
                          const dateB = b.order_date || b.created_at || '';
                          return dateA.localeCompare(dateB);
                        }
                      });
                      
                      return selectedOrders.map(order => {
                        const orderDate = order.order_date || order.created_at || '';
                        const dateStr = orderDate ? orderDate.split('T')[0] : '';
                        const displayDate = dateStr ? `${dateStr.split('-')[1]}/${dateStr.split('-')[2]}` : '-';
                        const isShopee = order.source && (order.source.includes('蝦皮') || order.source.toLowerCase().includes('shopee'));
                        return (
                          <th 
                            key={order.id} 
                            style={{ 
                              padding: "6px 8px", 
                              textAlign: "center", 
                              border: "1px solid #e5e7eb", 
                              fontWeight: 500,
                              fontSize: "12px",
                              backgroundColor: isShopee ? "#ffa500" : "#f0f9ff",
                              color: isShopee ? "#fff" : "#374151"
                            }}
                          >
                            {displayDate}
                          </th>
                        );
                      });
                    })()}
                    {/* ✅ 訂單總數量空列 */}
                    <th style={{ padding: "8px", textAlign: "center", border: "1px solid #e5e7eb", fontWeight: 600, backgroundColor: "#f3f4f6" }}>
                    </th>
                    {/* ✅ 產品名稱空列（移到訂單總數量之後） */}
                    <th style={{ padding: "8px", textAlign: "left", border: "1px solid #e5e7eb", fontWeight: 600 }}>
                    </th>
                    <th style={{ padding: "8px", textAlign: "center", border: "1px solid #e5e7eb", fontWeight: 600, backgroundColor: "#e0f2fe" }}>
                    </th>
                    <th style={{ padding: "8px", textAlign: "center", border: "1px solid #e5e7eb", fontWeight: 600, backgroundColor: "#ecfdf5" }}>
                    </th>
                  </tr>
                  {/* ✅ 第二行：顯示客戶名稱和其他標題 */}
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    {(() => {
                      // 獲取選中的訂單
                      const selectedOrders = allUnScheduledOrders.filter(o => selectedOrderIds.includes(o.id));
                      
                      // ✅ 排序邏輯：如果勾選「蝦皮優先」，蝦皮訂單靠右；否則按日期排序
                      selectedOrders.sort((a, b) => {
                        if (shopeePriority) {
                          const isShopeeA = a.source && (a.source.includes('蝦皮') || a.source.toLowerCase().includes('shopee'));
                          const isShopeeB = b.source && (b.source.includes('蝦皮') || b.source.toLowerCase().includes('shopee'));
                          
                          // 蝦皮訂單靠右：非蝦皮的靠左，蝦皮的靠右
                          if (isShopeeA && !isShopeeB) return 1;  // A是蝦皮，B不是 → A靠右
                          if (!isShopeeA && isShopeeB) return -1; // A不是，B是蝦皮 → B靠右
                          
                          // 同類型內按日期排序
                          const dateA = a.order_date || a.created_at || '';
                          const dateB = b.order_date || b.created_at || '';
                          return dateA.localeCompare(dateB);
                        } else {
                          // 未勾選時，按日期排序（最舊在左）
                          const dateA = a.order_date || a.created_at || '';
                          const dateB = b.order_date || b.created_at || '';
                          return dateA.localeCompare(dateB);
                        }
                      });
                      
                      return selectedOrders.map(order => {
                        // ✅ 如果是蝦皮訂單，背景色改為橘色
                        const isShopee = order.source && (order.source.includes('蝦皮') || order.source.toLowerCase().includes('shopee'));
                        return (
                          <th 
                            key={order.id} 
                            style={{ 
                              padding: "8px", 
                              textAlign: "center", 
                              border: "1px solid #e5e7eb", 
                              fontWeight: 600,
                              backgroundColor: isShopee ? "#ffa500" : "#f9fafb", // 蝦皮訂單：橘色背景
                              color: isShopee ? "#fff" : "#000" // 蝦皮訂單：白色文字
                            }}
                          >
                            {order.customer_name || `訂單#${order.id}`}
                          </th>
                        );
                      });
                    })()}
                    {/* ✅ 訂單總數量 */}
                    <th style={{ padding: "8px", textAlign: "center", border: "1px solid #e5e7eb", fontWeight: 600, backgroundColor: "#f3f4f6" }}>
                      訂單總數量
                    </th>
                    {/* ✅ 產品名稱（移到訂單總數量之後） */}
                    <th style={{ padding: "8px", textAlign: "left", border: "1px solid #e5e7eb", fontWeight: 600 }}>
                      產品名稱
                    </th>
                    <th style={{ padding: "8px", textAlign: "center", border: "1px solid #e5e7eb", fontWeight: 600, backgroundColor: "#e0f2fe" }}>
                      製造
                    </th>
                    <th style={{ padding: "8px", textAlign: "center", border: "1px solid #e5e7eb", fontWeight: 600, backgroundColor: "#ecfdf5" }}>
                      庫存/製造
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allProducts.map(product => {
                    const productName = product.name;
                    const selectedOrders = allUnScheduledOrders.filter(o => selectedOrderIds.includes(o.id));
                    
                    // ✅ 排序邏輯：如果勾選「蝦皮優先」，蝦皮訂單靠右；否則按日期排序（與表頭保持一致）
                    selectedOrders.sort((a, b) => {
                      if (shopeePriority) {
                        const isShopeeA = a.source && (a.source.includes('蝦皮') || a.source.toLowerCase().includes('shopee'));
                        const isShopeeB = b.source && (b.source.includes('蝦皮') || b.source.toLowerCase().includes('shopee'));
                        
                        // 蝦皮訂單靠右：非蝦皮的靠左，蝦皮的靠右
                        if (isShopeeA && !isShopeeB) return 1;  // A是蝦皮，B不是 → A靠右
                        if (!isShopeeA && isShopeeB) return -1; // A不是，B是蝦皮 → B靠右
                        
                        // 同類型內按日期排序
                        const dateA = a.order_date || a.created_at || '';
                        const dateB = b.order_date || b.created_at || '';
                        return dateA.localeCompare(dateB);
                      } else {
                        // 未勾選時，按日期排序（最舊在左）
                        const dateA = a.order_date || a.created_at || '';
                        const dateB = b.order_date || b.created_at || '';
                        return dateA.localeCompare(dateB);
                      }
                    });
                    
                    // 計算該產品在各訂單中的數量
                    const quantities = selectedOrders.map(order => {
                      const items = parseOrderItems(order.items);
                      const item = items.find(i => (i.product_name || i.name) === productName);
                      return item ? (Number(item.quantity) || 0) : 0;
                    });
                    
                    // 計算加總
                    const total = quantities.reduce((sum, qty) => sum + qty, 0);
                    
                    // ✅ 計算製造數量（訂單只作參考，製造量由系統建議 + 人員手動調整）
                    // 系統建議：訂單總需求 - 可用庫存（如果可用庫存不足）
                    const availableStock = availMap.get(productName)?.available || 0; // 真實庫存
                    const baseManufacturingQty = Math.max(total - availableStock, 0);
                    // 最終製造量 = 基礎建議 + 手動調整
                    const manufacturingQty = baseManufacturingQty + (manualAdjustments[productName] || 0);
                    
                    return (
                      <tr key={product.id}>
                        {quantities.map((qty, idx) => {
                          const order = selectedOrders[idx];
                          // ✅ 如果是蝦皮訂單，背景色改為橘色（與表頭一致）
                          const isShopee = order && order.source && (order.source.includes('蝦皮') || order.source.toLowerCase().includes('shopee'));
                          return (
                            <td 
                              key={idx} 
                              style={{ 
                                padding: "8px", 
                                textAlign: "center", 
                                border: "1px solid #e5e7eb",
                                backgroundColor: isShopee ? "#ffe4b5" : "transparent", // 蝦皮訂單：淺橘色背景
                                color: isShopee ? "#d97706" : "#000" // 蝦皮訂單：深橘色文字
                              }}
                            >
                              {qty}
                            </td>
                          );
                        })}
                        {/* ✅ 訂單總數量 */}
                        <td style={{ padding: "8px", textAlign: "center", border: "1px solid #e5e7eb", fontWeight: 600, backgroundColor: "#f3f4f6" }}>
                          {total}
                        </td>
                        {/* ✅ 產品名稱（移到訂單總數量之後） */}
                        <td style={{ padding: "8px", border: "1px solid #e5e7eb", fontWeight: 500 }}>
                          {productName}
                        </td>
                        {/* ✅ 製造欄位（可編輯，帶 +/- 按鈕） */}
                        <td style={{ padding: "4px", textAlign: "center", border: "1px solid #e5e7eb", backgroundColor: "#e0f2fe" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                            <button
                              onClick={() => {
                                const currentQty = Math.max(manufacturingQty, 0);
                                const newManufacturingQty = Math.max(currentQty - 1, 0);
                                const adjustment = newManufacturingQty - baseManufacturingQty;
                                setManualAdjustments(prev => ({
                                  ...prev,
                                  [productName]: adjustment
                                }));
                              }}
                              style={{
                                background: "#dc3545",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                width: "28px",
                                height: "28px",
                                cursor: "pointer",
                                fontSize: "16px",
                                fontWeight: "bold",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0
                              }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={Math.max(manufacturingQty, 0)}
                              onChange={(e) => {
                                const newManufacturingQty = Math.max(parseInt(e.target.value) || 0, 0);
                                // 計算調整量 = 新製造量 - 基礎製造量
                                const adjustment = newManufacturingQty - baseManufacturingQty;
                                setManualAdjustments(prev => ({
                                  ...prev,
                                  [productName]: adjustment
                                }));
                              }}
                              style={{
                                width: "60px",
                                padding: "4px",
                                textAlign: "center",
                                border: "1px solid #0284c7",
                                borderRadius: 4,
                                fontSize: 14,
                                fontWeight: 600
                              }}
                            />
                            <button
                              onClick={() => {
                                const currentQty = Math.max(manufacturingQty, 0);
                                const newManufacturingQty = currentQty + 1;
                                const adjustment = newManufacturingQty - baseManufacturingQty;
                                setManualAdjustments(prev => ({
                                  ...prev,
                                  [productName]: adjustment
                                }));
                              }}
                              style={{
                                background: "#28a745",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                width: "28px",
                                height: "28px",
                                cursor: "pointer",
                                fontSize: "16px",
                                fontWeight: "bold",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: 0
                              }}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        {/* ✅ 可用庫存欄位（只顯示）：格式為 "可用庫存 / 製造數量" */}
                        <td style={{ padding: "8px", textAlign: "center", border: "1px solid #e5e7eb", backgroundColor: "#ecfdf5", fontWeight: 600, color: availableStock > 0 ? "#059669" : "#dc2626" }}>
                          {availableStock} / {Math.max(manufacturingQty, 0)}
                        </td>
                      </tr>
                    );
                  })}
                  {/* 加總列（各客戶所有產品加總） */}
                  <tr style={{ backgroundColor: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
                    {(() => {
                      const selectedOrders = allUnScheduledOrders.filter(o => selectedOrderIds.includes(o.id));
                      
                      // ✅ 排序邏輯：如果勾選「蝦皮優先」，蝦皮訂單靠右；否則按日期排序
                      selectedOrders.sort((a, b) => {
                        if (shopeePriority) {
                          const isShopeeA = a.source && (a.source.includes('蝦皮') || a.source.toLowerCase().includes('shopee'));
                          const isShopeeB = b.source && (b.source.includes('蝦皮') || b.source.toLowerCase().includes('shopee'));
                          
                          // 蝦皮訂單靠右：非蝦皮的靠左，蝦皮的靠右
                          if (isShopeeA && !isShopeeB) return 1;  // A是蝦皮，B不是 → A靠右
                          if (!isShopeeA && isShopeeB) return -1; // A不是，B是蝦皮 → B靠右
                          
                          // 同類型內按日期排序
                          const dateA = a.order_date || a.created_at || '';
                          const dateB = b.order_date || b.created_at || '';
                          return dateA.localeCompare(dateB);
                        } else {
                          // 未勾選時，按日期排序（最舊在左）
                          const dateA = a.order_date || a.created_at || '';
                          const dateB = b.order_date || b.created_at || '';
                          return dateA.localeCompare(dateB);
                        }
                      });
                      
                      return selectedOrders.map(order => {
                        const items = parseOrderItems(order.items);
                        const orderTotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
                        // ✅ 如果是蝦皮訂單，背景色改為橘色（與表頭一致）
                        const isShopee = order.source && (order.source.includes('蝦皮') || order.source.toLowerCase().includes('shopee'));
                        return (
                          <td 
                            key={order.id} 
                            style={{ 
                              padding: "8px", 
                              textAlign: "center", 
                              fontWeight: 700, 
                              border: "1px solid #e5e7eb",
                              backgroundColor: isShopee ? "#ffa500" : "#f9fafb", // 蝦皮訂單：橘色背景
                              color: isShopee ? "#fff" : "#000" // 蝦皮訂單：白色文字
                            }}
                          >
                            {orderTotal}
                          </td>
                        );
                      });
                    })()}
                    {/* ✅ 訂單總數量 */}
                    <td style={{ padding: "8px", textAlign: "center", fontWeight: 700, border: "1px solid #e5e7eb", backgroundColor: "#f3f4f6" }}>
                      {(() => {
                        const selectedOrders = allUnScheduledOrders.filter(o => selectedOrderIds.includes(o.id));
                        let grandTotal = 0;
                        selectedOrders.forEach(order => {
                          const items = parseOrderItems(order.items);
                          items.forEach(item => {
                            grandTotal += Number(item.quantity) || 0;
                          });
                        });
                        return grandTotal;
                      })()}
                    </td>
                    {/* ✅ 加總（對應產品名稱列） */}
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: 700, border: "1px solid #e5e7eb" }}>
                      加總
                    </td>
                    {/* ✅ 製造總計欄位 */}
                    <td style={{ padding: "8px", textAlign: "center", fontWeight: 700, border: "1px solid #e5e7eb", backgroundColor: "#bae6fd" }}>
                      {(() => {
                        let totalManufacturing = 0;
                        allProducts.forEach(product => {
                          const productName = product.name;
                          const selectedOrders = allUnScheduledOrders.filter(o => selectedOrderIds.includes(o.id));
                          let productTotal = 0;
                          selectedOrders.forEach(order => {
                            const items = parseOrderItems(order.items);
                            const item = items.find(i => (i.product_name || i.name) === productName);
                            productTotal += item ? (Number(item.quantity) || 0) : 0;
                          });
                          const availableStock = availMap.get(productName)?.available || 0;
                          const baseManufacturingQty = Math.max(productTotal - availableStock, 0);
                          const manufacturingQty = baseManufacturingQty + (manualAdjustments[productName] || 0);
                          totalManufacturing += Math.max(manufacturingQty, 0);
                        });
                        return totalManufacturing;
                      })()}
                    </td>
                    {/* ✅ 可用庫存總計欄位（顯示為 -） */}
                    <td style={{ padding: "8px", textAlign: "center", fontWeight: 700, border: "1px solid #e5e7eb", backgroundColor: "#d1fae5" }}>
                      -
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 排程設定與已排程訂單 - 左右並排 */}
      <div style={{ 
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 24,
        marginTop: 24
      }}>
        {/* 左側：排程設定 */}
        <div style={{ 
          background: "#fff", 
          borderRadius: 12, 
          padding: 20, 
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>🛠 排程設定</h3>
            <button
              onClick={deleteAllHistorySchedules}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
              title="刪除所有歷史排程"
            >
              🗑️ 刪除所有歷史排程
            </button>
            <button
              onClick={deleteDaySchedule}
              disabled={!selectedProductionDate}
              style={{
                padding: "10px 14px",
                background: selectedProductionDate ? "#dc2626" : "#e5e7eb",
                color: selectedProductionDate ? "#fff" : "#9ca3af",
                border: "none",
                borderRadius: 8,
                cursor: selectedProductionDate ? "pointer" : "not-allowed",
                fontWeight: 700,
                fontSize: 12
              }}
            >
              🗑️ 刪除當日生產計畫
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#555", marginBottom: 4 }}>
                製造日期
              </label>
              <input 
                type="date" 
                value={selectedProductionDate}
                onChange={(e) => setSelectedProductionDate(e.target.value)}
                style={{
                  width: "100%", 
                  padding: 8, 
                  borderRadius: 8, 
                  border: "1px solid #e5e7eb" 
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, color: "#555", marginBottom: 4 }}>
                出貨日期
              </label>
              <input 
                type="date" 
                value={selectedDeliveryDate}
                onChange={(e) => setSelectedDeliveryDate(e.target.value)}
                style={{
                  width: "100%", 
                  padding: 8, 
                  borderRadius: 8, 
                  border: "1px solid #e5e7eb" 
                }}
              />
            </div>
          </div>
          
          <button 
            onClick={submitScheduling}
            style={{ 
              width: "100%",
              padding: "12px 20px",
              background: "#16a34a",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 14
            }}
          >
            ✅ 確認排程（{selectedOrderIds.length} 筆）
          </button>
        </div>

        {/* 右側：已排程訂單 */}
        <div style={{ 
          background: "#fff", 
          borderRadius: 12, 
          padding: 20, 
          boxShadow: "0 2px 10px rgba(0,0,0,0.06)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>
              生產計畫
            </h3>
            <button
              onClick={deleteAllHistorySchedules}
              style={{
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
              title="刪除所有歷史排程"
            >
              🗑️ 刪除所有
            </button>
          </div>
          <input
            type="date"
            value={selectedProductionDate}
            onChange={(e) => setSelectedProductionDate(e.target.value)}
            style={{ 
              width: "100%", 
              padding: 8, 
              borderRadius: 8, 
              border: "1px solid #e5e7eb",
              marginBottom: 16
            }}
          />
          <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
            production_date = {selectedProductionDate || "未選擇"}
          </div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: "400px", overflowY: "auto" }}>
            {scheduledOrders.length === 0 ? (
              <li style={{ color: "#777", textAlign: "center", padding: 20 }}>
                此生產日目前沒有生產計畫
              </li>
            ) : (
              scheduledOrders.map((plan) => {
                return (
                  <li 
                    key={plan.product_name}
                    style={{
                      padding: 12,
                      marginBottom: 8,
                      borderRadius: 8,
                      background: "#f8f9fa",
                      border: "1px solid #e5e7eb"
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      {plan.product_name || plan.name}
                    </div>
                    <div style={{ fontSize: 14, color: "#059669", fontWeight: 600 }}>
                      製造數量：{plan.scheduled_quantity || plan.quantity || 0}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

