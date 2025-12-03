import { useSession } from '@/context/SessionContext';
import { Alert } from 'react-native';
import { trpc } from '@/lib/trpc';

/**
 * Hook for sending OTP via tRPC
 * Uses tRPC auth.sendOtp mutation
 */
export const useSendOtp = () => {
  return trpc.auth.sendOtp.useMutation({
    onSuccess: (data) => {
      console.log('✅ OTP sent successfully');
      // In development, log the code for easy testing
      if (data.devCode) {
        console.log('🔑 Dev OTP Code:', data.devCode);
      }
    },
    onError: (error) => {
      console.error('Send OTP Error:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP');
    },
  });
};

/**
 * Hook for verifying OTP via tRPC
 * Uses tRPC auth.verifyOtp mutation
 * Automatically signs in user on success
 */
export const useVerifyOtp = () => {
  const { signIn } = useSession();

  return trpc.auth.verifyOtp.useMutation({
    onSuccess: async (data) => {
      console.log('✅ OTP verified successfully');
      // Use the SessionProvider's signIn method
      signIn(data.token, data.user);
    },
    onError: (error) => {
      console.error('Verify OTP Error:', error);
      Alert.alert('Error', error.message || 'Invalid OTP');
    },
  });
};

/**
 * Hook for email/password login via tRPC
 * Uses tRPC auth.login mutation
 */
export const useLogin = () => {
  const { signIn } = useSession();

  return trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      console.log('✅ Login successful');
      signIn(data.token, data.user);
    },
    onError: (error) => {
      console.error('Login Error:', error);
      Alert.alert('Error', error.message || 'Login failed');
    },
  });
};

/**
 * Hook for user registration via tRPC
 * Uses tRPC auth.register mutation
 */
export const useRegister = () => {
  const { signIn } = useSession();

  return trpc.auth.register.useMutation({
    onSuccess: async (data) => {
      console.log('✅ Registration successful');
      signIn(data.token, data.user);
    },
    onError: (error) => {
      console.error('Registration Error:', error);
      Alert.alert('Error', error.message || 'Registration failed');
    },
  });
};
