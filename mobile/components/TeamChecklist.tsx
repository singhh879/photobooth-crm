import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { TeamMember } from '../hooks/useTeam';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  label: string;
  members: TeamMember[];
  selectedIds: string[];
  onSave: (ids: string[]) => void;
}

export default function TeamChecklist({ label, members, selectedIds, onSave }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(selectedIds);

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleSave = () => { onSave(selected); setOpen(false); };

  const names = members.filter(m => selectedIds.includes(m.id)).map(m => m.name).join(', ');

  return (
    <>
      <TouchableOpacity style={styles.row} onPress={() => { setSelected(selectedIds); setOpen(true); }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, !names && styles.placeholder]}>{names || 'Assign team'}</Text>
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.heading}>Assign Team</Text>
            <FlatList
              data={members}
              keyExtractor={m => m.id}
              renderItem={({ item }) => {
                const checked = selected.includes(item.id);
                return (
                  <TouchableOpacity style={styles.member} onPress={() => toggle(item.id)}>
                    <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                      {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <View>
                      <Text style={styles.memberName}>{item.name}</Text>
                      {item.phone_number && <Text style={styles.memberPhone}>{item.phone_number}</Text>}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={<Text style={styles.empty}>No team members yet. Add some in the Team tab.</Text>}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  label: { fontSize: 14, color: '#555', fontWeight: '500' },
  value: { fontSize: 14, color: '#111', flex: 1, textAlign: 'right' },
  placeholder: { color: '#BBB' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' },
  heading: { fontSize: 17, fontWeight: '700', marginBottom: 16 },
  member: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#DDD', alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  memberName: { fontSize: 15, color: '#111', fontWeight: '500' },
  memberPhone: { fontSize: 12, color: '#AAA', marginTop: 1 },
  empty: { color: '#AAA', textAlign: 'center', paddingVertical: 24, fontSize: 13 },
  saveBtn: { backgroundColor: '#22C55E', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
