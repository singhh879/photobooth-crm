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
