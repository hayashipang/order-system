import React, { useState } from 'react';
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

const ParameterTestModal = ({ isOpen, onClose, onTestComplete }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [testParameters, setTestParameters] = useState({
    // 基礎參數
    daily_capacity: 40,
    staff_count: 1,
    minutes_per_bottle: 15,
    rolling_interval: 4,
    max_rolling_days: 3,
    
    // 策略參數
    unfinished_order_handling: 'carry_forward',
    new_order_insertion: 'priority_based',
    capacity_reserve_percentage: 10,
    preorder_priority_boost: 20,
    
    // 測試設定
    test_duration: 7,
    test_frequency: 'manual',
    parameter_change_strategy: 'gradual',
    
    // AI演算法設定
    ai_algorithm: 'genetic_algorithm',
    optimization_objectives: {
      completion_rate: 0.3,
      capacity_utilization: 0.25,
      overtime_hours: 0.2,
      customer_satisfaction: 0.25
    }
  });

  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [error, setError] = useState(null);

  // AI演算法選項
  const aiAlgorithms = [
    {
      id: 'genetic_algorithm',
      name: '遺傳算法優化',
      description: '模擬生物進化，尋找最優參數組合',
      parameters: {
        population_size: 50,
        generations: 100,
        mutation_rate: 0.1,
        crossover_rate: 0.8
      }
    },
    {
      id: 'particle_swarm',
      name: '粒子群優化',
      description: '模擬鳥群覓食，快速收斂到最優解',
      parameters: {
        swarm_size: 30,
        max_iterations: 100,
        inertia_weight: 0.9,
        cognitive_weight: 2.0,
        social_weight: 2.0
      }
    },
    {
      id: 'simulated_annealing',
      name: '模擬退火',
      description: '模擬金屬退火過程，避免局部最優',
      parameters: {
        initial_temperature: 1000,
        cooling_rate: 0.95,
        min_temperature: 0.01
      }
    },
    {
      id: 'reinforcement_learning',
      name: '強化學習',
      description: '通過獎懲機制學習最佳策略',
      parameters: {
        learning_rate: 0.01,
        discount_factor: 0.95,
        epsilon: 0.1
      }
    }
  ];

  const handleParameterChange = (category, key, value) => {
    setTestParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleObjectiveChange = (objective, weight) => {
    setTestParameters(prev => ({
      ...prev,
      optimization_objectives: {
        ...prev.optimization_objectives,
        [objective]: parseFloat(weight)
      }
    }));
  };

  const runParameterTest = async () => {
    setIsRunning(true);
    setError(null);
    
    try {
      const response = await axios.post(`${getApiUrl()}/api/scheduling/parameter-test`, {
        parameters: testParameters,
        test_duration: testParameters.test_duration
      });
      
      setTestResults(response.data);
      if (onTestComplete) {
        onTestComplete(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || '測試執行失敗');
    } finally {
      setIsRunning(false);
    }
  };

  const applyRecommendedParameters = async () => {
    if (!testResults?.recommended_parameters) return;
    
    try {
      await axios.put(`${getApiUrl()}/api/scheduling/config`, testResults.recommended_parameters);
      alert('推薦參數已成功應用到系統！');
      onClose();
    } catch (err) {
      setError('應用推薦參數失敗');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">智能參數測試與優化</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 標籤頁導航 */}
        <div className="flex border-b mb-6">
          {[
            { id: 'basic', name: '基礎參數' },
            { id: 'strategy', name: '策略參數' },
            { id: 'ai', name: 'AI優化' },
            { id: 'results', name: '測試結果' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* 基礎參數標籤頁 */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">基礎產能參數</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  日產能 (瓶/天): {testParameters.daily_capacity}
                </label>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={testParameters.daily_capacity || 40}
                  onChange={(e) => handleParameterChange('basic', 'daily_capacity', parseInt(e.target.value) || 40)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  人力數量: {testParameters.staff_count}
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={testParameters.staff_count || 1}
                  onChange={(e) => handleParameterChange('basic', 'staff_count', parseInt(e.target.value) || 1)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  每瓶製作時間 (分鐘): {testParameters.minutes_per_bottle}
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="5"
                  value={testParameters.minutes_per_bottle || 1.5}
                  onChange={(e) => handleParameterChange('basic', 'minutes_per_bottle', parseFloat(e.target.value) || 1.5)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  滾動間隔 (小時)
                </label>
                <select
                  value={testParameters.rolling_interval}
                  onChange={(e) => handleParameterChange('basic', 'rolling_interval', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={1}>1小時</option>
                  <option value={2}>2小時</option>
                  <option value={4}>4小時</option>
                  <option value={8}>8小時</option>
                  <option value={12}>12小時</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  最大滾動天數: {testParameters.max_rolling_days}
                </label>
                <input
                  type="range"
                  min="1"
                  max="7"
                  step="1"
                  value={testParameters.max_rolling_days || 3}
                  onChange={(e) => handleParameterChange('basic', 'max_rolling_days', parseInt(e.target.value) || 3)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  測試持續時間 (天)
                </label>
                <select
                  value={testParameters.test_duration}
                  onChange={(e) => handleParameterChange('basic', 'test_duration', parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={1}>1天</option>
                  <option value={3}>3天</option>
                  <option value={7}>7天</option>
                  <option value={14}>14天</option>
                  <option value={30}>30天</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 策略參數標籤頁 */}
        {activeTab === 'strategy' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">策略參數設定</h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  未完成訂單處理方式
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'carry_forward', label: '自動延到明天' },
                    { value: 'manual_review', label: '手動審核' },
                    { value: 'priority_override', label: '優先級覆蓋' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="unfinished_order_handling"
                        value={option.value}
                        checked={testParameters.unfinished_order_handling === option.value}
                        onChange={(e) => handleParameterChange('strategy', 'unfinished_order_handling', e.target.value)}
                        className="mr-2"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  新訂單插入策略
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'recalculate_all', label: '重新計算全部' },
                    { value: 'append_only', label: '只追加到剩餘產能' },
                    { value: 'priority_based', label: '基於優先級插入' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="new_order_insertion"
                        value={option.value}
                        checked={testParameters.new_order_insertion === option.value}
                        onChange={(e) => handleParameterChange('strategy', 'new_order_insertion', e.target.value)}
                        className="mr-2"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  產能保留百分比: {testParameters.capacity_reserve_percentage}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="5"
                  value={testParameters.capacity_reserve_percentage || 10}
                  onChange={(e) => handleParameterChange('strategy', 'capacity_reserve_percentage', parseInt(e.target.value) || 10)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  預訂訂單優先級加成: {testParameters.preorder_priority_boost}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="10"
                  value={testParameters.preorder_priority_boost || 20}
                  onChange={(e) => handleParameterChange('strategy', 'preorder_priority_boost', parseInt(e.target.value) || 20)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* AI優化標籤頁 */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">AI演算法選擇</h3>
            
            <div className="grid grid-cols-2 gap-4">
              {aiAlgorithms.map(algorithm => (
                <div
                  key={algorithm.id}
                  className={`p-4 border rounded-lg cursor-pointer ${
                    testParameters.ai_algorithm === algorithm.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => handleParameterChange('ai', 'ai_algorithm', algorithm.id)}
                >
                  <h4 className="font-medium text-gray-800">{algorithm.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{algorithm.description}</p>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-4">優化目標權重設定</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(testParameters.optimization_objectives).map(([objective, weight]) => (
                  <div key={objective}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {objective === 'completion_rate' && '訂單完成率'}
                      {objective === 'capacity_utilization' && '產能利用率'}
                      {objective === 'overtime_hours' && '加班時數'}
                      {objective === 'customer_satisfaction' && '客戶滿意度'}
                      : {weight}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={weight}
                      onChange={(e) => handleObjectiveChange(objective, e.target.value)}
                      className="w-full"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 測試結果標籤頁 */}
        {activeTab === 'results' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">測試結果與推薦</h3>
            
            {testResults ? (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">當前績效</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>完成率: {(testResults.current_performance.completion_rate * 100).toFixed(1)}%</div>
                    <div>產能利用率: {(testResults.current_performance.capacity_utilization * 100).toFixed(1)}%</div>
                    <div>加班時數: {testResults.current_performance.overtime_hours.toFixed(1)}小時</div>
                    <div>客戶滿意度: {(testResults.current_performance.customer_satisfaction * 100).toFixed(1)}%</div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">推薦參數</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>日產能: {testResults.recommended_parameters.daily_capacity}</div>
                    <div>人力數量: {testResults.recommended_parameters.staff_count}</div>
                    <div>每瓶製作時間: {testResults.recommended_parameters.minutes_per_bottle}分鐘</div>
                    <div>滾動間隔: {testResults.recommended_parameters.rolling_interval}小時</div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">預期改善</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>完成率提升: +{(testResults.expected_improvement.completion_rate * 100).toFixed(1)}%</div>
                    <div>產能利用率提升: +{(testResults.expected_improvement.capacity_utilization * 100).toFixed(1)}%</div>
                    <div>加班時數減少: -{testResults.expected_improvement.overtime_hours.toFixed(1)}小時</div>
                    <div>客戶滿意度提升: +{(testResults.expected_improvement.customer_satisfaction * 100).toFixed(1)}%</div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={applyRecommendedParameters}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  >
                    應用推薦參數
                  </button>
                  <button
                    onClick={runParameterTest}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    重新測試
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">尚未執行測試</p>
                <button
                  onClick={runParameterTest}
                  disabled={isRunning}
                  className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                >
                  {isRunning ? '測試執行中...' : '開始測試'}
                </button>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>
        )}

        {/* 底部按鈕 */}
        <div className="flex justify-end space-x-4 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            取消
          </button>
          {activeTab !== 'results' && (
            <button
              onClick={() => setActiveTab('results')}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            >
              查看結果
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParameterTestModal;
