import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Event } from '../hooks/useEvents';
import { calcProgress } from '../lib/progress';
import { formatDate } from '../lib/format';

interface Props {
  event: Event;
  onPress: () => void;
}

export default function EventCard({ event, onPress }: Props) {
  const progress = calcProgress(event);
  const pct = progress / 9;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.name}>{event.client_name || 'Unnamed Event'}</Text>
        <View style={[styles.badge, event.status === 'confirmed' ? styles.badgeConfirmed : styles.badgeSoft]}>
          <Text style={styles.badgeText}>{event.status === 'confirmed' ? 'Confirmed' : 'Soft Block'}</Text>
        </View>
      </View>
      <Text style={styles.sub}>{formatDate(event.event_date)} · {event.city}</Text>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>{progress}/9 fields</Text>
        <View style={styles.checks}>
          <Text style={[styles.checkDot, event.invoice_raised && styles.checkDotActive]}>INV</Text>
          <Text style={[styles.checkDot, event.payment_received && styles.checkDotActive]}>PAY</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '600', color: '#111', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeConfirmed: { backgroundColor: '#E6F9EE' },
  badgeSoft: { backgroundColor: '#FFF3E0' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#555' },
  sub: { fontSize: 12, color: '#888', marginBottom: 10 },
  progressBg: { height: 4, backgroundColor: '#EFEFEF', borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, backgroundColor: '#22C55E', borderRadius: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 11, color: '#AAA' },
  checks: { flexDirection: 'row', gap: 6 },
  checkDot: { fontSize: 11, color: '#DDD', fontWeight: '700' },
  checkDotActive: { color: '#4CAF50' },
});
