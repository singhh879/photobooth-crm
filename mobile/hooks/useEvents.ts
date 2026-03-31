import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Event {
  id: string;
  status: 'soft_block' | 'confirmed';
  city: string;
  event_date: string | null;
  client_name: string | null;
  venue: string | null;
  timing_from: string | null;
  timing_to: string | null;
  poc_name: string | null;
  poc_number: string | null;
  photobooth_type: string | null;
  package: string | null;
  num_prints: number | null;
  template_status: 'not_started' | 'in_progress' | 'done';
  invoice_raised: boolean;
  payment_received: boolean;
  event_team: { team_members: { id: string; name: string } }[];
}

export function useEvents(city?: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('events')
        .select('*, event_team(team_member_id, team_members(id, name))')
        .order('event_date', { ascending: true });
      if (city && city !== 'All') query = query.eq('city', city);
      const { data, error: err } = await query;
      if (err) throw err;
      setEvents(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const createEvent = async (payload: Partial<Event>) => {
    const { data, error: err } = await supabase.from('events').insert(payload).select().single();
    if (err) throw err;
    await loadEvents();
    return data;
  };

  const updateEvent = async (id: string, payload: Partial<Event>) => {
    const { error: err } = await supabase.from('events').update(payload).eq('id', id);
    if (err) throw err;
    await loadEvents();
  };

  const updateTeam = async (id: string, member_ids: string[]) => {
    await supabase.from('event_team').delete().eq('event_id', id);
    if (member_ids.length > 0) {
      const rows = member_ids.map(mid => ({ event_id: id, team_member_id: mid }));
      const { error: insErr } = await supabase.from('event_team').insert(rows);
      if (insErr) throw insErr;
    }
    await loadEvents();
  };

  const deleteEvent = async (id: string) => {
    const { error: err } = await supabase.from('events').delete().eq('id', id);
    if (err) throw err;
    await loadEvents();
  };

  return { events, loading, error, refetch: loadEvents, createEvent, updateEvent, updateTeam, deleteEvent };
}
