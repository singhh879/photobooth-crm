import axios from 'axios';

const SUPABASE_URL = 'https://icfnwhfaoqikuijirnc.supabase.co/rest/v1';
const SUPABASE_KEY = 'sb_publishable_HVOGtuQs84VhKv0UHROTSQ_3PVPiQS9';

const db = axios.create({
  baseURL: SUPABASE_URL,
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  },
});

export default db;
