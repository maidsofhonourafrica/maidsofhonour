import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeContext';

export default function ClientTabsLayout() {
  const theme = useTheme();

  return (
    <Tabs screenOptions={{ 
      headerShown: false, 
      tabBarActiveTintColor: theme.primary,
      tabBarStyle: {
        backgroundColor: theme.background,
        borderTopColor: theme.border,
      }
    }}>
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
