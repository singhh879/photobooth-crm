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
