import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { createStyles } from '@/theme/createStyles';

type Props = {
  onSwitchToPhone: () => void;
};

const useStyles = createStyles((theme) => ({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: theme.fonts.bold,
    color: theme.text,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
    fontFamily: theme.fonts.regular,
    color: theme.muted,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 32,
    borderRadius: 12,
    padding: 4,
    backgroundColor: theme.muted + '20',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: theme.card,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: theme.fonts.semibold,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontFamily: theme.fonts.medium,
    color: theme.muted,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    marginBottom: 24,
    fontFamily: theme.fonts.regular,
    backgroundColor: theme.muted + '20',
    borderColor: theme.border,
    color: theme.text,
  },
  continueButton: {
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
    backgroundColor: theme.primary,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold,
  },
}));

export default function EmailLogin({ onSwitchToPhone }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const styles = useStyles();

  const handleContinue = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/(client)/(tabs)/home');
    }, 1500);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            onPress={onSwitchToPhone}
            style={styles.toggleButton}
          >
            <Text style={[styles.toggleText, { color: styles.subtitle.color }]}>
              Phone
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, styles.activeToggle]}
          >
            <Text style={[styles.toggleText, { color: styles.title.color }]}>
              Email
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="john@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={styles.subtitle.color}
          value={email}
          onChangeText={setEmail}
        />

        <TouchableOpacity 
          onPress={handleContinue}
          disabled={loading}
          style={[styles.continueButton, { opacity: loading ? 0.7 : 1 }]}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
