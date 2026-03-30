require('dotenv').config();
const supabase = require('../src/db/client');

test('can query dropdown_options table', async () => {
  const { data, error } = await supabase.from('dropdown_options').select('*');
  expect(error).toBeNull();
  expect(Array.isArray(data)).toBe(true);
  expect(data.length).toBeGreaterThan(0);
});
