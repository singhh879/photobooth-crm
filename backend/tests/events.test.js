require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');
const supabase = require('../src/db/client');

let createdId;

afterAll(async () => {
  if (createdId) {
    await supabase.from('events').delete().eq('id', createdId);
  }
});

test('POST /events creates an event', async () => {
  const res = await request(app).post('/events').send({
    status: 'soft_block',
    city: 'Delhi',
    client_name: 'Test Client',
    event_date: '2026-06-01'
  });
  expect(res.status).toBe(201);
  expect(res.body.client_name).toBe('Test Client');
  createdId = res.body.id;
});

test('GET /events returns array', async () => {
  const res = await request(app).get('/events');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
});

test('GET /events?city=Delhi filters by city', async () => {
  const res = await request(app).get('/events?city=Delhi');
  expect(res.status).toBe(200);
  res.body.forEach(e => expect(e.city).toBe('Delhi'));
});

test('GET /events/:id returns single event', async () => {
  const res = await request(app).get(`/events/${createdId}`);
  expect(res.status).toBe(200);
  expect(res.body.id).toBe(createdId);
});

test('PATCH /events/:id updates fields', async () => {
  const res = await request(app).patch(`/events/${createdId}`).send({ venue: 'Test Venue' });
  expect(res.status).toBe(200);
  expect(res.body.venue).toBe('Test Venue');
});

test('PATCH /events/:id/team assigns team members', async () => {
  const { data: member } = await supabase.from('team_members').insert({ name: 'Temp Member' }).select().single();
  const res = await request(app).patch(`/events/${createdId}/team`).send({ member_ids: [member.id] });
  expect(res.status).toBe(200);
  await supabase.from('team_members').delete().eq('id', member.id);
});

test('DELETE /events/:id removes event', async () => {
  const res = await request(app).delete(`/events/${createdId}`);
  expect(res.status).toBe(204);
  createdId = null;
});
