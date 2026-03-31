import React, { useState } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CityFilter from '../../components/CityFilter';
import EventCard from '../../components/EventCard';
import AddEventModal from '../../components/AddEventModal';
import { useEvents, Event } from '../../hooks/useEvents';

export default function EventsScreen() {
  const [city, setCity] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const { events, loading, createEvent } = useEvents(city);

  const today = new Date().toISOString().split('T')[0];
  const upcoming = events.filter(e => !e.event_date || e.event_date >= today);
  const past = events.filter(e => e.event_date && e.event_date < today);
  const [showPast, setShowPast] = useState(false);

  const renderItem = ({ item }: { item: Event }) => (
    <EventCard event={item} onPress={() => router.push(`/event/${item.id}`)} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Events</Text>
      <CityFilter selected={city} onSelect={setCity} />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#22C55E" />
      ) : (
        <FlatList
          data={showPast ? [...upcoming, ...past] : upcoming}
          keyExtractor={i => i.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.empty}>No events yet — tap + to add one</Text>}
          ListFooterComponent={
            past.length > 0 ? (
              <TouchableOpacity style={styles.pastToggle} onPress={() => setShowPast(p => !p)}>
                <Text style={styles.pastToggleText}>{showPast ? 'Hide past events' : `Show ${past.length} past event(s)`}</Text>
              </TouchableOpacity>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
      <AddEventModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={async (payload) => {
          const created = await createEvent(payload);
          setShowAdd(false);
          router.push(`/event/${created.id}`);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  title: { fontSize: 24, fontWeight: '700', paddingHorizontal: 16, paddingTop: 8, color: '#111' },
  empty: { textAlign: 'center', color: '#AAA', marginTop: 60, fontSize: 14 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center', elevation: 6 },
  pastToggle: { alignItems: 'center', paddingVertical: 16 },
  pastToggleText: { color: '#22C55E', fontSize: 13 },
});
