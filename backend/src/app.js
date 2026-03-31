const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.get('/debug', async (req, res) => {
  const url = process.env.SUPABASE_URL;
  const keySet = !!process.env.SUPABASE_SERVICE_KEY;
  let supabaseReachable = false;
  let supabaseError = null;
  try {
    const r = await fetch(`${url}/rest/v1/settings?select=key&limit=1`, {
      headers: { apikey: process.env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}` }
    });
    supabaseReachable = r.ok;
    if (!r.ok) supabaseError = await r.text();
  } catch (e) {
    supabaseError = e.message;
  }
  res.json({ supabase_url: url, service_key_set: keySet, supabase_reachable: supabaseReachable, supabase_error: supabaseError });
});

app.use('/events', require('./routes/events'));
app.use('/team', require('./routes/team'));
app.use('/dropdown', require('./routes/dropdown'));
app.use('/settings', require('./routes/settings'));
app.use('/notify', require('./routes/notify'));

app.use(errorHandler);

module.exports = app;
