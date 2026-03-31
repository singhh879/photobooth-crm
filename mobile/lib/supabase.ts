import axios from 'axios';

const SUPABASE_URL = 'https://icfnwhfaoqikuiijirnc.supabase.co/rest/v1';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljZm53aGZhb3Fpa3VpaWppcm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4ODE1NzMsImV4cCI6MjA5MDQ1NzU3M30.v871l5QGBjOWZrU73LNIZT5ZBa5GAgQj-T4vL97yubg';

const db = axios.create({
  baseURL: SUPABASE_URL,
  headers: {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  },
});

export default db;
