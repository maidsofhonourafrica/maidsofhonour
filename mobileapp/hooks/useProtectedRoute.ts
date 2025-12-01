import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export function useProtectedRoute() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    try {
      const inAuthGroup = segments[0] === '(auth)';
      
      if (!user && !inAuthGroup) {
        // Redirect to login if not authenticated and not in auth group
        // router.replace('/(auth)/role-selection'); 
      } else if (user && inAuthGroup) {
        // Redirect to appropriate dashboard if authenticated and in auth group
        if (user.userType === 'client') {
          router.replace('/(client)/(tabs)/home');
        } else if (user.userType === 'service_provider') {
          router.replace('/(sp)/(tabs)/dashboard');
        }
      }
    } catch (error) {
      // Navigation not ready yet, will retry on next render
      console.log('Navigation not ready yet');
    }
  }, [user, segments, isLoading, router]);
}
