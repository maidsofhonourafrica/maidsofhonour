import { useMutation } from '@tanstack/react-query';
import apiClient from '@/api/client';
import { useSession } from '@/context/SessionContext';
import { Alert } from 'react-native';

type SendOtpParams = {
  identifier: string;
  type: 'login' | 'register';
  role?: string;
};

type VerifyOtpParams = {
  identifier: string;
  code: string;
  role?: string;
};

type AuthResponse = {
  user: {
    id: string;
    email: string;
    phoneNumber: string;
    userType: 'client' | 'service_provider' | 'admin';
  };
  token: string;
};

export const useSendOtp = () => {
  return useMutation({
    mutationFn: async (data: SendOtpParams) => {
      const response = await apiClient.post('/auth/otp/send', data);
      return response.data;
    },
    onError: (error: any) => {
      console.error('Send OTP Error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to send OTP');
    },
  });
};

export const useVerifyOtp = () => {
  const { signIn } = useSession();

  return useMutation({
    mutationFn: async (data: VerifyOtpParams) => {
      const response = await apiClient.post<AuthResponse>('/auth/otp/verify', data);
      return response.data;
    },
    onSuccess: async (data) => {
      // Use the SessionProvider's signIn method
      signIn(data.token, data.user);
    },
    onError: (error: any) => {
      console.error('Verify OTP Error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Invalid OTP');
    },
  });
};
