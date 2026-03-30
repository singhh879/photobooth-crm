require('dotenv').config();
const request = require('supertest');
const app = require('../src/app');
const supabase = require('../src/db/client');

// Mock telegram so no real messages are sent during tests
jest.mock('../src/services/telegram', () => ({
  sendMessage: jest.fn().mockResolvedValue({ ok: true })
}));

let eventId;

beforeAll(async () => {
  const { data } = await supabase.from('events').insert({
    client_name: 'Notify Test Client',
    city: 'Delhi',
    event_date: new Date().toISOString().split('T')[0],
  }).select().single();
  eventId = data.id;
});

afterAll(async () => {
  if (eventId) await supabase.from('events').delete().eq('id', eventId);
});

test('POST /notify/briefing returns ok', async () => {
  const res = await request(app).post('/notify/briefing');
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
  expect(typeof res.body.events_count).toBe('number');
});

test('POST /notify/send-to-boss returns ok', async () => {
  const res = await request(app).post('/notify/send-to-boss').send({ event_id: eventId });
  expect(res.status).toBe(200);
  expect(res.body.ok).toBe(true);
});
