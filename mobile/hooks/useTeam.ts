import { useState, useEffect } from 'react';
import api from '../lib/api';

export interface TeamMember { id: string; name: string; phone_number: string | null; archived: boolean; }

export function useTeam() {
  const [members, setMembers] = useState<TeamMember[]>([]);

  const loadData = async () => {
    const res = await api.get('/team');
    setMembers(res.data);
  };

  useEffect(() => { loadData(); }, []);

  const addMember = async (name: string, phone_number?: string) => {
    await api.post('/team', { name, phone_number });
    await loadData();
  };

  const archiveMember = async (id: string) => {
    await api.patch(`/team/${id}/archive`);
    await loadData();
  };

  return { members, addMember, archiveMember, refetch: loadData };
}
