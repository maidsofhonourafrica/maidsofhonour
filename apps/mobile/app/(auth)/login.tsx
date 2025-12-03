import { useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import PhoneLogin from '@/components/auth/PhoneLogin';
import EmailLogin from '@/components/auth/EmailLogin';
import { createStyles } from '@/theme/createStyles';

type AuthMethod = 'phone' | 'email';

const useStyles = createStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
}));

export default function Login() {
  const { role } = useLocalSearchParams();
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.safeArea}>
        {authMethod === 'phone' ? (
          <PhoneLogin onSwitchToEmail={() => setAuthMethod('email')} />
        ) : (
          <EmailLogin onSwitchToPhone={() => setAuthMethod('phone')} />
        )}
      </SafeAreaView>
    </View>
  );
}
