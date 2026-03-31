import { useState, useEffect } from 'react';
import db from '../lib/supabase';

export interface TeamMember { id: string; name: string; phone_number: string | null; archived: boolean; }

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);

  const loadData = async () => {
    const { data } = await db.get('/team_members?select=*&order=name.asc');
    setMembers(data || []);
  };

  useEffect(() => { loadData(); }, []);

  const addMember = async (name: string, phone_number?: string) => {
    await db.post('/team_members', { name, phone_number: phone_number || null, archived: false });
    await loadData();
  };

  const archiveMember = async (id: string) => {
    await db.patch(`/team_members?id=eq.${id}`, { archived: true });
    await loadData();
  };

  return { members, addMember, archiveMember, refetch: loadData };
}
