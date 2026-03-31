import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useDropdownOptions(fieldName: string) {
  const [options, setOptions] = useState<string[]>([]);

  const loadData = async () => {
    const { data } = await supabase.from('dropdown_options').select('value').eq('field_name', fieldName).order('sort_order');
    setOptions((data || []).map((r: any) => r.value));
  };

  useEffect(() => { loadData(); }, [fieldName]);

  const addOption = async (value: string) => {
    const { error } = await supabase.from('dropdown_options').insert({ field_name: fieldName, value });
    if (error) throw error;
    await loadData();
  };

  return { options, addOption, refetch: loadData };
}
