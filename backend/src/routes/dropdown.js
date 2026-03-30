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
