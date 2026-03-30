import { useState, useEffect } from 'react';
import api from '../lib/api';

export function useDropdownOptions(fieldName: string) {
  const [options, setOptions] = useState<string[]>([]);

  const loadData = async () => {
    const res = await api.get(`/dropdown/${fieldName}`);
    setOptions(res.data);
  };

  useEffect(() => { loadData(); }, [fieldName]);

  const addOption = async (value: string) => {
    await api.post(`/dropdown/${fieldName}`, { value });
    await loadData();
  };

  return { options, addOption, refetch: loadData };
}
