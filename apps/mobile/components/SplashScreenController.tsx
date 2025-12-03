import { SplashScreen } from 'expo-router';
import { useSession } from '@/context/SessionContext';

SplashScreen.preventAutoHideAsync();

export function SplashScreenController() {
  const { isLoading } = useSession();

  if (!isLoading) {
    SplashScreen.hideAsync();
  }

  return null;
}
