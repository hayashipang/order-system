import React from 'react';
import { useKitchenDashboard } from './hooks/useKitchenDashboard';
import { getWeekdayName, getQuantityColor, isFullyCompleted } from './utils/kitchenDashboardUtils';
import InventoryOverview from '../InventoryOverview';

const KitchenDashboard = () => {
  const {
    // 狀態
    productionList,
    walkinOrders,
    selectedDate,
    setSelectedDate,
    scheduledDates,
    loading,
    error,
    updatingStatus,
    showWeeklyView,
    setShowWeeklyView,
    weeklyData,
    lastRefresh,
    inventoryData,
    showWeeklyDetailModal,
    setShowWeeklyDetailModal,
    weeklyDetailData,
    activeTab,
    setActiveTab,
    selectedOrders,
    showStatsModal,
    setShowStatsModal,
    // 方法
    handleRefresh,
    handleDateChange,
    toggleOrderSelection,
    getSelectedOrdersStats,
    clearSelection,
    toggleWeeklyView,
    handleShowWeeklyDetail,
    handleStatusUpdate,
    // 計算函數
    getTotalQuantity,
    getTotalPendingQuantity,
    getTotalCompletedQuantity,
    getWalkinTotalQuantity,
    getInventorySuggestion,
  } = useKitchenDashboard();

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0 }}>廚房工作台</h2>
          <button 
            onClick={handleRefresh}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            title={`最後更新: ${lastRefresh.toLocaleTimeString()}`}
          >
            🔄 刷新數據
          </button>
        </div>
        
        {/* 標籤切換器 */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '20px',
          borderBottom: '2px solid #e9ecef'
        }}>
          <button
            onClick={() => setActiveTab('preorder')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'preorder' ? '#3498db' : '#f8f9fa',
              color: activeTab === 'preorder' ? 'white' : '#6c757d',
              border: 'none',
              borderBottom: activeTab === 'preorder' ? '3px solid #2980b9' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              borderRadius: '8px 8px 0 0',
              transition: 'all 0.3s ease'
            }}
          >
            📦 預訂訂單
          </button>
          <button
            onClick={() => setActiveTab('walkin')}
            style={{
              padding: '12px 24px',
              backgroundColor: activeTab === 'walkin' ? '#e74c3c' : '#f8f9fa',
              color: activeTab === 'walkin' ? 'white' : '#6c757d',
              border: 'none',
              borderBottom: activeTab === 'walkin' ? '3px solid #c0392b' : '3px solid transparent',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              borderRadius: '8px 8px 0 0',
              transition: 'all 0.3s ease'
            }}
          >
            🏪 現場訂單
          </button>
        </div>
        
        
        {/* 當日製作清單 - 廚房人員不需要選擇日期 */}
        {activeTab === 'preorder' && (
        <div style={{
          background: '#e8f4fd',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '2px solid #3498db'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#2c3e50'
          }}>
            <span>📅 製作清單</span>
            <span style={{ color: '#3498db' }}>{selectedDate}</span>
            {scheduledDates.length > 1 && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
                {scheduledDates.map(date => (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: selectedDate === date ? '#3498db' : '#95a5a6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    {new Date(date).getDate()}日
                  </button>
                ))}
              </div>
            )}
            <button
              className={`date-button ${showWeeklyView ? 'active' : ''}`}
              onClick={toggleWeeklyView}
              style={{
                padding: '8px 16px',
                backgroundColor: showWeeklyView ? '#3498db' : '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                marginLeft: scheduledDates.length <= 1 ? 'auto' : '10px'
              }}
            >
              一週
            </button>
          </div>
        </div>
        )}

        {/* 庫存狀態概覽 - 共用組件 */}
        <InventoryOverview 
          inventoryData={inventoryData} 
          scheduledProduction={{}} // 製作訂單頁面沒有排程製作數量
        />

        {error && <div className="error">{error}</div>}

        {/* 廚房製作清單內容 */}
        {activeTab === 'preorder' && showWeeklyView && (
          <div style={{
            marginBottom: '20px',
            padding: '20px',
            background: '#f8f9fa',
            borderRadius: '12px',
            border: '2px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>未來一週製作概覽</h3>
              <button
                onClick={handleShowWeeklyDetail}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#17a2b8',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                📊 查看詳情
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '10px',
              maxWidth: '600px'
            }}>
              {weeklyData.map((dayData, index) => (
                <div
                  key={index}
                  onClick={() => {
                    handleDateChange(dayData.date);
                    setShowWeeklyView(false);
                  }}
                  style={{
                    background: getQuantityColor(dayData.total_quantity),
                    color: dayData.total_quantity === 0 ? '#6c757d' : 'white',
                    padding: '15px 10px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    border: selectedDate === dayData.date ? '3px solid #3498db' : '2px solid transparent'
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
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '5px' }}>
                    {dayData.total_quantity}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    {getWeekdayName(dayData.date)}
                  </div>
                  <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
                    {dayData.date.split('-')[1]}/{dayData.date.split('-')[2]}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#e9ecef', borderRadius: '3px' }}></div>
                  <span>無製作</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#28a745', borderRadius: '3px' }}></div>
                  <span>1-5 瓶</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#ffc107', borderRadius: '3px' }}></div>
                  <span>6-15 瓶</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#dc3545', borderRadius: '3px' }}></div>
                  <span>16+ 瓶</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">載入中...</div>
        ) : (
          <>
            {/* 預訂訂單內容 */}
            {activeTab === 'preorder' && productionList.length > 0 && (
              <>
                <div style={{ marginBottom: '20px', padding: '15px', background: '#e8f4fd', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ fontSize: '18px' }}>總計: {getTotalQuantity()} 瓶</strong>
                    </div>
                    <div style={{ display: 'flex', gap: '15px', fontSize: '14px' }}>
                      <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                        待製作: {getTotalPendingQuantity()} 瓶
                      </span>
                      <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                        已完成: {getTotalCompletedQuantity()} 瓶
                      </span>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
                    {new Date(selectedDate).toLocaleDateString('zh-TW', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'long',
                      timeZone: 'Asia/Taipei'
                    })}
                  </div>
                </div>
                
                <div className="production-list">
                  {productionList.map((item, index) => (
                    <div 
                      key={index} 
                      className="production-item"
                      style={{
                        border: isFullyCompleted(item) ? '3px solid #28a745' : '1px solid #dee2e6',
                        backgroundColor: isFullyCompleted(item) ? '#f8fff9' : 'white',
                        boxShadow: isFullyCompleted(item) ? '0 4px 8px rgba(40, 167, 69, 0.2)' : '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div className="product-info">
                        <div className="product-name">
                          {isFullyCompleted(item) && (
                            <span style={{ color: '#28a745', marginRight: '8px', fontSize: '18px' }}>
                              ✅
                            </span>
                          )}
                          {item.is_gift ? (
                            <span style={{ color: '#e67e22', fontWeight: 'bold' }}>
                              🎁 {item.product_name} (贈送)
                            </span>
                          ) : (
                            item.product_name
                          )}
                        </div>
                        <div className="quantity-display">
                          <span className="total-quantity">{item.total_quantity} 瓶</span>
                        </div>
                      </div>
                      <div className="status-columns">
                        <div className="status-column">
                          <div className="status-label">待製作</div>
                          <div 
                            className="status-value"
                            style={{
                              backgroundColor: item.pending_quantity > 0 ? '#dc3545' : '#e9ecef',
                              color: item.pending_quantity > 0 ? 'white' : '#6c757d',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              textAlign: 'center',
                              minWidth: '80px',
                              border: item.pending_quantity > 0 ? '2px solid #c82333' : 'none'
                            }}
                          >
                            {item.pending_quantity}
                          </div>
                        </div>
                        <div className="status-column">
                          <div className="status-label">已完成</div>
                          <div 
                            className="status-value"
                            style={{
                              backgroundColor: item.completed_quantity > 0 ? '#28a745' : '#e9ecef',
                              color: item.completed_quantity > 0 ? 'white' : '#6c757d',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '16px',
                              fontWeight: 'bold',
                              textAlign: 'center',
                              minWidth: '80px',
                              border: item.completed_quantity > 0 ? '2px solid #1e7e34' : 'none'
                            }}
                          >
                            {item.completed_quantity}
                          </div>
                        </div>
                        <div className="action-column">
                          {!isFullyCompleted(item) && (
                            <button
                              className="complete-button"
                              onClick={() => handleStatusUpdate(item.product_name, 'completed')}
                              disabled={updatingStatus[item.product_name]}
                              style={{
                                padding: '10px 20px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: updatingStatus[item.product_name] ? 'not-allowed' : 'pointer',
                                opacity: updatingStatus[item.product_name] ? 0.6 : 1,
                                fontWeight: 'bold',
                                fontSize: '14px'
                              }}
                            >
                              {updatingStatus[item.product_name] ? '更新中...' : '標記完成'}
                            </button>
                          )}
                          {isFullyCompleted(item) && (
                            <button
                              className="reset-button"
                              onClick={() => handleStatusUpdate(item.product_name, 'pending')}
                              disabled={updatingStatus[item.product_name]}
                              style={{
                                padding: '10px 20px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: updatingStatus[item.product_name] ? 'not-allowed' : 'pointer',
                                opacity: updatingStatus[item.product_name] ? 0.6 : 1,
                                fontWeight: 'bold',
                                fontSize: '14px'
                              }}
                            >
                              {updatingStatus[item.product_name] ? '更新中...' : '重新製作'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 現場訂單內容 */}
            {activeTab === 'walkin' && walkinOrders.length > 0 && (
              <>
                <div style={{ marginBottom: '20px', padding: '15px', background: '#ffeaa7', borderRadius: '8px', border: '2px solid #fdcb6e' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div>
                      <strong style={{ fontSize: '18px', color: '#d63031' }}>🚨 現場訂單總計: {getWalkinTotalQuantity()} 瓶</strong>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', color: '#666', fontSize: '14px' }}>
                    {new Date().toLocaleDateString('zh-TW', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      weekday: 'long',
                      timeZone: 'Asia/Taipei'
                    })} - 即時更新
                  </div>
                </div>
                
                {/* 選取控制按鈕 */}
                {selectedOrders.length > 0 && (
                  <div style={{ 
                    marginBottom: '20px', 
                    padding: '15px', 
                    background: '#e3f2fd', 
                    borderRadius: '8px', 
                    border: '2px solid #2196f3',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <strong style={{ fontSize: '16px', color: '#1976d2' }}>
                        已選取 {selectedOrders.length} 張訂單
                      </strong>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setShowStatsModal(true)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#4caf50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        統計選取訂單
                      </button>
                      <button
                        onClick={clearSelection}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        清除選取
                      </button>
                    </div>
                  </div>
                )}

                <div className="walkin-orders-grid">
                  {walkinOrders.map((order) => {
                    const isSelected = selectedOrders.includes(order.id);
                    return (
                      <div 
                        key={order.id} 
                        className="walkin-order-card"
                        style={{
                          border: isSelected ? '3px solid #4caf50' : '2px solid #e9ecef',
                          backgroundColor: isSelected ? '#f1f8e9' : '#f8f9fa',
                          cursor: 'pointer',
                          position: 'relative'
                        }}
                        onClick={() => toggleOrderSelection(order.id)}
                      >
                        {/* 選取指示器 */}
                        {isSelected && (
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: '#4caf50',
                            color: 'white',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 'bold'
                          }}>
                            ✓
                          </div>
                        )}
                        
                        <div className="order-header">
                          <div className="order-number">訂單 #{order.id}</div>
                          <div className="order-time">
                            {order.order_time ? 
                              new Date(order.order_time).toLocaleTimeString('zh-TW', {
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: 'Asia/Taipei'
                              }) + ' 下單' : 
                              '時間未知'
                            }
                          </div>
                        </div>
                        <div className="order-items">
                          {order.items.map((item, index) => (
                            <div key={item.item_id || index} className="order-item">
                              <div className="item-name">
                                {item.is_gift ? (
                                  <span style={{ color: '#e67e22', fontWeight: 'bold' }}>
                                    🎁 {item.product_name}
                                  </span>
                                ) : (
                                  item.product_name
                                )}
                              </div>
                              <div className="item-quantity">{item.quantity} 瓶</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}


            {/* 無訂單時的顯示 */}
            {((activeTab === 'preorder' && productionList.length === 0) || 
              (activeTab === 'walkin' && walkinOrders.length === 0)) && (
              <div className="loading">
                {activeTab === 'preorder' ? '當日無製作項目' : '目前無現場訂單'}
              </div>
            )}
          </>
        )}

      </div>

      <div className="card">
        <h2>使用說明</h2>
        <div style={{ lineHeight: '1.6', color: '#666' }}>
          <p><strong>📦 預訂訂單：</strong>顯示當日需要製作的所有產品總數量，廚房員工只需專注於製作數量</p>
          <p><strong>🏪 現場訂單：</strong>顯示即時現場訂單，支援多選統計功能</p>
          <p>• 可以切換日期查看不同日期的製作需求</p>
          <p>• 完成製作後，點擊「標記完成」按鈕更新產品狀態</p>
          <p>• 狀態會自動同步到「客戶訂單」頁面</p>
        </div>
      </div>

      {/* 週概覽詳細視窗 */}
      {showWeeklyDetailModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#2c3e50' }}>📊 一週製作明細</h2>
              <button
                onClick={() => setShowWeeklyDetailModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6c757d'
                }}
              >
                ✕
              </button>
            </div>

            {weeklyDetailData.length > 0 ? (
              <>
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '8px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
                    總計：{weeklyDetailData.reduce((sum, item) => sum + item.total_quantity, 0)} 瓶
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    一週期間：{new Date(selectedDate).toLocaleDateString('zh-TW', {
                      timeZone: 'Asia/Taipei'
                    })} ~ {new Date(new Date(selectedDate).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('zh-TW', {
                      timeZone: 'Asia/Taipei'
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>產品明細</h3>
                  {weeklyDetailData.map((product, index) => {
                    const percentage = ((product.total_quantity / weeklyDetailData.reduce((sum, item) => sum + item.total_quantity, 0)) * 100).toFixed(1);
                    const suggestion = getInventorySuggestion(product.product_name, product.total_quantity);
                    
                    return (
                      <div
                        key={index}
                        style={{
                          marginBottom: '15px',
                          padding: '15px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px',
                          border: '1px solid #dee2e6'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#2c3e50' }}>
                            {product.product_name}
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3498db' }}>
                            {product.total_quantity} 瓶 ({percentage}%)
                          </div>
                        </div>
                        
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ 
                            width: '100%', 
                            height: '8px', 
                            backgroundColor: '#e9ecef', 
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${percentage}%`,
                              height: '100%',
                              backgroundColor: '#3498db',
                              transition: 'width 0.3s ease'
                            }}></div>
                          </div>
                        </div>

                        {suggestion && (
                          <div style={{
                            padding: '8px 12px',
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '6px',
                            fontSize: '14px',
                            color: '#495057',
                            fontWeight: 'normal'
                          }}>
                            📦 {suggestion.message}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>庫存資訊說明</h3>
                  <div style={{ fontSize: '14px', color: '#666' }}>
                    • 顯示目前庫存數量和一週需求量<br/>
                    • 廚房人員可根據實際情況自行判斷是否需要增加庫存<br/>
                    • 建議在需求量大的產品上多做準備
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                載入詳細數據中...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 統計視窗模態框 */}
      {showStatsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e9ecef'
            }}>
              <h2 style={{ 
                margin: 0, 
                color: '#2c3e50',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                選取訂單產品統計
              </h2>
              <button
                onClick={() => setShowStatsModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#7f8c8d',
                  padding: '5px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{
                padding: '10px 15px',
                backgroundColor: '#e3f2fd',
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                <strong style={{ color: '#1976d2' }}>
                  已選取 {selectedOrders.length} 張訂單
                </strong>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                margin: '0 0 15px 0', 
                color: '#2c3e50',
                fontSize: '18px'
              }}>
                產品統計：
              </h3>
              {getSelectedOrdersStats().map((stat, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 15px',
                  marginBottom: '8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    flex: 1
                  }}>
                    {stat.product_name}
                  </span>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#3498db',
                    backgroundColor: '#e3f2fd',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    minWidth: '60px',
                    textAlign: 'center',
                    margin: '0 15px'
                  }}>
                    {stat.quantity} 瓶
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: stat.is_low_stock ? '#e74c3c' : '#666',
                    minWidth: '100px',
                    textAlign: 'right'
                  }}>
                    庫存: {stat.current_stock} 瓶{stat.is_low_stock ? ' ⚠️' : ''}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '15px',
              paddingTop: '20px',
              borderTop: '2px solid #e9ecef'
            }}>
              <button
                onClick={() => setShowStatsModal(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                關閉
              </button>
              <button
                onClick={() => {
                  setShowStatsModal(false);
                  clearSelection();
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                關閉並清除選取
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default KitchenDashboard;

