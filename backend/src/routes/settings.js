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
