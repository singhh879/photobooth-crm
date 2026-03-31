import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import db from '../../lib/supabase';
import { Event } from '../../hooks/useEvents';
import { useTeam } from '../../hooks/useTeam';
import { useDropdownOptions } from '../../hooks/useDropdownOptions';
import FieldRow from '../../components/FieldRow';
import CustomDropdown from '../../components/CustomDropdown';
import TeamChecklist from '../../components/TeamChecklist';
import { CITIES } from '../../constants/cities';
import { formatDate, formatTime } from '../../lib/format';
import RNDateTimePicker from '@react-native-community/datetimepicker';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const { members } = useTeam();
  const { options: photoboothOptions, addOption: addPhotoboothOption } = useDropdownOptions('photobooth_type');
  const { options: packageOptions, addOption: addPackageOption } = useDropdownOptions('package');

  const loadEvent = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await db.get(`/events?id=eq.${id}&select=*,event_team(team_member_id,team_members(id,name))&limit=1`);
      setEvent(data?.[0] || null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadEvent(); }, [loadEvent]);

  const update = async (patch: Partial<Event>) => {
    await db.patch(`/events?id=eq.${id}`, patch);
    setEvent(e => e ? { ...e, ...patch } : e);
  };

  const updateTeam = async (memberIds: string[]) => {
    await db.delete(`/event_team?event_id=eq.${id}`);
    if (memberIds.length > 0) {
      const rows = memberIds.map(mid => ({ event_id: id, team_member_id: mid }));
      await db.post('/event_team', rows);
    }
    await loadEvent();
  };

  if (loading || !event) return <ActivityIndicator style={{ flex: 1 }} color="#22C55E" />;

  const selectedTeamIds = event.event_team?.map(t => t.team_members?.id).filter(Boolean) as string[] || [];

  const templateOptions = ['not_started', 'in_progress', 'done'];
  const templateLabels: Record<string, string> = { not_started: 'Not Started', in_progress: 'In Progress', done: 'Done' };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{event.client_name || 'Event Detail'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        <Text style={styles.section}>Enquiry</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>Status</Text>
            <View style={styles.toggle}>
              {(['soft_block', 'confirmed'] as const).map(s => (
                <TouchableOpacity key={s} style={[styles.toggleOpt, event.status === s && styles.toggleActive]} onPress={() => update({ status: s })}>
                  <Text style={[styles.toggleText, event.status === s && styles.toggleTextActive]}>{s === 'soft_block' ? 'Soft Block' : 'Confirmed'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.fieldLabel}>City</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CITIES.map(c => (
                <TouchableOpacity key={c} style={[styles.chip, event.city === c && styles.chipActive]} onPress={() => update({ city: c })}>
                  <Text style={[styles.chipText, event.city === c && styles.chipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <Text style={styles.section}>Event Details</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.fieldRow} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.fieldLabel}>Date</Text>
            <Text style={[styles.fieldValue, !event.event_date && styles.placeholder]}>{formatDate(event.event_date)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <RNDateTimePicker mode="date" value={event.event_date ? new Date(event.event_date + 'T00:00:00') : new Date()} onChange={(_, d) => { setShowDatePicker(false); if (d) update({ event_date: d.toISOString().split('T')[0] }); }} />
          )}
          <FieldRow label="Client Name" value={event.client_name} onSave={v => update({ client_name: v })} />
          <FieldRow label="Venue" value={event.venue} onSave={v => update({ venue: v })} />
          <TouchableOpacity style={styles.fieldRow} onPress={() => setShowFromPicker(true)}>
            <Text style={styles.fieldLabel}>From</Text>
            <Text style={[styles.fieldValue, !event.timing_from && styles.placeholder]}>{formatTime(event.timing_from)}</Text>
          </TouchableOpacity>
          {showFromPicker && (
            <RNDateTimePicker mode="time" value={new Date()} onChange={(_, d) => { setShowFromPicker(false); if (d) update({ timing_from: `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}` }); }} />
          )}
          <TouchableOpacity style={styles.fieldRow} onPress={() => setShowToPicker(true)}>
            <Text style={styles.fieldLabel}>To</Text>
            <Text style={[styles.fieldValue, !event.timing_to && styles.placeholder]}>{formatTime(event.timing_to)}</Text>
          </TouchableOpacity>
          {showToPicker && (
            <RNDateTimePicker mode="time" value={new Date()} onChange={(_, d) => { setShowToPicker(false); if (d) update({ timing_to: `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}` }); }} />
          )}
        </View>

        <Text style={styles.section}>Point of Contact</Text>
        <View style={styles.card}>
          <FieldRow label="Name" value={event.poc_name} onSave={v => update({ poc_name: v })} />
          <FieldRow label="Number" value={event.poc_number} onSave={v => update({ poc_number: v })} keyboardType="phone-pad" isPhone />
        </View>

        <Text style={styles.section}>Setup</Text>
        <View style={styles.card}>
          <CustomDropdown label="Photobooth Type" value={event.photobooth_type} options={photoboothOptions} onSelect={v => update({ photobooth_type: v })} onAddCustom={addPhotoboothOption} />
          <CustomDropdown label="Package" value={event.package} options={packageOptions} onSelect={v => update({ package: v })} onAddCustom={addPackageOption} />
          <FieldRow label="No. of Prints" value={event.num_prints?.toString() || null} onSave={v => update({ num_prints: parseInt(v) || null })} keyboardType="numeric" />
        </View>

        <Text style={styles.section}>Execution</Text>
        <View style={styles.card}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Template Status</Text>
            <View style={styles.toggle}>
              {templateOptions.map(s => (
                <TouchableOpacity key={s} style={[styles.toggleOpt, event.template_status === s && styles.toggleActive]} onPress={() => update({ template_status: s as any })}>
                  <Text style={[styles.toggleText, event.template_status === s && styles.toggleTextActive]}>{templateLabels[s]}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TeamChecklist label="Team" members={members.filter(m => !m.archived)} selectedIds={selectedTeamIds} onSave={updateTeam} />
        </View>

        <Text style={styles.section}>Financials</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.fieldLabel}>Invoice Raised</Text>
            <Switch value={event.invoice_raised} onValueChange={v => update({ invoice_raised: v })} trackColor={{ true: '#22C55E' }} />
          </View>
          <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.fieldLabel}>Payment Received</Text>
            <Switch value={event.payment_received} onValueChange={v => update({ payment_received: v })} trackColor={{ true: '#4CAF50' }} />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EEE' },
  back: { marginRight: 10 },
  title: { flex: 1, fontSize: 17, fontWeight: '600', color: '#111' },
  scroll: { padding: 16, paddingBottom: 60 },
  section: { fontSize: 11, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 16, marginBottom: 4 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  fieldLabel: { fontSize: 14, color: '#555', fontWeight: '500', flex: 1 },
  fieldValue: { fontSize: 14, color: '#111', textAlign: 'right' },
  placeholder: { color: '#BBB' },
  toggle: { flexDirection: 'row', gap: 6 },
  toggleOpt: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#F0F0F0' },
  toggleActive: { backgroundColor: '#22C55E' },
  toggleText: { fontSize: 12, color: '#555' },
  toggleTextActive: { color: '#fff', fontWeight: '600' },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: '#F0F0F0', marginRight: 6 },
  chipActive: { backgroundColor: '#22C55E' },
  chipText: { fontSize: 12, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
});
