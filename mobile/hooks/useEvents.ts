import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

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
      const params = city && city !== 'All' ? { city } : {};
      const res = await api.get('/events', { params });
      setEvents(res.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const createEvent = async (payload: Partial<Event>) => {
    const res = await api.post('/events', payload);
    await loadEvents();
    return res.data;
  };

  const updateEvent = async (id: string, payload: Partial<Event>) => {
    await api.patch(`/events/${id}`, payload);
    await loadEvents();
  };

  const updateTeam = async (id: string, member_ids: string[]) => {
    await api.patch(`/events/${id}/team`, { member_ids });
    await loadEvents();
  };

  const deleteEvent = async (id: string) => {
    await api.delete(`/events/${id}`);
    await loadEvents();
  };

  return { events, loading, error, refetch: loadEvents, createEvent, updateEvent, updateTeam, deleteEvent };
}
