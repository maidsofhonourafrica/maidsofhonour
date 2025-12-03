import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { createStyles } from '@/theme/createStyles';
import { useSendOtp } from '@/hooks/useAuthQueries';

type Props = {
  onSwitchToEmail: () => void;
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
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  prefixContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    backgroundColor: theme.muted + '20',
    borderColor: theme.border,
  },
  prefixText: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.text,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
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

export default function PhoneLogin({ onSwitchToEmail }: Props) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const styles = useStyles();
  const sendOtpMutation = useSendOtp();

  const handleContinue = () => {
    // Validate phone number
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    // Format phone number (add 254 prefix)
    const formattedPhone = phoneNumber.startsWith('254') 
      ? phoneNumber 
      : `254${phoneNumber.replace(/^0/, '')}`;

    // Send OTP via tRPC
    sendOtpMutation.mutate(
      {
        identifier: formattedPhone,
        type: 'login',
      },
      {
        onSuccess: () => {
          // Navigate to OTP screen
          router.push({
            pathname: '/(auth)/otp',
            params: { identifier: formattedPhone },
          });
        },
      }
    );
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
            style={[styles.toggleButton, styles.activeToggle]}
          >
            <Text style={[styles.toggleText, { color: styles.title.color }]}>
              Phone
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={onSwitchToEmail}
            style={styles.toggleButton}
          >
            <Text style={[styles.toggleText, { color: styles.subtitle.color }]}>
              Email
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Phone Number</Text>
        
        <View style={styles.inputRow}>
          <View style={styles.prefixContainer}>
            <Text style={styles.prefixText}>+254</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="712 345 678"
            keyboardType="phone-pad"
            placeholderTextColor={styles.subtitle.color}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        <TouchableOpacity 
          onPress={handleContinue}
          disabled={sendOtpMutation.isPending}
          style={[styles.continueButton, { opacity: sendOtpMutation.isPending ? 0.7 : 1 }]}
        >
          {sendOtpMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
