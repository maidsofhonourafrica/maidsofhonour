import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import PhoneLogin from '@/components/auth/PhoneLogin';
import EmailLogin from '@/components/auth/EmailLogin';
import AuthMethodToggle from '@/components/auth/AuthMethodToggle';

type AuthMethod = 'phone' | 'email';

export default function Login() {
  const { role } = useLocalSearchParams();
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="auto" />
      <SafeAreaView className="flex-1">
        <AuthMethodToggle 
          currentMethod={authMethod}
          onMethodChange={setAuthMethod}
        />
        
        {authMethod === 'phone' ? (
          <PhoneLogin role={role as string} />
        ) : (
          <EmailLogin role={role as string} />
        )}
      </SafeAreaView>
    </View>
  );
}
