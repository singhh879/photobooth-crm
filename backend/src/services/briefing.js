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
