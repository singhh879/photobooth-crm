import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { CITIES } from '../constants/cities';
import RNDateTimePicker from '@react-native-community/datetimepicker';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}

export default function AddEventModal({ visible, onClose, onSave }: Props) {
  const [status, setStatus] = useState<'soft_block' | 'confirmed'>('soft_block');
  const [city, setCity] = useState('Delhi');
  const [clientName, setClientName] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const canSave = clientName.trim().length > 0 && date !== null;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    await onSave({ status, city, client_name: clientName.trim(), event_date: date!.toISOString().split('T')[0] });
    setSaving(false);
    setClientName(''); setDate(null); setStatus('soft_block'); setCity('Delhi');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>New Event</Text>

          <Text style={styles.label}>Status</Text>
          <View style={styles.toggle}>
            {(['soft_block', 'confirmed'] as const).map(s => (
              <TouchableOpacity key={s} style={[styles.toggleOpt, status === s && styles.toggleActive]} onPress={() => setStatus(s)}>
                <Text style={[styles.toggleText, status === s && styles.toggleTextActive]}>{s === 'soft_block' ? 'Soft Block' : 'Confirmed'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>City</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {CITIES.map(c => (
              <TouchableOpacity key={c} style={[styles.chip, city === c && styles.chipActive]} onPress={() => setCity(c)}>
                <Text style={[styles.chipText, city === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>Client Name *</Text>
          <TextInput style={styles.input} value={clientName} onChangeText={setClientName} placeholder="Enter client name" />

          <Text style={styles.label}>Event Date *</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)}>
            <Text style={{ color: date ? '#111' : '#AAA' }}>{date ? date.toDateString() : 'Select date'}</Text>
          </TouchableOpacity>
          {showPicker && (
            <RNDateTimePicker mode="date" value={date || new Date()} onChange={(_, d) => { setShowPicker(false); if (d) setDate(d); }} />
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}><Text style={styles.btnCancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnSave, !canSave && styles.btnDisabled]} onPress={handleSave} disabled={!canSave || saving}>
              <Text style={styles.btnSaveText}>{saving ? 'Saving...' : 'Create Event'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 15 },
  toggle: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  toggleOpt: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center' },
  toggleActive: { backgroundColor: '#6C63FF' },
  toggleText: { fontSize: 13, color: '#555' },
  toggleTextActive: { color: '#fff', fontWeight: '600' },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8 },
  chipActive: { backgroundColor: '#6C63FF' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btnCancel: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#F0F0F0', alignItems: 'center' },
  btnCancelText: { color: '#555', fontWeight: '600' },
  btnSave: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#6C63FF', alignItems: 'center' },
  btnDisabled: { backgroundColor: '#C5C2F0' },
  btnSaveText: { color: '#fff', fontWeight: '700' },
});
