import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Linking } from 'react-native';

interface Props {
  label: string;
  value: string | null;
  onSave: (v: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
  isPhone?: boolean;
}

export default function FieldRow({ label, value, onSave, keyboardType = 'default', isPhone = false }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value || '');

  const handleBlur = () => { setEditing(false); if (text !== value) onSave(text); };

  if (editing) {
    return (
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <TextInput style={styles.input} value={text} onChangeText={setText} onBlur={handleBlur} autoFocus keyboardType={keyboardType} returnKeyType="done" onSubmitEditing={handleBlur} />
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.row} onPress={() => { setText(value || ''); setEditing(true); }}>
      <Text style={styles.label}>{label}</Text>
      {isPhone && value ? (
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${value}`)}>
          <Text style={styles.phoneValue}>{value}</Text>
        </TouchableOpacity>
      ) : (
        <Text style={[styles.value, !value && styles.placeholder]}>{value || 'Tap to edit'}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  label: { fontSize: 14, color: '#555', fontWeight: '500', flex: 1 },
  value: { fontSize: 14, color: '#111', flex: 2, textAlign: 'right' },
  phoneValue: { fontSize: 14, color: '#22C55E', flex: 2, textAlign: 'right', textDecorationLine: 'underline' },
  placeholder: { color: '#BBB' },
  input: { fontSize: 14, color: '#111', flex: 2, textAlign: 'right', borderBottomWidth: 1, borderBottomColor: '#22C55E', paddingVertical: 0 },
});
