# Photobooth CRM Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React Native (Expo) Android CRM app with a Node/Express backend for managing photobooth events across 4 Indian cities, with Telegram notifications.

**Architecture:** React Native (Expo) mobile app communicates with a Node.js/Express REST API hosted on Render free tier. Data is stored in PostgreSQL via Supabase. Telegram Bot API handles all notifications. cron-job.org pings a backend endpoint daily to trigger the morning briefing.

**Tech Stack:** Expo SDK 51, React Native, TypeScript, Node.js, Express, Supabase (PostgreSQL), Telegram Bot API, Jest, Supertest, React Native Testing Library, EAS Build

---

## File Structure

```
photobooth-crm/
  backend/
    src/
      db/
        client.js              — Supabase client singleton
        migrations/
          001_initial.sql      — Full DB schema
      routes/
        events.js              — Events CRUD
        team.js                — Team members CRUD + archive
        dropdown.js            — Dropdown options CRUD
        settings.js            — Settings CRUD
        notify.js              — Telegram notification endpoints
      services/
        telegram.js            — Telegram Bot API wrapper (sendMessage)
        briefing.js            — Builds daily briefing message string
      middleware/
        errorHandler.js        — Central Express error handler
      app.js                   — Express app setup, mounts routes
    server.js                  — Entry point, starts HTTP server
    package.json
    .env.example
    tests/
      events.test.js
      team.test.js
      dropdown.test.js
      settings.test.js
      notify.test.js
      briefing.test.js

  mobile/
    app/
      _layout.tsx              — Root layout + bottom tab navigator
      (tabs)/
        index.tsx              — Events tab
        team.tsx               — Team tab
        settings.tsx           — Settings tab
      event/
        [id].tsx               — Event Detail screen
    components/
      EventCard.tsx            — Card: name, date, city, status, progress bar
      CityFilter.tsx           — Segmented control: All/Delhi/Mumbai/Nagpur/Hyderabad
      AddEventModal.tsx        — FAB modal: status, city, date, client name
      FieldRow.tsx             — Tap-to-edit labelled field row
      TeamChecklist.tsx        — Multi-select from saved roster
      CustomDropdown.tsx       — Dropdown + "Add custom" option
    hooks/
      useEvents.ts             — Fetch, create, update events
      useTeam.ts               — Fetch, create, archive team members
      useSettings.ts           — Read/write settings
      useDropdownOptions.ts    — Fetch + add dropdown options
    lib/
      api.ts                   — Axios instance with BACKEND_URL base
      progress.ts              — Calculates 0-9 completion score for an event
      format.ts                — Date/time display helpers
    constants/
      cities.ts                — Export CITIES array
    package.json
    app.json                   — Expo config with app version
    eas.json                   — EAS build profiles
```

---

## Chunk 1: Project Scaffold + Database + Backend Foundation

### Task 1: Initialize backend project

**Files:**
- Create: `backend/package.json`
- Create: `backend/.env.example`
- Create: `backend/src/app.js`
- Create: `backend/server.js`

- [ ] **Step 1: Create backend folder and package.json**

```bash
cd "/Users/harshitsingh/Downloads/Misc Projects/photobooth-crm"
mkdir -p backend/src/db/migrations backend/src/routes backend/src/services backend/src/middleware backend/tests
cd backend
npm init -y
npm install express @supabase/supabase-js dotenv cors
npm install --save-dev jest supertest
```

- [ ] **Step 2: Add test script to package.json**

Edit `backend/package.json` — set scripts:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "jest --runInBand"
  },
  "jest": {
    "testEnvironment": "node"
  }
}
```

- [ ] **Step 3: Create .env.example**

Create `backend/.env.example`:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
TELEGRAM_BOT_TOKEN=your-bot-token
PORT=3000
```

Copy to `.env` and fill in real values before running.

- [ ] **Step 4: Create app.js**

Create `backend/src/app.js`:
```js
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

module.exports = app;
```

- [ ] **Step 5: Create server.js**

Create `backend/server.js`:
```js
require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

- [ ] **Step 6: Create errorHandler middleware**

Create `backend/src/middleware/errorHandler.js`:
```js
function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
}

module.exports = errorHandler;
```

- [ ] **Step 7: Create .gitignore**

Create `backend/.gitignore`:
```
node_modules/
.env
```

- [ ] **Step 8: Write health check test**

Create `backend/tests/health.test.js`:
```js
const request = require('supertest');
const app = require('../src/app');

test('GET /health returns ok', async () => {
  const res = await request(app).get('/health');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('ok');
});
```

- [ ] **Step 9: Run test**

```bash
cd backend && npm test
```
Expected: PASS — 1 test suite, 1 test

- [ ] **Step 10: Commit**

```bash
git init
git add backend/
git commit -m "feat: backend project scaffold with health endpoint"
```

---

### Task 2: Database schema

**Files:**
- Create: `backend/src/db/migrations/001_initial.sql`
- Create: `backend/src/db/client.js`

- [ ] **Step 1: Write migration SQL**

Create `backend/src/db/migrations/001_initial.sql`:
```sql
-- Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'soft_block' CHECK (status IN ('soft_block', 'confirmed')),
  city TEXT NOT NULL DEFAULT 'Delhi' CHECK (city IN ('Delhi', 'Mumbai', 'Nagpur', 'Hyderabad')),
  event_date DATE,
  client_name TEXT,
  venue TEXT,
  timing_from TIME,
  timing_to TIME,
  poc_name TEXT,
  poc_number TEXT,
  photobooth_type TEXT,
  package TEXT,
  num_prints INTEGER,
  template_status TEXT DEFAULT 'not_started' CHECK (template_status IN ('not_started', 'in_progress', 'done')),
  invoice_raised BOOLEAN DEFAULT FALSE,
  payment_received BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Team members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone_number TEXT,
  archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Event ↔ Team join table
CREATE TABLE event_team (
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES team_members(id) ON DELETE RESTRICT,
  PRIMARY KEY (event_id, team_member_id)
);

-- Persistent dropdown options (photobooth_type, package)
CREATE TABLE dropdown_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL,
  value TEXT NOT NULL,
  UNIQUE (field_name, value)
);

-- App settings (key-value)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- Auto-update updated_at on events
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed default dropdown options
INSERT INTO dropdown_options (field_name, value) VALUES
  ('photobooth_type', 'Open Booth'),
  ('photobooth_type', 'Enclosed Booth'),
  ('photobooth_type', '360 Booth'),
  ('photobooth_type', 'Mirror Booth'),
  ('package', 'Basic'),
  ('package', 'Standard'),
  ('package', 'Premium');

-- Seed default settings
INSERT INTO settings (key, value) VALUES
  ('briefing_time', '09:00'),
  ('user_telegram_chat_id', ''),
  ('boss_telegram_chat_id', '');
```

- [ ] **Step 2: Run migration in Supabase**

Open Supabase dashboard → SQL Editor → paste contents of `001_initial.sql` → Run.
Expected: All tables created with no errors.

- [ ] **Step 3: Create Supabase client**

Create `backend/src/db/client.js`:
```js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = supabase;
```

- [ ] **Step 4: Write DB connection test**

Create `backend/tests/db.test.js`:
```js
require('dotenv').config();
const supabase = require('../src/db/client');

test('can query dropdown_options table', async () => {
  const { data, error } = await supabase.from('dropdown_options').select('*');
  expect(error).toBeNull();
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeGreaterThan(0);
});
```

- [ ] **Step 5: Run test**

```bash
cd backend && npm test tests/db.test.js
```
Expected: PASS — confirms Supabase connection works

- [ ] **Step 6: Commit**

```bash
git add backend/src/db/ backend/tests/db.test.js
git commit -m "feat: database schema and supabase client"
```

---

## Chunk 2: Backend Routes

### Task 3: Events routes

**Files:**
- Create: `backend/src/routes/events.js`
- Create: `backend/tests/events.test.js`
- Modify: `backend/src/app.js`

- [ ] **Step 1: Write failing tests**

Create `backend/tests/events.test.js`:
```js
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
  // Insert a temp team member
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd backend && npm test tests/events.test.js
```
Expected: FAIL — "Cannot GET /events"

- [ ] **Step 3: Implement events routes**

Create `backend/src/routes/events.js`:
```js
const express = require('express');
const router = express.Router();
const supabase = require('../db/client');

// GET /events?city=Delhi
router.get('/', async (req, res, next) => {
  try {
    let query = supabase.from('events').select(`*, event_team(team_member_id, team_members(id, name))`).order('event_date', { ascending: true });
    if (req.query.city) query = query.eq('city', req.query.city);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// GET /events/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select(`*, event_team(team_member_id, team_members(id, name))`)
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// POST /events
router.post('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('events').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

// PATCH /events/:id
router.patch('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('events').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

// PATCH /events/:id/team — replace all assigned members
router.patch('/:id/team', async (req, res, next) => {
  try {
    const { member_ids } = req.body;
    await supabase.from('event_team').delete().eq('event_id', req.params.id);
    if (member_ids && member_ids.length > 0) {
      const rows = member_ids.map(mid => ({ event_id: req.params.id, team_member_id: mid }));
      const { error } = await supabase.from('event_team').insert(rows);
      if (error) throw error;
    }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// DELETE /events/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('events').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
```

- [ ] **Step 4: Mount routes in app.js**

Edit `backend/src/app.js` — add after `app.get('/health', ...)`:
```js
app.use('/events', require('./routes/events'));
```

- [ ] **Step 5: Run tests**

```bash
cd backend && npm test tests/events.test.js
```
Expected: All 7 tests PASS

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/events.js backend/src/app.js backend/tests/events.test.js
git commit -m "feat: events CRUD routes"
```

---

### Task 4: Team, Dropdown, Settings routes

**Files:**
- Create: `backend/src/routes/team.js`
- Create: `backend/src/routes/dropdown.js`
- Create: `backend/src/routes/settings.js`
- Create: `backend/tests/team.test.js`
- Modify: `backend/src/app.js`

- [ ] **Step 1: Write failing tests for team**

Create `backend/tests/team.test.js`:
```js
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
```

- [ ] **Step 2: Implement team routes**

Create `backend/src/routes/team.js`:
```js
const express = require('express');
const router = express.Router();
const supabase = require('../db/client');

router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('team_members').select('*').eq('archived', false).order('name');
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('team_members').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('team_members').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

router.patch('/:id/archive', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('team_members').update({ archived: true }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
```

- [ ] **Step 3: Implement dropdown routes**

Create `backend/src/routes/dropdown.js`:
```js
const express = require('express');
const router = express.Router();
const supabase = require('../db/client');

// GET /dropdown/:fieldName
router.get('/:fieldName', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('dropdown_options').select('value').eq('field_name', req.params.fieldName).order('value');
    if (error) throw error;
    res.json(data.map(r => r.value));
  } catch (err) { next(err); }
});

// POST /dropdown/:fieldName
router.post('/:fieldName', async (req, res, next) => {
  try {
    const { value } = req.body;
    const { data, error } = await supabase.from('dropdown_options')
      .upsert({ field_name: req.params.fieldName, value }, { onConflict: 'field_name,value' })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { next(err); }
});

module.exports = router;
```

- [ ] **Step 4: Implement settings routes**

Create `backend/src/routes/settings.js`:
```js
const express = require('express');
const router = express.Router();
const supabase = require('../db/client');

// GET /settings — returns all as { key: value } object
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;
    const obj = {};
    data.forEach(r => { obj[r.key] = r.value; });
    res.json(obj);
  } catch (err) { next(err); }
});

// PATCH /settings — body: { key: value, ... }
router.patch('/', async (req, res, next) => {
  try {
    const updates = Object.entries(req.body).map(([key, value]) => ({ key, value }));
    const { error } = await supabase.from('settings').upsert(updates, { onConflict: 'key' });
    if (error) throw error;
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
```

- [ ] **Step 5: Mount all new routes in app.js**

Edit `backend/src/app.js` — add after events route:
```js
app.use('/team', require('./routes/team'));
app.use('/dropdown', require('./routes/dropdown'));
app.use('/settings', require('./routes/settings'));
```

- [ ] **Step 6: Run team tests**

```bash
cd backend && npm test tests/team.test.js
```
Expected: All 3 tests PASS

- [ ] **Step 7: Commit**

```bash
git add backend/src/routes/ backend/tests/team.test.js backend/src/app.js
git commit -m "feat: team, dropdown, and settings routes"
```

---

## Chunk 3: Telegram Service + Notify Routes

### Task 5: Telegram service

**Files:**
- Create: `backend/src/services/telegram.js`
- Create: `backend/src/services/briefing.js`
- Create: `backend/src/routes/notify.js`
- Create: `backend/tests/briefing.test.js`

- [ ] **Step 1: Install node-fetch**

```bash
cd backend && npm install node-fetch@2
```

- [ ] **Step 2: Create telegram service**

Create `backend/src/services/telegram.js`:
```js
const fetch = require('node-fetch');

async function sendMessage(chatId, text) {
  if (!chatId || !process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('Telegram: missing chatId or token, skipping');
    return;
  }
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
  });
  const json = await res.json();
  if (!json.ok) console.error('Telegram error:', json.description);
  return json;
}

module.exports = { sendMessage };
```

- [ ] **Step 3: Write briefing builder test**

Create `backend/tests/briefing.test.js`:
```js
const { buildBriefingMessage } = require('../src/services/briefing');

test('includes today events section', () => {
  const today = new Date().toISOString().split('T')[0];
  const events = [
    { client_name: 'Sharma Wedding', city: 'Delhi', venue: 'Taj Hotel', timing_from: '18:00', timing_to: '22:00', package: 'Premium', photobooth_type: 'Mirror Booth', event_date: today, payment_received: false, event_team: [{ team_members: { name: 'Ravi' } }] }
  ];
  const msg = buildBriefingMessage(events);
  expect(msg).toContain('Sharma Wedding');
  expect(msg).toContain('Taj Hotel');
});

test('includes payment pending warning', () => {
  const future = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  const events = [
    { client_name: 'Gupta Party', city: 'Mumbai', venue: 'Hotel ABC', timing_from: '19:00', timing_to: '23:00', package: 'Basic', photobooth_type: 'Open Booth', event_date: future, payment_received: false, event_team: [] }
  ];
  const msg = buildBriefingMessage(events);
  expect(msg).toContain('Payment pending');
});

test('returns no events message when empty', () => {
  const msg = buildBriefingMessage([]);
  expect(msg).toContain('No events');
});
```

- [ ] **Step 4: Run tests to confirm they fail**

```bash
cd backend && npm test tests/briefing.test.js
```
Expected: FAIL

- [ ] **Step 5: Implement briefing service**

Create `backend/src/services/briefing.js`:
```js
function fmt(val, fallback = 'Not set') {
  return val || fallback;
}

function buildBriefingMessage(events) {
  if (!events || events.length === 0) return '📋 No events in the next 7 days.';

  const today = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.event_date === today);
  const upcomingEvents = events.filter(e => e.event_date > today);
  const pendingPayment = events.filter(e => !e.payment_received);

  let msg = '🌅 <b>Good Morning! Here\'s your daily briefing</b>\n\n';

  if (todayEvents.length > 0) {
    msg += '📍 <b>TODAY\'S EVENTS</b>\n';
    todayEvents.forEach(e => {
      const team = e.event_team?.map(t => t.team_members?.name).filter(Boolean).join(', ') || 'Not assigned';
      msg += `\n• <b>${fmt(e.client_name)}</b> — ${fmt(e.city)}\n`;
      msg += `  📍 ${fmt(e.venue)}\n`;
      msg += `  🕐 ${fmt(e.timing_from)} to ${fmt(e.timing_to)}\n`;
      msg += `  📦 ${fmt(e.package)} | ${fmt(e.photobooth_type)}\n`;
      msg += `  👥 ${team}\n`;
    });
    msg += '\n';
  } else {
    msg += '📍 No events today.\n\n';
  }

  if (upcomingEvents.length > 0) {
    msg += '📅 <b>UPCOMING THIS WEEK</b>\n';
    upcomingEvents.forEach(e => {
      msg += `\n• <b>${fmt(e.client_name)}</b> — ${e.event_date} — ${fmt(e.city)}\n`;
    });
    msg += '\n';
  }

  if (pendingPayment.length > 0) {
    msg += '💰 <b>Payment pending:</b>\n';
    pendingPayment.forEach(e => {
      msg += `• ${fmt(e.client_name)} (${e.event_date})\n`;
    });
  }

  return msg;
}

module.exports = { buildBriefingMessage };
```

- [ ] **Step 6: Run briefing tests**

```bash
cd backend && npm test tests/briefing.test.js
```
Expected: All 3 tests PASS

- [ ] **Step 7: Create notify routes**

Create `backend/src/routes/notify.js`:
```js
const express = require('express');
const router = express.Router();
const supabase = require('../db/client');
const { sendMessage } = require('../services/telegram');
const { buildBriefingMessage } = require('../services/briefing');

// POST /notify/briefing — called by cron-job.org daily
router.post('/briefing', async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const sevenDays = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const { data: events, error } = await supabase
      .from('events')
      .select(`*, event_team(team_member_id, team_members(id, name))`)
      .gte('event_date', today)
      .lte('event_date', sevenDays)
      .order('event_date', { ascending: true });

    if (error) throw error;

    const { data: settings } = await supabase.from('settings').select('*');
    const cfg = {};
    settings.forEach(s => { cfg[s.key] = s.value; });

    const message = buildBriefingMessage(events);
    await sendMessage(cfg.user_telegram_chat_id, message);

    res.json({ ok: true, events_count: events.length });
  } catch (err) { next(err); }
});

// POST /notify/send-to-boss — called when user taps "Send to Boss"
router.post('/send-to-boss', async (req, res, next) => {
  try {
    const { event_id } = req.body;

    const { data: event, error } = await supabase
      .from('events')
      .select(`*, event_team(team_member_id, team_members(id, name))`)
      .eq('id', event_id)
      .single();

    if (error) throw error;

    const { data: settings } = await supabase.from('settings').select('*');
    const cfg = {};
    settings.forEach(s => { cfg[s.key] = s.value; });

    const team = event.event_team?.map(t => t.team_members?.name).filter(Boolean).join(', ') || 'Not set';

    const msg =
      `📋 <b>Event Summary — ${event.client_name || 'Not set'}</b>\n` +
      `Date: ${event.event_date || 'Not set'}\n` +
      `City: ${event.city || 'Not set'}\n` +
      `Venue: ${event.venue || 'Not set'}\n` +
      `Timings: ${event.timing_from || 'Not set'} to ${event.timing_to || 'Not set'}\n` +
      `Package: ${event.package || 'Not set'}\n` +
      `Setup: ${event.photobooth_type || 'Not set'}\n` +
      `Team: ${team}\n` +
      `Invoice Raised: ${event.invoice_raised ? 'Yes' : 'No'}\n` +
      `Payment Received: ${event.payment_received ? 'Yes' : 'No'}`;

    await sendMessage(cfg.boss_telegram_chat_id, msg);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
```

- [ ] **Step 8: Mount notify routes in app.js + show final state**

Replace `backend/src/app.js` with the final complete version (all routes mounted):
```js
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/events', require('./routes/events'));
app.use('/team', require('./routes/team'));
app.use('/dropdown', require('./routes/dropdown'));
app.use('/settings', require('./routes/settings'));
app.use('/notify', require('./routes/notify'));

app.use(errorHandler);

module.exports = app;
```

- [ ] **Step 9: Write notify endpoint tests**

Create `backend/tests/notify.test.js`:
```js
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
```

- [ ] **Step 10: Run notify tests**

```bash
cd backend && npm test tests/notify.test.js
```
Expected: Both tests PASS (Telegram mocked — no real messages sent)

- [ ] **Step 11: Write dropdown + settings tests**

Create `backend/tests/dropdown.test.js`:
```js
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
```

Create `backend/tests/settings.test.js`:
```js
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
```

- [ ] **Step 12: Run all backend tests**

```bash
cd backend && npm test
```
Expected: All test suites PASS

- [ ] **Step 13: Commit**

```bash
git add backend/src/services/ backend/src/routes/notify.js backend/tests/ backend/src/app.js
git commit -m "feat: telegram service, briefing builder, notify routes, full test coverage"
```

---

## Chunk 4: Mobile App — Foundation

### Task 6: Initialize Expo project + shared libraries

**Files:**
- Create: `mobile/` (Expo project)
- Create: `mobile/lib/api.ts`
- Create: `mobile/lib/progress.ts`
- Create: `mobile/lib/format.ts`
- Create: `mobile/constants/cities.ts`

- [ ] **Step 1: Create Expo project**

```bash
cd "/Users/harshitsingh/Downloads/Misc Projects/photobooth-crm"
npx create-expo-app mobile --template blank-typescript
cd mobile
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
npm install axios
npm install --save-dev jest @testing-library/react-native @testing-library/jest-native
```

- [ ] **Step 2: Configure Jest for mobile project**

Create `mobile/jest.config.js`:
```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ]
};
```

Also install jest-expo:
```bash
cd mobile && npm install --save-dev jest-expo
```

- [ ] **Step 3: Configure app.json for expo-router**

Edit `mobile/app.json` — set scheme and main:
```json
{
  "expo": {
    "name": "Photobooth CRM",
    "slug": "photobooth-crm",
    "version": "1.0.0",
    "scheme": "photobooth-crm",
    "main": "expo-router/entry",
    "android": {
      "package": "com.photoboothcrm.app"
    }
  }
}
```

- [ ] **Step 3: Create eas.json**

Create `mobile/eas.json`:
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

- [ ] **Step 4: Create mobile .gitignore**

Create `mobile/.gitignore`:
```
node_modules/
.env
.expo/
```

- [ ] **Step 5: Create API client**

Create `mobile/lib/api.ts`:
```ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3000',
  timeout: 10000,
});

export default api;
```

Create `mobile/.env` (not committed):
```
EXPO_PUBLIC_BACKEND_URL=https://your-render-app.onrender.com
```

- [ ] **Step 5: Write progress test**

Create `mobile/__tests__/progress.test.ts`:
```ts
import { calcProgress } from '../lib/progress';

test('empty event scores 0', () => {
  expect(calcProgress({})).toBe(0);
});

test('fully filled event scores 9', () => {
  expect(calcProgress({
    city: 'Delhi',
    event_date: '2026-06-01',
    client_name: 'Test',
    venue: 'Hotel',
    timing_from: '18:00',
    timing_to: '22:00',
    photobooth_type: 'Mirror Booth',
    package: 'Premium',
    event_team: [{ team_members: { name: 'Ravi' } }],
    template_status: 'done',
  })).toBe(9);
});

test('partial event scores correctly', () => {
  expect(calcProgress({ city: 'Mumbai', client_name: 'Test', event_date: '2026-07-01' })).toBe(3);
});
```

- [ ] **Step 6: Run test to confirm fail**

```bash
cd mobile && npx jest __tests__/progress.test.ts
```
Expected: FAIL

- [ ] **Step 7: Implement progress.ts**

Create `mobile/lib/progress.ts`:
```ts
export function calcProgress(event: Record<string, any>): number {
  let score = 0;
  if (event.city) score++;
  if (event.event_date) score++;
  if (event.client_name) score++;
  if (event.venue) score++;
  if (event.timing_from && event.timing_to) score++;
  if (event.photobooth_type) score++;
  if (event.package) score++;
  if (event.event_team && event.event_team.length > 0) score++;
  if (event.template_status === 'done') score++;
  return score;
}
```

- [ ] **Step 8: Run test**

```bash
cd mobile && npx jest __tests__/progress.test.ts
```
Expected: All 3 PASS

- [ ] **Step 9: Create format.ts and constants**

Create `mobile/lib/format.ts`:
```ts
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(timeStr: string | null): string {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(parseInt(h), parseInt(m));
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}
```

Create `mobile/constants/cities.ts`:
```ts
export const CITIES = ['Delhi', 'Mumbai', 'Nagpur', 'Hyderabad'] as const;
export type City = typeof CITIES[number];
```

- [ ] **Step 10: Commit**

```bash
git add mobile/
git commit -m "feat: expo project scaffold, api client, progress lib, constants"
```

---

## Chunk 5: Mobile App — Navigation + Events List

### Task 7: Tab navigation shell

**Files:**
- Create: `mobile/app/_layout.tsx`
- Create: `mobile/app/(tabs)/_layout.tsx`
- Create: `mobile/app/(tabs)/index.tsx` (shell)
- Create: `mobile/app/(tabs)/team.tsx` (shell)
- Create: `mobile/app/(tabs)/settings.tsx` (shell)

- [ ] **Step 1: Create root layout**

Create `mobile/app/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 2: Create tab layout**

Create `mobile/app/(tabs)/_layout.tsx`:
```tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#6C63FF', headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Events', tabBarIcon: ({ color }) => <Ionicons name="calendar" size={22} color={color} /> }} />
      <Tabs.Screen name="team" options={{ title: 'Team', tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Ionicons name="settings" size={22} color={color} /> }} />
    </Tabs>
  );
}
```

- [ ] **Step 3: Create shell screens**

Create `mobile/app/(tabs)/team.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function TeamScreen() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Team</Text></View>;
}
```

Create `mobile/app/(tabs)/settings.tsx`:
```tsx
import { View, Text } from 'react-native';
export default function SettingsScreen() {
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Settings</Text></View>;
}
```

- [ ] **Step 4: Verify app runs**

```bash
cd mobile && npx expo start
```
Expected: App opens in Expo Go, 3 tabs visible — Events, Team, Settings

- [ ] **Step 5: Commit**

```bash
git add mobile/app/
git commit -m "feat: tab navigation shell"
```

---

### Task 8: useEvents hook + EventCard + CityFilter

**Files:**
- Create: `mobile/hooks/useEvents.ts`
- Create: `mobile/components/EventCard.tsx`
- Create: `mobile/components/CityFilter.tsx`
- Create: `mobile/app/(tabs)/index.tsx`

- [ ] **Step 1: Create useEvents hook**

Create `mobile/hooks/useEvents.ts`:
```ts
import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export interface Event {
  id: string;
  status: 'soft_block' | 'confirmed';
  city: string;
  event_date: string | null;
  client_name: string | null;
  venue: string | null;
  timing_from: string | null;
  timing_to: string | null;
  poc_name: string | null;
  poc_number: string | null;
  photobooth_type: string | null;
  package: string | null;
  num_prints: number | null;
  template_status: 'not_started' | 'in_progress' | 'done';
  invoice_raised: boolean;
  payment_received: boolean;
  event_team: { team_members: { id: string; name: string } }[];
}

export function useEvents(city?: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = city && city !== 'All' ? { city } : {};
      const res = await api.get('/events', { params });
      setEvents(res.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const createEvent = async (payload: Partial<Event>) => {
    const res = await api.post('/events', payload);
    await loadEvents();
    return res.data;
  };

  const updateEvent = async (id: string, payload: Partial<Event>) => {
    await api.patch(`/events/${id}`, payload);
    await loadEvents();
  };

  const updateTeam = async (id: string, member_ids: string[]) => {
    await api.patch(`/events/${id}/team`, { member_ids });
    await loadEvents();
  };

  const deleteEvent = async (id: string) => {
    await api.delete(`/events/${id}`);
    await loadEvents();
  };

  return { events, loading, error, refetch: loadEvents, createEvent, updateEvent, updateTeam, deleteEvent };
}
```

- [ ] **Step 2: Create CityFilter component**

Create `mobile/components/CityFilter.tsx`:
```tsx
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { CITIES } from '../constants/cities';

interface Props {
  selected: string;
  onSelect: (city: string) => void;
}

export default function CityFilter({ selected, onSelect }: Props) {
  const options = ['All', ...CITIES];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {options.map(city => (
        <TouchableOpacity
          key={city}
          onPress={() => onSelect(city)}
          style={[styles.chip, selected === city && styles.chipActive]}
        >
          <Text style={[styles.chipText, selected === city && styles.chipTextActive]}>{city}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8 },
  chipActive: { backgroundColor: '#6C63FF' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
});
```

- [ ] **Step 3: Create EventCard component**

Create `mobile/components/EventCard.tsx`:
```tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Event } from '../hooks/useEvents';
import { calcProgress } from '../lib/progress';
import { formatDate } from '../lib/format';

interface Props {
  event: Event;
  onPress: () => void;
}

export default function EventCard({ event, onPress }: Props) {
  const progress = calcProgress(event);
  const pct = progress / 9;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.name}>{event.client_name || 'Unnamed Event'}</Text>
        <View style={[styles.badge, event.status === 'confirmed' ? styles.badgeConfirmed : styles.badgeSoft]}>
          <Text style={styles.badgeText}>{event.status === 'confirmed' ? 'Confirmed' : 'Soft Block'}</Text>
        </View>
      </View>
      <Text style={styles.sub}>{formatDate(event.event_date)} · {event.city}</Text>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>{progress}/9 fields</Text>
        <View style={styles.checks}>
          <Text style={[styles.checkDot, event.invoice_raised && styles.checkDotActive]}>INV</Text>
          <Text style={[styles.checkDot, event.payment_received && styles.checkDotActive]}>PAY</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '600', color: '#111', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeConfirmed: { backgroundColor: '#E6F9EE' },
  badgeSoft: { backgroundColor: '#FFF3E0' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#555' },
  sub: { fontSize: 12, color: '#888', marginBottom: 10 },
  progressBg: { height: 4, backgroundColor: '#EFEFEF', borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, backgroundColor: '#6C63FF', borderRadius: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 11, color: '#AAA' },
  checks: { flexDirection: 'row', gap: 6 },
  checkDot: { fontSize: 11, color: '#DDD', fontWeight: '700' },
  checkDotActive: { color: '#4CAF50' },
});
```

- [ ] **Step 4: Implement Events tab**

Create `mobile/app/(tabs)/index.tsx`:
```tsx
import React, { useState } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CityFilter from '../../components/CityFilter';
import EventCard from '../../components/EventCard';
import AddEventModal from '../../components/AddEventModal';
import { useEvents, Event } from '../../hooks/useEvents';

export default function EventsScreen() {
  const [city, setCity] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const { events, loading, createEvent, refetch } = useEvents(city);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = events.filter(e => !e.event_date || e.event_date >= today);
  const past = events.filter(e => e.event_date && e.event_date < today);
  const [showPast, setShowPast] = useState(false);

  const renderItem = ({ item }: { item: Event }) => (
    <EventCard event={item} onPress={() => router.push(`/event/${item.id}`)} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Events</Text>
      <CityFilter selected={city} onSelect={setCity} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#6C63FF" />
      ) : (
        <FlatList
          data={showPast ? [...upcoming, ...past] : upcoming}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No events yet — tap + to add one</Text>}
          ListFooterComponent={
            past.length > 0 ? (
              <TouchableOpacity style={styles.pastToggle} onPress={() => setShowPast(p => !p)}>
                <Text style={styles.pastToggleText}>{showPast ? 'Hide past events' : `Show ${past.length} past event(s)`}</Text>
              </TouchableOpacity>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
      <AddEventModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={async (payload) => {
          const created = await createEvent(payload);
          setShowAdd(false);
          router.push(`/event/${created.id}`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  title: { fontSize: 24, fontWeight: '700', paddingHorizontal: 16, paddingTop: 8, color: '#111' },
  empty: { textAlign: 'center', color: '#AAA', marginTop: 60, fontSize: 14 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center', elevation: 6 },
  pastToggle: { alignItems: 'center', paddingVertical: 16 },
  pastToggleText: { color: '#6C63FF', fontSize: 13 },
});
```

- [ ] **Step 5: Commit**

```bash
git add mobile/hooks/ mobile/components/EventCard.tsx mobile/components/CityFilter.tsx mobile/app/(tabs)/index.tsx
git commit -m "feat: events list with city filter, event cards, progress bar"
```

---

## Chunk 6: Mobile App — Add Event + Event Detail

### Task 9: AddEventModal

**Files:**
- Create: `mobile/components/AddEventModal.tsx`

- [ ] **Step 1: Install date/time picker**

```bash
cd mobile && npx expo install @react-native-community/datetimepicker
```

- [ ] **Step 2: Create AddEventModal**

Create `mobile/components/AddEventModal.tsx`:
```tsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { CITIES } from '../constants/cities';
import RNDateTimePicker from '@react-native-community/datetimepicker';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}

export default function AddEventModal({ visible, onClose, onSave }: Props) {
  const [status, setStatus] = useState<'soft_block' | 'confirmed'>('soft_block');
  const [city, setCity] = useState('Delhi');
  const [clientName, setClientName] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = clientName.trim().length > 0 && date !== null;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await onSave({ status, city, client_name: clientName.trim(), event_date: date!.toISOString().split('T')[0] });
    setSaving(false);
    setClientName(''); setDate(null); setStatus('soft_block'); setCity('Delhi');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>New Event</Text>

          <Text style={styles.label}>Status</Text>
          <View style={styles.toggle}>
            {(['soft_block', 'confirmed'] as const).map(s => (
              <TouchableOpacity key={s} style={[styles.toggleOpt, status === s && styles.toggleActive]} onPress={() => setStatus(s)}>
                <Text style={[styles.toggleText, status === s && styles.toggleTextActive]}>{s === 'soft_block' ? 'Soft Block' : 'Confirmed'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>City</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {CITIES.map(c => (
              <TouchableOpacity key={c} style={[styles.chip, city === c && styles.chipActive]} onPress={() => setCity(c)}>
                <Text style={[styles.chipText, city === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Client Name *</Text>
          <TextInput style={styles.input} value={clientName} onChangeText={setClientName} placeholder="Enter client name" />

          <Text style={styles.label}>Event Date *</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
            <Text style={{ color: date ? '#111' : '#AAA' }}>{date ? date.toDateString() : 'Select date'}</Text>
          </TouchableOpacity>
          {showPicker && (
            <RNDateTimePicker mode="date" value={date || new Date()} onChange={(_, d) => { setShowPicker(false); if (d) setDate(d); }} />
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}><Text style={styles.btnCancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnSave, !canSave && styles.btnDisabled]} onPress={handleSave} disabled={!canSave || saving}>
              <Text style={styles.btnSaveText}>{saving ? 'Saving...' : 'Create Event'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 15 },
  toggle: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  toggleOpt: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center' },
  toggleActive: { backgroundColor: '#6C63FF' },
  toggleText: { fontSize: 13, color: '#555' },
  toggleTextActive: { color: '#fff', fontWeight: '600' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8 },
  chipActive: { backgroundColor: '#6C63FF' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#F0F0F0', alignItems: 'center' },
  btnCancelText: { color: '#555', fontWeight: '600' },
  btnSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#6C63FF', alignItems: 'center' },
  btnDisabled: { backgroundColor: '#C5C2F0' },
  btnSaveText: { color: '#fff', fontWeight: '700' },
});
```

- [ ] **Step 3: Commit**

```bash
git add mobile/components/AddEventModal.tsx mobile/package.json
git commit -m "feat: add event modal with status/city/date/client name"
```

---

### Task 10: CustomDropdown + FieldRow + TeamChecklist

**Files:**
- Create: `mobile/components/CustomDropdown.tsx`
- Create: `mobile/components/FieldRow.tsx`
- Create: `mobile/components/TeamChecklist.tsx`
- Create: `mobile/hooks/useDropdownOptions.ts`
- Create: `mobile/hooks/useTeam.ts`

- [ ] **Step 1: useDropdownOptions hook**

Create `mobile/hooks/useDropdownOptions.ts`:
```ts
import { useState, useEffect } from 'react';
import api from '../lib/api';

export function useDropdownOptions(fieldName: string) {
  const [options, setOptions] = useState<string[]>([]);

  const loadData = async () => {
    const res = await api.get(`/dropdown/${fieldName}`);
    setOptions(res.data);
  };

  useEffect(() => { loadData(); }, [fieldName]);

  const addOption = async (value: string) => {
    await api.post(`/dropdown/${fieldName}`, { value });
    await loadData();
  };

  return { options, addOption, refetch: loadData };
}
```

- [ ] **Step 2: useTeam hook**

Create `mobile/hooks/useTeam.ts`:
```ts
import { useState, useEffect } from 'react';
import api from '../lib/api';

export interface TeamMember { id: string; name: string; phone_number: string | null; archived: boolean; }

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);

  const loadData = async () => {
    const res = await api.get('/team');
    setMembers(res.data);
  };

  useEffect(() => { loadData(); }, []);

  const addMember = async (name: string, phone_number?: string) => {
    await api.post('/team', { name, phone_number });
    await loadData();
  };

  const archiveMember = async (id: string) => {
    await api.patch(`/team/${id}/archive`);
    await loadData();
  };

  return { members, addMember, archiveMember, refetch: loadData };
}
```

- [ ] **Step 3: Create CustomDropdown**

Create `mobile/components/CustomDropdown.tsx`:
```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  label: string;
  value: string | null;
  options: string[];
  onSelect: (v: string) => void;
  onAddCustom: (v: string) => Promise<void>;
}

export default function CustomDropdown({ label, value, options, onSelect, onAddCustom }: Props) {
  const [open, setOpen] = useState(false);
  const [customText, setCustomText] = useState('');

  const handleAdd = async () => {
    if (!customText.trim()) return;
    await onAddCustom(customText.trim());
    onSelect(customText.trim());
    setCustomText('');
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.row} onPress={() => setOpen(true)}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.right}>
          <Text style={[styles.value, !value && styles.placeholder]}>{value || 'Select...'}</Text>
          <Ionicons name="chevron-down" size={16} color="#AAA" />
        </View>
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.heading}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.option} onPress={() => { onSelect(item); setOpen(false); }}>
                  <Text style={[styles.optionText, value === item && styles.optionSelected]}>{item}</Text>
                  {value === item && <Ionicons name="checkmark" size={16} color="#6C63FF" />}
                </TouchableOpacity>
              )}
            />
            <View style={styles.customRow}>
              <TextInput style={styles.customInput} value={customText} onChangeText={setCustomText} placeholder="Add custom option..." />
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  label: { fontSize: 14, color: '#555', fontWeight: '500' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { fontSize: 14, color: '#111' },
  placeholder: { color: '#BBB' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' },
  heading: { fontSize: 17, fontWeight: '700', marginBottom: 16 },
  option: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  optionText: { fontSize: 15, color: '#333' },
  optionSelected: { color: '#6C63FF', fontWeight: '600' },
  customRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  customInput: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 10, padding: 10, fontSize: 14 },
  addBtn: { backgroundColor: '#6C63FF', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' },
});
```

- [ ] **Step 4: Create FieldRow**

Create `mobile/components/FieldRow.tsx`:
```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Linking } from 'react-native';

interface Props {
  label: string;
  value: string | null;
  onSave: (v: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
  isPhone?: boolean;
}

export default function FieldRow({ label, value, onSave, keyboardType = 'default', isPhone = false }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value || '');

  const handleBlur = () => { setEditing(false); if (text !== value) onSave(text); };

  if (editing) {
    return (
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <TextInput style={styles.input} value={text} onChangeText={setText} onBlur={handleBlur} autoFocus keyboardType={keyboardType} returnKeyType="done" onSubmitEditing={handleBlur} />
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.row} onPress={() => { setText(value || ''); setEditing(true); }}>
      <Text style={styles.label}>{label}</Text>
      {isPhone && value ? (
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${value}`)}>
          <Text style={styles.phoneValue}>{value}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.value, !value && styles.placeholder]}>{value || 'Tap to edit'}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  label: { fontSize: 14, color: '#555', fontWeight: '500', flex: 1 },
  value: { fontSize: 14, color: '#111', flex: 2, textAlign: 'right' },
  phoneValue: { fontSize: 14, color: '#6C63FF', flex: 2, textAlign: 'right', textDecorationLine: 'underline' },
  placeholder: { color: '#BBB' },
  input: { fontSize: 14, color: '#111', flex: 2, textAlign: 'right', borderBottomWidth: 1, borderBottomColor: '#6C63FF', paddingVertical: 0 },
});
```

- [ ] **Step 5: Create TeamChecklist**

Create `mobile/components/TeamChecklist.tsx`:
```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { TeamMember } from '../hooks/useTeam';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  label: string;
  members: TeamMember[];
  selectedIds: string[];
  onSave: (ids: string[]) => void;
}

export default function TeamChecklist({ label, members, selectedIds, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(selectedIds);

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleSave = () => { onSave(selected); setOpen(false); };

  const names = members.filter(m => selectedIds.includes(m.id)).map(m => m.name).join(', ');

  return (
    <>
      <TouchableOpacity style={styles.row} onPress={() => { setSelected(selectedIds); setOpen(true); }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, !names && styles.placeholder]}>{names || 'Assign team'}</Text>
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.heading}>Assign Team</Text>
            <FlatList
              data={members}
              keyExtractor={m => m.id}
              renderItem={({ item }) => {
                const checked = selected.includes(item.id);
                return (
                  <TouchableOpacity style={styles.member} onPress={() => toggle(item.id)}>
                    <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                      {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View>
                      <Text style={styles.memberName}>{item.name}</Text>
                      {item.phone_number && <Text style={styles.memberPhone}>{item.phone_number}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.empty}>No team members yet. Add some in the Team tab.</Text>}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  label: { fontSize: 14, color: '#555', fontWeight: '500' },
  value: { fontSize: 14, color: '#111', flex: 1, textAlign: 'right' },
  placeholder: { color: '#BBB' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' },
  heading: { fontSize: 17, fontWeight: '700', marginBottom: 16 },
  member: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  memberName: { fontSize: 15, color: '#111', fontWeight: '500' },
  memberPhone: { fontSize: 12, color: '#AAA', marginTop: 1 },
  empty: { color: '#AAA', textAlign: 'center', paddingVertical: 24, fontSize: 13 },
  saveBtn: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
```

- [ ] **Step 6: Commit**

```bash
git add mobile/components/ mobile/hooks/
git commit -m "feat: CustomDropdown, FieldRow, TeamChecklist, useTeam, useDropdownOptions"
```

---

### Task 11: Event Detail screen

**Files:**
- Create: `mobile/app/event/[id].tsx`

- [ ] **Step 1: Create Event Detail screen**

Create `mobile/app/event/[id].tsx`:
```tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import { Event } from '../../hooks/useEvents';
import { useTeam } from '../../hooks/useTeam';
import { useDropdownOptions } from '../../hooks/useDropdownOptions';
import FieldRow from '../../components/FieldRow';
import CustomDropdown from '../../components/CustomDropdown';
import TeamChecklist from '../../components/TeamChecklist';
import { CITIES } from '../../constants/cities';
import { formatDate, formatTime } from '../../lib/format';
import RNDateTimePicker from '@react-native-community/datetimepicker';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const { members } = useTeam();
  const { options: photoboothOptions, addOption: addPhotoboothOption } = useDropdownOptions('photobooth_type');
  const { options: packageOptions, addOption: addPackageOption } = useDropdownOptions('package');

  const load = async () => {
    setLoading(true);
    const res = await api.get(`/events/${id}`);
    setEvent(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const update = async (patch: Partial<Event>) => {
    await api.patch(`/events/${id}`, patch);
    setEvent(e => e ? { ...e, ...patch } : e);
  };

  const updateTeam = async (memberIds: string[]) => {
    await api.patch(`/events/${id}/team`, { member_ids: memberIds });
    await load();
  };

  const sendToBoss = async () => {
    setSending(true);
    try {
      await api.post('/notify/send-to-boss', { event_id: id });
      Alert.alert('Sent!', 'Summary sent to boss on Telegram.');
    } catch {
      Alert.alert('Error', 'Could not send. Check Telegram settings.');
    } finally { setSending(false); }
  };

  if (loading || !event) return <ActivityIndicator style={{ flex: 1 }} color="#6C63FF" />;

  const selectedTeamIds = event.event_team?.map(t => t.team_members?.id).filter(Boolean) as string[] || [];

  const templateOptions = ['not_started', 'in_progress', 'done'];
  const templateLabels: Record<string, string> = { not_started: 'Not Started', in_progress: 'In Progress', done: 'Done' };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{event.client_name || 'Event Detail'}</Text>
        <TouchableOpacity style={styles.bossBtn} onPress={sendToBoss} disabled={sending}>
          <Ionicons name="paper-plane" size={18} color="#fff" />
          <Text style={styles.bossBtnText}>{sending ? '...' : 'Boss'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Enquiry */}
        <Text style={styles.section}>Enquiry</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Status</Text>
            <View style={styles.toggle}>
              {(['soft_block', 'confirmed'] as const).map(s => (
                <TouchableOpacity key={s} style={[styles.toggleOpt, event.status === s && styles.toggleActive]} onPress={() => update({ status: s })}>
                  <Text style={[styles.toggleText, event.status === s && styles.toggleTextActive]}>{s === 'soft_block' ? 'Soft Block' : 'Confirmed'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>City</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CITIES.map(c => (
                <TouchableOpacity key={c} style={[styles.chip, event.city === c && styles.chipActive]} onPress={() => update({ city: c })}>
                  <Text style={[styles.chipText, event.city === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Event Details */}
        <Text style={styles.section}>Event Details</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.fieldRow} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.fieldLabel}>Date</Text>
            <Text style={[styles.fieldValue, !event.event_date && styles.placeholder]}>{formatDate(event.event_date)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <RNDateTimePicker mode="date" value={event.event_date ? new Date(event.event_date + 'T00:00:00') : new Date()} onChange={(_, d) => { setShowDatePicker(false); if (d) update({ event_date: d.toISOString().split('T')[0] }); }} />
          )}
          <FieldRow label="Client Name" value={event.client_name} onSave={v => update({ client_name: v })} />
          <FieldRow label="Venue" value={event.venue} onSave={v => update({ venue: v })} />
          <TouchableOpacity style={styles.fieldRow} onPress={() => setShowFromPicker(true)}>
            <Text style={styles.fieldLabel}>From</Text>
            <Text style={[styles.fieldValue, !event.timing_from && styles.placeholder]}>{formatTime(event.timing_from)}</Text>
          </TouchableOpacity>
          {showFromPicker && (
            <RNDateTimePicker mode="time" value={new Date()} onChange={(_, d) => { setShowFromPicker(false); if (d) update({ timing_from: `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}` }); }} />
          )}
          <TouchableOpacity style={styles.fieldRow} onPress={() => setShowToPicker(true)}>
            <Text style={styles.fieldLabel}>To</Text>
            <Text style={[styles.fieldValue, !event.timing_to && styles.placeholder]}>{formatTime(event.timing_to)}</Text>
          </TouchableOpacity>
          {showToPicker && (
            <RNDateTimePicker mode="time" value={new Date()} onChange={(_, d) => { setShowToPicker(false); if (d) update({ timing_to: `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}` }); }} />
          )}
        </View>

        {/* Point of Contact */}
        <Text style={styles.section}>Point of Contact</Text>
        <View style={styles.card}>
          <FieldRow label="Name" value={event.poc_name} onSave={v => update({ poc_name: v })} />
          <FieldRow label="Number" value={event.poc_number} onSave={v => update({ poc_number: v })} keyboardType="phone-pad" isPhone />
        </View>

        {/* Setup */}
        <Text style={styles.section}>Setup</Text>
        <View style={styles.card}>
          <CustomDropdown label="Photobooth Type" value={event.photobooth_type} options={photoboothOptions} onSelect={v => update({ photobooth_type: v })} onAddCustom={addPhotoboothOption} />
          <CustomDropdown label="Package" value={event.package} options={packageOptions} onSelect={v => update({ package: v })} onAddCustom={addPackageOption} />
          <FieldRow label="No. of Prints" value={event.num_prints?.toString() || null} onSave={v => update({ num_prints: parseInt(v) || null })} keyboardType="numeric" />
        </View>

        {/* Execution */}
        <Text style={styles.section}>Execution</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Template Status</Text>
            <View style={styles.toggle}>
              {templateOptions.map(s => (
                <TouchableOpacity key={s} style={[styles.toggleOpt, event.template_status === s && styles.toggleActive]} onPress={() => update({ template_status: s as any })}>
                  <Text style={[styles.toggleText, event.template_status === s && styles.toggleTextActive]}>{templateLabels[s]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TeamChecklist label="Team" members={members} selectedIds={selectedTeamIds} onSave={updateTeam} />
        </View>

        {/* Financials */}
        <Text style={styles.section}>Financials</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>Invoice Raised</Text>
            <Switch value={event.invoice_raised} onValueChange={v => update({ invoice_raised: v })} trackColor={{ true: '#6C63FF' }} />
          </View>
          <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>Payment Received</Text>
            <Switch value={event.payment_received} onValueChange={v => update({ payment_received: v })} trackColor={{ true: '#4CAF50' }} />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  back: { marginRight: 10 },
  title: { flex: 1, fontSize: 17, fontWeight: '600', color: '#111' },
  bossBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6C63FF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, gap: 5 },
  bossBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  scroll: { padding: 16, paddingBottom: 60 },
  section: { fontSize: 11, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, marginBottom: 4 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  fieldLabel: { fontSize: 14, color: '#555', fontWeight: '500', flex: 1 },
  fieldValue: { fontSize: 14, color: '#111', textAlign: 'right' },
  placeholder: { color: '#BBB' },
  toggle: { flexDirection: 'row', gap: 6 },
  toggleOpt: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#F0F0F0' },
  toggleActive: { backgroundColor: '#6C63FF' },
  toggleText: { fontSize: 12, color: '#555' },
  toggleTextActive: { color: '#fff', fontWeight: '600' },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 6 },
  chipActive: { backgroundColor: '#6C63FF' },
  chipText: { fontSize: 12, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/event/
git commit -m "feat: event detail screen with all fields, auto-save, send to boss"
```

---

## Chunk 7: Team Tab + Settings Tab + APK Build

### Task 12: Team tab

**Files:**
- Modify: `mobile/app/(tabs)/team.tsx`

- [ ] **Step 1: Implement Team tab**

Replace contents of `mobile/app/(tabs)/team.tsx`:
```tsx
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTeam, TeamMember } from '../../hooks/useTeam';

export default function TeamScreen() {
  const { members, addMember, archiveMember } = useTeam();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await addMember(name.trim(), phone.trim() || undefined);
    setName(''); setPhone(''); setShowAdd(false); setSaving(false);
  };

  const handleArchive = (member: TeamMember) => {
    Alert.alert('Archive Member', `Remove ${member.name} from active team?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => archiveMember(member.id) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={members}
        keyExtractor={m => m.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              {item.phone_number && <Text style={styles.phone}>{item.phone_number}</Text>}
            </View>
            <TouchableOpacity onPress={() => handleArchive(item)} style={styles.archiveBtn}>
              <Ionicons name="archive-outline" size={18} color="#CCC" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No team members yet. Tap + to add one.</Text>}
        contentContainerStyle={{ padding: 16 }}
      />

      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Add Team Member</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name *" />
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone number (optional)" keyboardType="phone-pad" />
            <View style={styles.actions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setShowAdd(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btnSave, !name.trim() && styles.btnDisabled]} onPress={handleAdd} disabled={!name.trim() || saving}>
                <Text style={styles.btnSaveText}>{saving ? 'Adding...' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '700', color: '#111' },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6C63FF22', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 17, fontWeight: '700', color: '#6C63FF' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111' },
  phone: { fontSize: 12, color: '#AAA', marginTop: 2 },
  archiveBtn: { padding: 6 },
  empty: { textAlign: 'center', color: '#AAA', marginTop: 60, fontSize: 14 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 15 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnCancel: { flex: 1, padding: 13, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center' },
  btnSave: { flex: 1, padding: 13, borderRadius: 10, backgroundColor: '#6C63FF', alignItems: 'center' },
  btnDisabled: { backgroundColor: '#C5C2F0' },
  btnSaveText: { color: '#fff', fontWeight: '700' },
});
```

- [ ] **Step 2: Commit**

```bash
git add mobile/app/(tabs)/team.tsx
git commit -m "feat: team tab with add and archive"
```

---

### Task 13: Settings tab

**Files:**
- Modify: `mobile/app/(tabs)/settings.tsx`
- Create: `mobile/hooks/useSettings.ts`

- [ ] **Step 1: Create useSettings hook**

Create `mobile/hooks/useSettings.ts`:
```ts
import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export interface Settings {
  user_telegram_chat_id: string;
  boss_telegram_chat_id: string;
  briefing_time: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({ user_telegram_chat_id: '', boss_telegram_chat_id: '', briefing_time: '09:00' });

  const loadSettings = useCallback(async () => {
    const res = await api.get('/settings');
    setSettings(s => ({ ...s, ...res.data }));
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const save = async (patch: Partial<Settings>) => {
    await api.patch('/settings', patch);
    setSettings(s => ({ ...s, ...patch }));
  };

  return { settings, save };
}
```

- [ ] **Step 2: Implement Settings tab**

Replace `mobile/app/(tabs)/settings.tsx`:
```tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useSettings } from '../../hooks/useSettings';

export default function SettingsScreen() {
  const { settings, save } = useSettings();
  const [userChatId, setUserChatId] = useState('');
  const [bossChatId, setBossChatId] = useState('');
  const [briefingTime, setBriefingTime] = useState('');

  React.useEffect(() => {
    setUserChatId(settings.user_telegram_chat_id || '');
    setBossChatId(settings.boss_telegram_chat_id || '');
    setBriefingTime(settings.briefing_time || '09:00');
  }, [settings]);

  const handleSave = async () => {
    await save({ user_telegram_chat_id: userChatId, boss_telegram_chat_id: bossChatId, briefing_time: briefingTime });
    Alert.alert('Saved', 'Settings updated.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.section}>Telegram</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Your Telegram Chat ID</Text>
          <TextInput style={styles.input} value={userChatId} onChangeText={setUserChatId} placeholder="e.g. 123456789" keyboardType="numeric" />
          <Text style={styles.hint}>Message @userinfobot on Telegram to get your chat ID.</Text>

          <Text style={[styles.label, { marginTop: 16 }]}>Boss's Telegram Chat ID</Text>
          <TextInput style={styles.input} value={bossChatId} onChangeText={setBossChatId} placeholder="e.g. 987654321" keyboardType="numeric" />
          <Text style={styles.hint}>Boss must start a chat with the bot first.</Text>
        </View>

        <Text style={styles.section}>Daily Briefing</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Briefing Time (IST, 24h format)</Text>
          <TextInput style={styles.input} value={briefingTime} onChangeText={setBriefingTime} placeholder="09:00" />
          <Text style={styles.hint}>Update cron-job.org to match this time in IST.</Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </TouchableOpacity>

        <Text style={styles.version}>v{Constants.expoConfig?.version || '1.0.0'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scroll: { padding: 16, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 20 },
  section: { fontSize: 11, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4, marginTop: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 4 },
  hint: { fontSize: 11, color: '#BBB', marginTop: 2 },
  saveBtn: { backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  version: { textAlign: 'center', color: '#CCC', fontSize: 12, marginTop: 32 },
});
```

- [ ] **Step 3: Commit**

```bash
git add mobile/app/(tabs)/settings.tsx mobile/hooks/useSettings.ts
git commit -m "feat: settings tab with telegram chat IDs and briefing time"
```

---

### Task 14: APK Build + cron-job.org setup

**Files:**
- No code changes — configuration steps

- [ ] **Step 1: Install EAS CLI and log in**

```bash
npm install -g eas-cli
eas login
```
Use your Expo account credentials.

- [ ] **Step 2: Configure EAS project**

```bash
cd mobile && eas build:configure
```
When prompted, select Android. This updates `app.json` with the EAS project ID.

- [ ] **Step 3: Set backend URL as EAS secret**

```bash
eas secret:create --scope project --name EXPO_PUBLIC_BACKEND_URL --value https://your-render-app.onrender.com
```
Replace with your actual Render URL.

- [ ] **Step 4: Build APK**

```bash
eas build --platform android --profile preview
```
This runs in the cloud (~10 minutes). When done, download the `.apk` file from the EAS dashboard.

- [ ] **Step 5: Install on her phone**

1. Send the `.apk` file to her via Telegram or WhatsApp
2. She opens it on her Android phone
3. If prompted, enable "Install from unknown sources" (Settings → Security)
4. Install — done

- [ ] **Step 6: Deploy backend to Render**

1. Push code to GitHub
2. Create new Web Service on render.com → connect GitHub repo → set root dir to `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `TELEGRAM_BOT_TOKEN`
6. Deploy. Note the `.onrender.com` URL.

- [ ] **Step 7: Set up cron-job.org**

1. Go to cron-job.org → Create cronjob
2. URL: `https://your-render-app.onrender.com/notify/briefing`
3. Method: POST
4. Schedule: Daily at 03:30 UTC (= 09:00 IST)
5. Save and enable

- [ ] **Step 8: Set up Telegram bot**

1. Message @BotFather on Telegram → `/newbot` → follow prompts → copy token
2. Set `TELEGRAM_BOT_TOKEN` in Render environment variables
3. She messages the bot once (to activate her chat)
4. Boss messages the bot once (to activate boss chat)
5. Both message @userinfobot to get their chat IDs
6. Enter chat IDs in the app Settings tab → Save

- [ ] **Step 9: Final commit**

```bash
git add mobile/eas.json mobile/app.json
git commit -m "feat: EAS build config"
```
