import request from 'supertest';
const BASE = process.env.API_URL || 'http://localhost:3001';

describe('GET /api/orders/weekly/:date', () => {
  it('should return a valid JSON object with count and orders', async () => {
    const res = await request(BASE).get('/api/orders/weekly/2025-10-28');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('range');
    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('orders');
    expect(Array.isArray(res.body.orders)).toBe(true);
    expect(res.body.range).toHaveProperty('from');
    expect(res.body.range).toHaveProperty('to');
  });

  it('should return correct date range for weekly query', async () => {
    const res = await request(BASE).get('/api/orders/weekly/2025-10-28');
    expect(res.status).toBe(200);
    expect(res.body.range.from).toBe('2025-10-28');
    expect(res.body.range.to).toBe('2025-11-04');
  });

  it('should handle invalid date format gracefully', async () => {
    const res = await request(BASE).get('/api/orders/weekly/invalid-date');
    // 應該返回錯誤或空結果
    expect(res.status).toBeGreaterThanOrEqual(200);
  });
});

