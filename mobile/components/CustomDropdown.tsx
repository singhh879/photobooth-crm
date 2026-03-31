import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  label: string;
  value: string | null;
  options: string[];
  onSelect: (v: string) => void;
  onAddCustom: (v: string) => Promise<void>;
}

export default function CustomDropdown({ label, value, options, onSelect, onAddCustom }: Props) {
  const [open, setOpen] = useState(false);
  const [customText, setCustomText] = useState('');

  const handleAdd = async () => {
    if (!customText.trim()) return;
    await onAddCustom(customText.trim());
    onSelect(customText.trim());
    setCustomText('');
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.row} onPress={() => setOpen(true)}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.right}>
          <Text style={[styles.value, !value && styles.placeholder]}>{value || 'Select...'}</Text>
          <Ionicons name="chevron-down" size={16} color="#AAA" />
        </View>
      </TouchableOpacity>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.heading}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={i => i}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.option} onPress={() => { onSelect(item); setOpen(false); }}>
                  <Text style={[styles.optionText, value === item && styles.optionSelected]}>{item}</Text>
                  {value === item && <Ionicons name="checkmark" size={16} color="#22C55E" />}
                </TouchableOpacity>
              )}
            />
            <View style={styles.customRow}>
              <TextInput style={styles.customInput} value={customText} onChangeText={setCustomText} placeholder="Add custom option..." />
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Text style={styles.addBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  label: { fontSize: 14, color: '#555', fontWeight: '500' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  value: { fontSize: 14, color: '#111' },
  placeholder: { color: '#BBB' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' },
  heading: { fontSize: 17, fontWeight: '700', marginBottom: 16 },
  option: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  optionText: { fontSize: 15, color: '#333' },
  optionSelected: { color: '#22C55E', fontWeight: '600' },
  customRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  customInput: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 10, padding: 10, fontSize: 14 },
  addBtn: { backgroundColor: '#22C55E', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '700' },
});
