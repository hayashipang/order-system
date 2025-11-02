import { test, expect } from '@playwright/test';

const BASE = process.env.FRONT_URL || 'http://localhost:3000';

// 測試所有主要頁面沒有 console 錯誤
for (const pageName of ['/', '/admin', '/kitchen', '/scheduling']) {
  test(`No console errors on ${pageName}`, async ({ page }) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    await page.goto(`${BASE}${pageName}`);
    await page.waitForTimeout(2000);
    
    // 檢查是否有 404 錯誤
    const networkErrors = [];
    page.on('response', response => {
      if (response.status() === 404) {
        networkErrors.push(`${response.status()} ${response.url()}`);
      }
    });
    
    await page.waitForTimeout(1000);
    
    expect(errors.length, `Console errors on ${pageName}: ${errors.join('\n')}`).toBe(0);
    expect(networkErrors.length, `404 errors on ${pageName}: ${networkErrors.join('\n')}`).toBe(0);
  });
}

// 測試訂單管理功能
test('Orders management functionality', async ({ page }) => {
  await page.goto(`${BASE}/admin`);
  await page.waitForTimeout(2000);
  
  // 檢查是否能載入訂單歷史
  const orderHistorySection = page.locator('text=訂單歷史');
  await expect(orderHistorySection).toBeVisible();
  
  // 檢查是否能載入產品列表
  const productsSection = page.locator('text=產品管理');
  await expect(productsSection).toBeVisible();
});

// 測試廚房功能
test('Kitchen functionality', async ({ page }) => {
  await page.goto(`${BASE}/kitchen`);
  await page.waitForTimeout(2000);
  
  // 檢查廚房頁面是否正常載入
  const kitchenTitle = page.locator('text=廚房');
  await expect(kitchenTitle).toBeVisible();
});

// 測試客戶訂單功能
test('Customer orders functionality', async ({ page }) => {
  await page.goto(`${BASE}/`);
  await page.waitForTimeout(2000);
  
  // 檢查客戶訂單頁面是否正常載入
  const customerOrdersTitle = page.locator('text=客戶訂單');
  await expect(customerOrdersTitle).toBeVisible();
});











