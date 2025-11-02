import { test, expect } from '@playwright/test';
const BASE = process.env.API_URL || 'http://localhost:3001';

test('orders history returns array', async ({ request }) => {
  const res = await request.get(`${BASE}/api/orders/history`);
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(Array.isArray(data)).toBe(true);
});

test('products API returns array', async ({ request }) => {
  const res = await request.get(`${BASE}/api/products`);
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(Array.isArray(data)).toBe(true);
});

test('customers API returns array', async ({ request }) => {
  const res = await request.get(`${BASE}/api/customers`);
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(Array.isArray(data)).toBe(true);
});











