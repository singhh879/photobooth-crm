import { useState, useEffect, useCallback } from 'react';
import db from '../lib/supabase';

export interface Settings {
  user_telegram_chat_id: string;
  briefing_time: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({ user_telegram_chat_id: '', briefing_time: '09:00' });

  const loadSettings = useCallback(async () => {
    const { data } = await db.get('/settings?select=*');
    if (data) {
      const cfg: any = {};
      data.forEach((row: any) => { cfg[row.key] = row.value; });
      setSettings(s => ({ ...s, ...cfg }));
    }
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const save = async (patch: Partial<Settings>) => {
    const upserts = Object.entries(patch).map(([key, value]) => ({ key, value }));
    await db.post('/settings', upserts, { headers: { Prefer: 'resolution=merge-duplicates' } });
    setSettings(s => ({ ...s, ...patch }));
  };

  return { settings, save };
}
