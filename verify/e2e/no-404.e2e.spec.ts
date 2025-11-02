import { test, expect } from '@playwright/test';
const FRONT = process.env.FRONT_URL || 'http://localhost:3000';

test('無 404 API 錯誤 - 主頁', async ({ page }) => {
  const errors: string[] = [];
  page.on('response', async (response) => {
    const status = response.status();
    const url = response.url();
    if (status === 404 && url.includes('/api/')) {
      errors.push(url);
    }
  });

  await page.goto(`${FRONT}/`);
  await page.waitForTimeout(2000);
  expect(errors.length, `404 APIs detected: ${errors.join(', ')}`).toBe(0);
});

test('無 404 API 錯誤 - 後台管理', async ({ page }) => {
  const errors: string[] = [];
  page.on('response', async (response) => {
    const status = response.status();
    const url = response.url();
    if (status === 404 && url.includes('/api/')) {
      errors.push(url);
    }
  });

  await page.goto(`${FRONT}/admin`);
  await page.waitForTimeout(2000);
  expect(errors.length, `404 APIs detected: ${errors.join(', ')}`).toBe(0);
});

test('無 404 API 錯誤 - 廚房', async ({ page }) => {
  const errors: string[] = [];
  page.on('response', async (response) => {
    const status = response.status();
    const url = response.url();
    if (status === 404 && url.includes('/api/')) {
      errors.push(url);
    }
  });

  await page.goto(`${FRONT}/kitchen`);
  await page.waitForTimeout(2000);
  expect(errors.length, `404 APIs detected: ${errors.join(', ')}`).toBe(0);
});

test('無 Console 錯誤', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto(`${FRONT}/`);
  await page.waitForTimeout(2000);
  expect(errors.length, `Console errors: ${errors.join('\n')}`).toBe(0);
});
