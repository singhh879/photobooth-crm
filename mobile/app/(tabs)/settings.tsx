import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useSettings } from '../../hooks/useSettings';

export default function SettingsScreen() {
  const { settings, save } = useSettings();
  const [userChatId, setUserChatId] = useState('');
  const [briefingTime, setBriefingTime] = useState('');

  React.useEffect(() => {
    setUserChatId(settings.user_telegram_chat_id || '');
    setBriefingTime(settings.briefing_time || '09:00');
  }, [settings]);

  const handleSave = async () => {
    await save({ user_telegram_chat_id: userChatId, briefing_time: briefingTime });
    Alert.alert('Saved', 'Settings updated.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>

        <Text style={styles.section}>Telegram</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Your Telegram Chat ID</Text>
          <TextInput style={styles.input} value={userChatId} onChangeText={setUserChatId} placeholder="e.g. 123456789" keyboardType="numeric" />
          <Text style={styles.hint}>Message @userinfobot on Telegram to get your chat ID.</Text>

        </View>

        <Text style={styles.section}>Daily Briefing</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Briefing Time (IST, 24h format)</Text>
          <TextInput style={styles.input} value={briefingTime} onChangeText={setBriefingTime} placeholder="09:00" />
          <Text style={styles.hint}>Update cron-job.org to match this time in IST.</Text>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </TouchableOpacity>

        <Text style={styles.version}>v{Constants.expoConfig?.version || '1.0.0'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scroll: { padding: 16, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 20 },
  section: { fontSize: 11, fontWeight: '700', color: '#AAA', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4, marginTop: 16 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 4 },
  hint: { fontSize: 11, color: '#BBB', marginTop: 2 },
  saveBtn: { backgroundColor: '#6C63FF', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  version: { textAlign: 'center', color: '#CCC', fontSize: 12, marginTop: 32 },
});
