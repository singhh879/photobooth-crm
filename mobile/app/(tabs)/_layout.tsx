import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#22C55E', headerShown: false }}>
      <Tabs.Screen name="index" options={{ title: 'Events', tabBarIcon: ({ color }) => <Ionicons name="calendar" size={22} color={color} /> }} />
      <Tabs.Screen name="team" options={{ title: 'Team', tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Ionicons name="settings" size={22} color={color} /> }} />
    </Tabs>
  );
}
