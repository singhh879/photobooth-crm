require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');

test('GET /dropdown/photobooth_type returns array of strings', async () => {
  const res = await request(app).get('/dropdown/photobooth_type');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body.length).toBeGreaterThan(0);
});

test('POST /dropdown/photobooth_type adds custom option', async () => {
  const res = await request(app).post('/dropdown/photobooth_type').send({ value: 'Test Booth XYZ' });
  expect(res.status).toBe(201);
  const list = await request(app).get('/dropdown/photobooth_type');
  expect(list.body).toContain('Test Booth XYZ');
});
