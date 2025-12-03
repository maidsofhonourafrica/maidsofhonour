import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { createStyles } from '@/theme/createStyles';
import { useVerifyOtp, useSendOtp } from '@/hooks/useAuthQueries';

const useStyles = createStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: theme.fonts.bold,
    color: theme.text,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.muted,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  otpInput: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold,
  },
  timerContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
  },
  resendText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold,
    color: theme.primary,
  },
  verifyButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.primary,
  },
  verifyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: theme.fonts.bold,
  },
}));

export default function OTP() {
  const router = useRouter();
  const params = useLocalSearchParams<{ identifier?: string }>();
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [timer, setTimer] = useState(60);
  const styles = useStyles();
  
  const verifyOtpMutation = useVerifyOtp();
  const sendOtpMutation = useSendOtp();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join('');
    
    if (code.length !== 4) {
      Alert.alert('Error', 'Please enter the complete 4-digit code');
      return;
    }

    if (!params.identifier) {
      Alert.alert('Error', 'Phone number not found. Please go back and try again.');
      return;
    }

    verifyOtpMutation.mutate({
      identifier: params.identifier,
      code,
    });
  };

  const handleResend = () => {
    if (!params.identifier) {
      Alert.alert('Error', 'Phone number not found');
      return;
    }

    sendOtpMutation.mutate(
      {
        identifier: params.identifier,
        type: 'login',
      },
      {
        onSuccess: () => {
          setTimer(60);
          setOtp(['', '', '', '']);
        },
      }
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={styles.title.color} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Verification Code</Text>
            <Text style={styles.subtitle}>
              We have sent the verification code to your phone number
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.otpInput,
                  {
                    color: styles.title.color,
                    borderColor: digit ? styles.verifyButton.backgroundColor : styles.subtitle.color,
                    backgroundColor: styles.container.backgroundColor,
                  }
                ]}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
                    inputRefs.current[index - 1]?.focus();
                  }
                }}
              />
            ))}
          </View>

          <View style={styles.timerContainer}>
            {timer > 0 ? (
              <Text style={[styles.timerText, { color: styles.subtitle.color }]}>
                Resend code in <Text style={{ color: styles.verifyButton.backgroundColor }}>{timer}s</Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={sendOtpMutation.isPending}>
                <Text style={styles.resendText}>
                  {sendOtpMutation.isPending ? 'Sending...' : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={styles.verifyButton}
            onPress={handleVerify}
            disabled={verifyOtpMutation.isPending}
          >
            {verifyOtpMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.verifyButtonText}>Verify</Text>
            )}
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
