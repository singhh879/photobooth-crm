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
