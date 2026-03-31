import { useState, useEffect, useCallback } from 'react';
import db from '../lib/supabase';

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
      let url = '/events?select=*,event_team(team_member_id,team_members(id,name))&order=event_date.asc';
      if (city && city !== 'All') url += `&city=eq.${city}`;
      const { data } = await db.get(url);
      setEvents(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const createEvent = async (payload: Partial<Event>) => {
    const { data } = await db.post('/events', payload, { headers: { Prefer: 'return=representation' } });
    await loadEvents();
    return data[0];
  };

  const updateEvent = async (id: string, payload: Partial<Event>) => {
    await db.patch(`/events?id=eq.${id}`, payload);
    await loadEvents();
  };

  const updateTeam = async (id: string, member_ids: string[]) => {
    await db.delete(`/event_team?event_id=eq.${id}`);
    if (member_ids.length > 0) {
      const rows = member_ids.map(mid => ({ event_id: id, team_member_id: mid }));
      await db.post('/event_team', rows);
    }
    await loadEvents();
  };

  const deleteEvent = async (id: string) => {
    await db.delete(`/events?id=eq.${id}`);
    await loadEvents();
  };

  return { events, loading, error, refetch: loadEvents, createEvent, updateEvent, updateTeam, deleteEvent };
}
