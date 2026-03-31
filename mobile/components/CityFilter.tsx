import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { CITIES } from '../constants/cities';

interface Props {
  selected: string;
  onSelect: (city: string) => void;
}

export default function CityFilter({ selected, onSelect }: Props) {
  const options = ['All', ...CITIES];
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {options.map(city => (
        <TouchableOpacity
          key={city}
          onPress={() => onSelect(city)}
          style={[styles.chip, selected === city && styles.chipActive]}
        >
          <Text style={[styles.chipText, selected === city && styles.chipTextActive]}>{city}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F0F0F0', marginRight: 8 },
  chipActive: { backgroundColor: '#22C55E' },
  chipText: { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
});
