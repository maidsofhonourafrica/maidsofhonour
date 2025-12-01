import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function SPTabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#CF2680' }}>
      <Tabs.Screen 
        name="dashboard" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="jobs" 
        options={{ 
          title: 'Jobs',
          tabBarIcon: ({ color }) => <Feather name="briefcase" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="training" 
        options={{ 
          title: 'Training',
          tabBarIcon: ({ color }) => <Feather name="book-open" size={24} color={color} />
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
