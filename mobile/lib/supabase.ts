import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://icfnwhfaoqikuijirnc.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_HVOGtuQs84VhKv0UHROTSQ_3PVPiQS9';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
