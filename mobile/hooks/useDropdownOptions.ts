import { useState, useEffect } from 'react';
import db from '../lib/supabase';

export function useDropdownOptions(fieldName: string) {
  const [options, setOptions] = useState<string[]>([]);

  const loadData = async () => {
    const { data } = await db.get(`/dropdown_options?field_name=eq.${fieldName}&select=value&order=sort_order.asc`);
    setOptions((data || []).map((r: any) => r.value));
  };

  useEffect(() => { loadData(); }, [fieldName]);

  const addOption = async (value: string) => {
    await db.post('/dropdown_options', { field_name: fieldName, value });
    await loadData();
  };

  return { options, addOption, refetch: loadData };
}
