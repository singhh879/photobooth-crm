import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

export interface Settings {
  user_telegram_chat_id: string;
  boss_telegram_chat_id: string;
  briefing_time: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>({ user_telegram_chat_id: '', boss_telegram_chat_id: '', briefing_time: '09:00' });

  const loadSettings = useCallback(async () => {
    const res = await api.get('/settings');
    setSettings(s => ({ ...s, ...res.data }));
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const save = async (patch: Partial<Settings>) => {
    await api.patch('/settings', patch);
    setSettings(s => ({ ...s, ...patch }));
  };

  return { settings, save };
}
