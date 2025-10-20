import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../config';

// 確保使用本地API URL
const getApiUrl = () => {
  // 在開發環境或本地測試時強制使用本地API
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }
  return config.apiUrl;
};

const SmartScheduling = () => {
  const [schedulingConfig, setSchedulingConfig] = useState({
    daily_capacity: 40,
    staff_count: 1,
    minutes_per_bottle: 1.5,
    min_stock: 10,
    working_hours: 8,
    break_time: 60
  });
  
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('config');

  // 載入排程配置
  const loadSchedulingConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${getApiUrl()}/api/scheduling/config`);
      setSchedulingConfig(response.data);
    } catch (err) {
      console.error('載入排程配置失敗:', err);
      setError('載入排程配置失敗');
    } finally {
      setLoading(false);
    }
  };

  // 更新排程配置
  const updateSchedulingConfig = async () => {
    try {
      setLoading(true);
      setError('');
      await axios.put(`${getApiUrl()}/api/scheduling/config`, schedulingConfig);
      setSuccess('排程配置更新成功！');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('更新排程配置失敗:', err);
      setError(err.response?.data?.error || '更新排程配置失敗');
    } finally {
      setLoading(false);
    }
  };

  // 生成智能排程
  const generateSchedule = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${getApiUrl()}/api/scheduling/orders`);
      setScheduleData(response.data);
      setActiveTab('schedule');
    } catch (err) {
      console.error('生成排程失敗:', err);
      setError('生成排程失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理配置變更
  const handleConfigChange = (field, value) => {
    // 確保數值不為NaN
    const safeValue = isNaN(value) ? 0 : value;
    setSchedulingConfig(prev => ({
      ...prev,
      [field]: safeValue
    }));
  };

  useEffect(() => {
    loadSchedulingConfig();
  }, []);

  return (
    <div className="smart-scheduling">
      <div className="scheduling-header">
        <h2>🏭 智能排程系統</h2>
        <p>優化您的生產計劃，最大化產能效率</p>
      </div>

      {/* 錯誤和成功訊息 */}
      {error && (
        <div className="alert alert-error">
          <span>❌ {error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      
      {success && (
        <div className="alert alert-success">
          <span>✅ {success}</span>
          <button onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* 標籤頁 */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          ⚙️ 排程配置
        </button>
        <button 
          className={`tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          📋 生產計劃
        </button>
        <button 
          className={`tab ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          📊 分析報告
        </button>
        <button 
          className={`tab ${activeTab === 'multi-day' ? 'active' : ''}`}
          onClick={() => setActiveTab('multi-day')}
        >
          📅 多日排程
        </button>
        <button 
          className={`tab ${activeTab === 'deferred' ? 'active' : ''}`}
          onClick={() => setActiveTab('deferred')}
        >
          ⏰ 遞延訂單
        </button>
      </div>

      {/* 排程配置標籤頁 */}
      {activeTab === 'config' && (
        <div className="config-panel">
          <div className="config-section">
            <h3>🏭 產能設定</h3>
            <div className="config-grid">
              <div className="config-item">
                <label>日產能 (瓶)</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={schedulingConfig.daily_capacity || 40}
                  onChange={(e) => handleConfigChange('daily_capacity', parseInt(e.target.value) || 40)}
                />
                <small>每日最大生產瓶數</small>
              </div>
              
              <div className="config-item">
                <label>人力數量 (人)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={schedulingConfig.staff_count || 1}
                  onChange={(e) => handleConfigChange('staff_count', parseInt(e.target.value) || 1)}
                />
                <small>參與生產的人員數量</small>
              </div>
              
              <div className="config-item">
                <label>每瓶製作時間 (分鐘)</label>
                <input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={schedulingConfig.minutes_per_bottle || 1.5}
                  onChange={(e) => handleConfigChange('minutes_per_bottle', parseFloat(e.target.value) || 1.5)}
                />
                <small>製作一瓶所需的時間</small>
              </div>
            </div>
          </div>

          <div className="config-section">
            <h3>📦 庫存設定</h3>
            <div className="config-grid">
              <div className="config-item">
                <label>最低庫存 (瓶)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={schedulingConfig.min_stock || 10}
                  onChange={(e) => handleConfigChange('min_stock', parseInt(e.target.value) || 10)}
                />
                <small>每種產品的最低安全庫存</small>
              </div>
              
              <div className="config-item">
                <label>工作時數 (小時)</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={schedulingConfig.working_hours || 8}
                  onChange={(e) => handleConfigChange('working_hours', parseInt(e.target.value) || 8)}
                />
                <small>每日工作時間</small>
              </div>
              
              <div className="config-item">
                <label>休息時間 (分鐘)</label>
                <input
                  type="number"
                  min="0"
                  max="480"
                  value={schedulingConfig.break_time || 60}
                  onChange={(e) => handleConfigChange('break_time', parseInt(e.target.value) || 60)}
                />
                <small>每日休息時間</small>
              </div>
            </div>
          </div>

          <div className="config-actions">
            <button 
              className="btn btn-primary"
              onClick={updateSchedulingConfig}
              disabled={loading}
            >
              {loading ? '更新中...' : '💾 保存配置'}
            </button>
            <button 
              className="btn btn-success"
              onClick={generateSchedule}
              disabled={loading}
            >
              {loading ? '生成中...' : '🚀 生成排程'}
            </button>
          </div>
        </div>
      )}

      {/* 生產計劃標籤頁 */}
      {activeTab === 'schedule' && scheduleData && (
        <div className="schedule-panel">
          <div className="schedule-summary">
            <h3>📊 今日生產計劃</h3>
            <div className="summary-cards">
              <div className="summary-card">
                <div className="card-number">{scheduleData.summary.total_bottles}</div>
                <div className="card-label">計劃生產 (瓶)</div>
              </div>
              <div className="summary-card">
                <div className="card-number">{scheduleData.summary.efficiency}</div>
                <div className="card-label">產能效率</div>
              </div>
              <div className="summary-card">
                <div className="card-number">{scheduleData.summary.estimated_time}</div>
                <div className="card-label">預估時間</div>
              </div>
              <div className="summary-card">
                <div className="card-number">{scheduleData.summary.remaining_capacity}</div>
                <div className="card-label">剩餘產能</div>
              </div>
            </div>
          </div>

          <div className="production-plan">
            <h3>📋 生產計劃詳情</h3>
            <div className="plan-list">
              {scheduleData.orders.map((item, index) => (
                <div key={index} className="plan-item">
                  <div className="plan-info">
                    <h4>{item.product_name}</h4>
                    <p>{item.reason}</p>
                  </div>
                  <div className="plan-stats">
                    <div className="quantity">{item.quantity}瓶</div>
                    <div className="time">{item.estimated_time}</div>
                    <div className="priority">優先級: {item.priority}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {scheduleData.recommendations && scheduleData.recommendations.length > 0 && (
            <div className="recommendations">
              <h3>💡 智能建議</h3>
              <ul>
                {scheduleData.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 分析報告標籤頁 */}
      {activeTab === 'analysis' && scheduleData && (
        <div className="analysis-panel">
          <div className="inventory-analysis">
            <h3>📦 庫存分析</h3>
            <div className="analysis-table">
              <table>
                <thead>
                  <tr>
                    <th>產品名稱</th>
                    <th>當前庫存</th>
                    <th>最低庫存</th>
                    <th>庫存缺口</th>
                    <th>緊急程度</th>
                    <th>狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleData.analysis.inventory_analysis.map((item, index) => (
                    <tr key={index} className={item.status}>
                      <td>{item.product_name}</td>
                      <td>{item.current_stock}瓶</td>
                      <td>{item.min_stock}瓶</td>
                      <td>{item.stock_deficit}瓶</td>
                      <td>{item.urgency_score.toFixed(1)}</td>
                      <td>
                        <span className={`status-badge ${item.status}`}>
                          {item.status === 'urgent' ? '🚨 緊急' : 
                           item.status === 'warning' ? '⚠️ 警告' : '✅ 正常'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sales-trend">
            <h3>📈 銷售趨勢</h3>
            <div className="trend-table">
              <table>
                <thead>
                  <tr>
                    <th>產品名稱</th>
                    <th>週銷售量</th>
                    <th>日均銷售</th>
                    <th>需求等級</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleData.analysis.sales_trend.map((item, index) => (
                    <tr key={index}>
                      <td>{item.product_name}</td>
                      <td>{item.weekly_sales}瓶</td>
                      <td>{item.daily_average}瓶</td>
                      <td>
                        <span className={`demand-level ${item.weekly_sales > 10 ? 'high' : item.weekly_sales > 5 ? 'medium' : 'low'}`}>
                          {item.weekly_sales > 10 ? '🔥 高需求' : 
                           item.weekly_sales > 5 ? '📈 中需求' : '📉 低需求'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 多日排程標籤頁 */}
      {activeTab === 'multi-day' && scheduleData && scheduleData.multi_day_schedule && (
        <div className="multi-day-panel">
          <h3>📅 多日生產排程</h3>
          <div className="multi-day-grid">
            {scheduleData.multi_day_schedule.map((dayPlan, index) => (
              <div key={index} className="day-plan-card">
                <div className="day-header">
                  <h4>{dayPlan.date}</h4>
                  <div className="day-summary">
                    <span className="bottles">{dayPlan.planned_production.reduce((sum, item) => sum + item.quantity, 0)}瓶</span>
                    <span className="capacity">剩餘產能: {dayPlan.remaining_capacity}瓶</span>
                  </div>
                </div>
                
                {dayPlan.planned_production.length > 0 ? (
                  <div className="production-list">
                    {dayPlan.planned_production.map((item, itemIndex) => (
                      <div key={itemIndex} className="production-item">
                        <div className="item-header">
                          <span className="product-name">{item.product_name}</span>
                          <span className="quantity">{item.quantity}瓶</span>
                        </div>
                        <div className="item-details">
                          <small>{item.reason}</small>
                          <small>⏱️ {item.estimated_time}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-production">
                    <p>當日無生產計劃</p>
                  </div>
                )}
                
                {dayPlan.deferred_orders && dayPlan.deferred_orders.length > 0 && (
                  <div className="deferred-orders">
                    <h5>⏰ 遞延訂單 ({dayPlan.deferred_orders.length}筆)</h5>
                    {dayPlan.deferred_orders.map((order, orderIndex) => (
                      <div key={orderIndex} className="deferred-item">
                        <span>{order.product_name} - {order.quantity}瓶</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 遞延訂單標籤頁 */}
      {activeTab === 'deferred' && scheduleData && scheduleData.deferred_orders && (
        <div className="deferred-panel">
          <h3>⏰ 遞延訂單總覽</h3>
          {scheduleData.deferred_orders.length > 0 ? (
            <div className="deferred-list">
              {scheduleData.deferred_orders.map((deferredDay, index) => (
                <div key={index} className="deferred-day-card">
                  <div className="deferred-header">
                    <h4>{deferredDay.date}</h4>
                    <div className="deferred-summary">
                      <span className="count">{deferredDay.deferred_count}筆訂單</span>
                      <span className="quantity">{deferredDay.total_deferred_quantity}瓶</span>
                    </div>
                  </div>
                  
                  <div className="deferred-orders-list">
                    {deferredDay.deferred_orders.map((order, orderIndex) => (
                      <div key={orderIndex} className="deferred-order-item">
                        <div className="order-header">
                          <span className="product-name">{order.product_name}</span>
                          <span className="quantity">{order.quantity}瓶</span>
                          <span className="priority">優先級: {order.priority}</span>
                        </div>
                        <div className="order-details">
                          <p>{order.reason}</p>
                          {order.orders && order.orders.length > 0 && (
                            <div className="related-orders">
                              <small>相關訂單:</small>
                              {order.orders.map((relatedOrder, relatedIndex) => (
                                <small key={relatedIndex} className="related-order">
                                  {relatedOrder.customer_name} - {relatedOrder.quantity}瓶
                                </small>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-deferred">
              <p>🎉 目前沒有遞延訂單！</p>
              <p>所有訂單都能按時完成</p>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .smart-scheduling {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .scheduling-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .scheduling-header h2 {
          color: #333;
          margin-bottom: 10px;
        }

        .scheduling-header p {
          color: #666;
          font-size: 1.1em;
        }

        .alert {
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .alert-error {
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
        }

        .alert-success {
          background: #efe;
          border: 1px solid #cfc;
          color: #3c3;
        }

        .alert button {
          background: none;
          border: none;
          font-size: 1.2em;
          cursor: pointer;
        }

        .tabs {
          display: flex;
          border-bottom: 2px solid #eee;
          margin-bottom: 30px;
        }

        .tab {
          padding: 15px 25px;
          border: none;
          background: none;
          cursor: pointer;
          font-size: 1.1em;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
        }

        .tab.active {
          border-bottom-color: #4facfe;
          color: #4facfe;
          font-weight: bold;
        }

        .tab:hover {
          background: #f8f9fa;
        }

        .config-panel {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 10px;
        }

        .config-section {
          margin-bottom: 30px;
        }

        .config-section h3 {
          color: #333;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #4facfe;
        }

        .config-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .config-item {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .config-item label {
          display: block;
          font-weight: bold;
          margin-bottom: 8px;
          color: #333;
        }

        .config-item input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 5px;
          font-size: 1em;
          margin-bottom: 5px;
        }

        .config-item small {
          color: #666;
          font-size: 0.9em;
        }

        .config-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 30px;
        }

        .btn {
          padding: 12px 25px;
          border: none;
          border-radius: 8px;
          font-size: 1.1em;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: #4facfe;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #3d8bfe;
          transform: translateY(-2px);
        }

        .btn-success {
          background: #28a745;
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          background: #218838;
          transform: translateY(-2px);
        }

        .schedule-panel {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 10px;
        }

        .schedule-summary {
          margin-bottom: 30px;
        }

        .schedule-summary h3 {
          color: #333;
          margin-bottom: 20px;
        }

        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }

        .summary-card {
          background: white;
          padding: 25px;
          border-radius: 10px;
          text-align: center;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .card-number {
          font-size: 2.5em;
          font-weight: bold;
          color: #4facfe;
          margin-bottom: 10px;
        }

        .card-label {
          color: #666;
          font-size: 1.1em;
        }

        .production-plan {
          margin-bottom: 30px;
        }

        .production-plan h3 {
          color: #333;
          margin-bottom: 20px;
        }

        .plan-list {
          display: grid;
          gap: 15px;
        }

        .plan-item {
          background: white;
          padding: 20px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .plan-info h4 {
          color: #333;
          margin-bottom: 5px;
        }

        .plan-info p {
          color: #666;
          font-size: 0.9em;
        }

        .plan-stats {
          text-align: right;
        }

        .quantity {
          font-size: 1.5em;
          font-weight: bold;
          color: #4facfe;
          margin-bottom: 5px;
        }

        .time, .priority {
          color: #666;
          font-size: 0.9em;
        }

        .recommendations {
          background: #e3f2fd;
          padding: 20px;
          border-radius: 8px;
          border-left: 5px solid #2196f3;
        }

        .recommendations h3 {
          color: #1976d2;
          margin-bottom: 15px;
        }

        .recommendations ul {
          list-style: none;
          padding: 0;
        }

        .recommendations li {
          padding: 8px 0;
          color: #333;
        }

        .analysis-panel {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 10px;
        }

        .inventory-analysis, .sales-trend {
          margin-bottom: 30px;
        }

        .inventory-analysis h3, .sales-trend h3 {
          color: #333;
          margin-bottom: 20px;
        }

        .analysis-table, .trend-table {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th, td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }

        th {
          background: #f8f9fa;
          font-weight: bold;
          color: #333;
        }

        tr.urgent {
          background: #fff5f5;
        }

        tr.warning {
          background: #fffbf0;
        }

        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8em;
          font-weight: bold;
        }

        .status-badge.urgent {
          background: #fee;
          color: #c33;
        }

        .status-badge.warning {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge.normal {
          background: #d4edda;
          color: #155724;
        }

        .demand-level {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8em;
          font-weight: bold;
        }

        .demand-level.high {
          background: #fee;
          color: #c33;
        }

        .demand-level.medium {
          background: #fff3cd;
          color: #856404;
        }

        .demand-level.low {
          background: #d1ecf1;
          color: #0c5460;
        }

        @media (max-width: 768px) {
          .config-grid {
            grid-template-columns: 1fr;
          }

          .summary-cards {
            grid-template-columns: repeat(2, 1fr);
          }

          .plan-item {
            flex-direction: column;
            text-align: center;
          }

          .plan-stats {
            text-align: center;
            margin-top: 10px;
          }

          .tabs {
            flex-wrap: wrap;
          }

          .tab {
            flex: 1;
            min-width: 120px;
          }
        }

        /* 多日排程樣式 */
        .multi-day-panel {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .multi-day-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .day-plan-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          background: #fafafa;
        }

        .day-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #4facfe;
        }

        .day-header h4 {
          margin: 0;
          color: #333;
        }

        .day-summary {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .day-summary .bottles {
          font-weight: bold;
          color: #4facfe;
          font-size: 1.2em;
        }

        .day-summary .capacity {
          font-size: 0.9em;
          color: #666;
        }

        .production-list {
          margin-bottom: 15px;
        }

        .production-item {
          background: white;
          padding: 12px;
          margin-bottom: 8px;
          border-radius: 6px;
          border-left: 4px solid #4facfe;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }

        .product-name {
          font-weight: bold;
          color: #333;
        }

        .quantity {
          background: #4facfe;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.9em;
        }

        .item-details {
          display: flex;
          justify-content: space-between;
          font-size: 0.9em;
          color: #666;
        }

        .no-production {
          text-align: center;
          color: #999;
          font-style: italic;
          padding: 20px;
        }

        .deferred-orders {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 12px;
        }

        .deferred-orders h5 {
          margin: 0 0 10px 0;
          color: #856404;
        }

        .deferred-item {
          background: white;
          padding: 8px;
          margin-bottom: 5px;
          border-radius: 4px;
          font-size: 0.9em;
          color: #856404;
        }

        /* 遞延訂單樣式 */
        .deferred-panel {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .deferred-list {
          margin-top: 20px;
        }

        .deferred-day-card {
          border: 1px solid #ffc107;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          background: #fffbf0;
        }

        .deferred-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #ffc107;
        }

        .deferred-header h4 {
          margin: 0;
          color: #856404;
        }

        .deferred-summary {
          display: flex;
          gap: 15px;
        }

        .deferred-summary .count {
          background: #ffc107;
          color: #856404;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: bold;
        }

        .deferred-summary .quantity {
          background: #dc3545;
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: bold;
        }

        .deferred-orders-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .deferred-order-item {
          background: white;
          border: 1px solid #ffc107;
          border-radius: 6px;
          padding: 15px;
        }

        .order-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .order-header .product-name {
          font-weight: bold;
          color: #333;
        }

        .order-header .quantity {
          background: #dc3545;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.9em;
        }

        .order-header .priority {
          background: #6c757d;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.8em;
        }

        .order-details p {
          margin: 5px 0;
          color: #856404;
          font-size: 0.9em;
        }

        .related-orders {
          margin-top: 8px;
        }

        .related-orders small {
          display: block;
          margin: 2px 0;
          color: #666;
        }

        .related-order {
          background: #f8f9fa;
          padding: 2px 6px;
          border-radius: 4px;
          margin: 2px 0;
        }

        .no-deferred {
          text-align: center;
          padding: 40px;
          color: #28a745;
        }

        .no-deferred p {
          margin: 10px 0;
          font-size: 1.1em;
        }
      `}</style>
    </div>
  );
};

export default SmartScheduling;
