import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TeamMember { id: string; name: string; phone_number: string | null; archived: boolean; }

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);

  const loadData = async () => {
    const { data } = await supabase.from('team_members').select('*').order('name');
    setMembers(data || []);
  };

  useEffect(() => { loadData(); }, []);

  const addMember = async (name: string, phone_number?: string) => {
    const { error } = await supabase.from('team_members').insert({ name, phone_number: phone_number || null, archived: false });
    if (error) throw error;
    await loadData();
  };

  const archiveMember = async (id: string) => {
    const { error } = await supabase.from('team_members').update({ archived: true }).eq('id', id);
    if (error) throw error;
    await loadData();
  };

  return { members, addMember, archiveMember, refetch: loadData };
}
