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
