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
