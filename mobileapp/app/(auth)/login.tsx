import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import PhoneLogin from '@/components/auth/PhoneLogin';
import EmailLogin from '@/components/auth/EmailLogin';

type AuthMethod = 'phone' | 'email';

export default function Login() {
  const { role } = useLocalSearchParams();
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="auto" />
      <SafeAreaView className="flex-1">
        {authMethod === 'phone' ? (
          <PhoneLogin 
            role={role as string}
            onSwitchToEmail={() => setAuthMethod('email')}
          />
        ) : (
          <EmailLogin 
            role={role as string}
            onSwitchToPhone={() => setAuthMethod('phone')}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
