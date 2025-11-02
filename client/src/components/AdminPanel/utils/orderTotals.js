// ==========================================================
//  orderTotals.js
//  ✅ 抽取自 useOrders.js 中的純計算函數（無副作用）
//  ✅ 保持邏輯完全不變
// ==========================================================

import {
  calculateTotalAmount as calculateTotalAmountUtil,
  calculateCreditCardFee as calculateCreditCardFeeUtil,
  calculateShopeeFee as calculateShopeeFeeUtil,
  calculateEditCreditCardFee as calculateEditCreditCardFeeUtil,
  calculateEditShopeeFee as calculateEditShopeeFeeUtil,
} from "./adminPanelUtils";

// ==========================================================
// ✅ 計算函數（純函數，無副作用）
// ==========================================================
// 注意：這些函數從 adminPanelUtils.js 中導入，並重新導出
// 保持與 useOrders.js 中原有的調用方式一致

/**
 * ✅ 計算訂單總金額
 * @param {Object} newOrder - 訂單資料
 * @param {number} shippingFee - 運費
 * @param {Array} customers - 客戶列表
 * @returns {number} 訂單總金額
 */
export function calculateTotalAmount(newOrder, shippingFee, customers) {
  return calculateTotalAmountUtil(newOrder, shippingFee, customers);
}

/**
 * ✅ 計算信用卡手續費
 * @param {Object} newOrder - 訂單資料
 * @param {Array} customers - 客戶列表
 * @returns {number} 信用卡手續費
 */
export function calculateCreditCardFee(newOrder, customers) {
  return calculateCreditCardFeeUtil(newOrder, customers);
}

/**
 * ✅ 計算蝦皮費用
 * @param {Object} newOrder - 訂單資料
 * @param {Array} customers - 客戶列表
 * @returns {number} 蝦皮費用
 */
export function calculateShopeeFee(newOrder, customers) {
  return calculateShopeeFeeUtil(newOrder, customers);
}

/**
 * ✅ 計算編輯訂單的信用卡手續費
 * @param {Object} editOrderForm - 編輯訂單表單資料
 * @param {Array} customers - 客戶列表
 * @returns {number} 信用卡手續費
 */
export function calculateEditCreditCardFee(editOrderForm, customers) {
  return calculateEditCreditCardFeeUtil(editOrderForm, customers);
}

/**
 * ✅ 計算編輯訂單的蝦皮費用
 * @param {Object} editOrderForm - 編輯訂單表單資料
 * @param {Array} customers - 客戶列表
 * @returns {number} 蝦皮費用
 */
export function calculateEditShopeeFee(editOrderForm, customers) {
  return calculateEditShopeeFeeUtil(editOrderForm, customers);
}

