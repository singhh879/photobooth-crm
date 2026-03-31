import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTeam, TeamMember } from '../../hooks/useTeam';

export default function TeamScreen() {
  const { members, addMember, archiveMember } = useTeam();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await addMember(name.trim(), phone.trim() || undefined);
    setName(''); setPhone(''); setShowAdd(false); setSaving(false);
  };

  const handleArchive = (member: TeamMember) => {
    Alert.alert('Archive Member', `Remove ${member.name} from active team?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: () => archiveMember(member.id) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={members.filter(m => !m.archived)}
        keyExtractor={m => m.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name[0].toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              {item.phone_number && <Text style={styles.phone}>{item.phone_number}</Text>}
            </View>
            <TouchableOpacity onPress={() => handleArchive(item)} style={styles.archiveBtn}>
              <Ionicons name="archive-outline" size={18} color="#CCC" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No team members yet. Tap + to add one.</Text>}
        contentContainerStyle={{ padding: 16 }}
      />

      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Add Team Member</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name *" />
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone number (optional)" keyboardType="phone-pad" />
            <View style={styles.actions}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setShowAdd(false)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.btnSave, !name.trim() && styles.btnDisabled]} onPress={handleAdd} disabled={!name.trim() || saving}>
                <Text style={styles.btnSaveText}>{saving ? 'Adding...' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 24, fontWeight: '700', color: '#111' },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#6C63FF', alignItems: 'center', justifyContent: 'center' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6C63FF22', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 17, fontWeight: '700', color: '#6C63FF' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111' },
  phone: { fontSize: 12, color: '#AAA', marginTop: 2 },
  archiveBtn: { padding: 6 },
  empty: { textAlign: 'center', color: '#AAA', marginTop: 60, fontSize: 14 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 15 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btnCancel: { flex: 1, padding: 13, borderRadius: 10, backgroundColor: '#F0F0F0', alignItems: 'center' },
  btnSave: { flex: 1, padding: 13, borderRadius: 10, backgroundColor: '#6C63FF', alignItems: 'center' },
  btnDisabled: { backgroundColor: '#C5C2F0' },
  btnSaveText: { color: '#fff', fontWeight: '700' },
});
