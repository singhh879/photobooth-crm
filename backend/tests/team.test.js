require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');
const supabase = require('../src/db/client');

let memberId;

afterAll(async () => {
  if (memberId) await supabase.from('team_members').delete().eq('id', memberId);
});

test('POST /team creates member', async () => {
  const res = await request(app).post('/team').send({ name: 'Ravi Kumar', phone_number: '9876543210' });
  expect(res.status).toBe(201);
  expect(res.body.name).toBe('Ravi Kumar');
  memberId = res.body.id;
});

test('GET /team returns active members', async () => {
  const res = await request(app).get('/team');
  expect(res.status).toBe(200);
  expect(res.body.every(m => !m.archived)).toBe(true);
});

test('PATCH /team/:id/archive archives member', async () => {
  const res = await request(app).patch(`/team/${memberId}/archive`);
  expect(res.status).toBe(200);
  expect(res.body.archived).toBe(true);
});
