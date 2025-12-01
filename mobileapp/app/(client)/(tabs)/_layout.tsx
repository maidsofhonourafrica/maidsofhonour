import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function ClientTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#CF2680' }}>
      <Tabs.Screen 
        name="home" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="search" 
        options={{ 
          title: 'Search',
          tabBarIcon: ({ color }) => <Feather name="search" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="bookings" 
        options={{ 
          title: 'Bookings',
          tabBarIcon: ({ color }) => <Feather name="calendar" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color }) => <Feather name="user" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}
