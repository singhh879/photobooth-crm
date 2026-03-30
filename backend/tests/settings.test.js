require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');

test('GET /settings returns object with known keys', async () => {
  const res = await request(app).get('/settings');
  expect(res.status).toBe(200);
  expect(typeof res.body).toBe('object');
  expect('briefing_time' in res.body).toBe(true);
});

test('PATCH /settings updates a value', async () => {
  const res = await request(app).patch('/settings').send({ briefing_time: '08:00' });
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
  // restore
  await request(app).patch('/settings').send({ briefing_time: '09:00' });
});
