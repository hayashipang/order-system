import request from 'supertest';
const BASE = process.env.API_URL || 'http://localhost:3001';

describe('API Endpoints', () => {
  test('GET /api/health should return status ok', async () => {
    const res = await request(BASE).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /api/orders/history should return array', async () => {
    const res = await request(BASE).get('/api/orders/history');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/products should return array', async () => {
    const res = await request(BASE).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/customers should return array', async () => {
    const res = await request(BASE).get('/api/customers');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});











