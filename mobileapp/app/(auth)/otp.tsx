import { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useVerifyOtp } from '@/hooks/useAuthQueries';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function OTP() {
  const router = useRouter();
  const { phone, role } = useLocalSearchParams(); // 'phone' param now holds identifier (email or phone)
  const colorScheme = useColorScheme();
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  
  const verifyOtpMutation = useVerifyOtp();
  const loading = verifyOtpMutation.isPending;

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

    verifyOtpMutation.mutate(
      {
        identifier: phone as string,
        code,
        role: role as string
      },
      {
        onSuccess: () => {
          // Navigation is handled by AuthContext useEffect or manually here if preferred
          // But AuthContext handles redirection based on user state
        }
      }
    );
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="auto" />
      <SafeAreaView className="flex-1 p-8 pt-12">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full border border-border items-center justify-center mb-8 bg-card"
        >
          <Feather name="arrow-left" size={20} color={Colors[colorScheme ?? 'light'].text} />
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-foreground mb-2 font-sans">Verify Code</Text>
        <Text className="text-muted-foreground mb-8 font-sans">
          We sent a code to <Text className="text-foreground font-bold">{phone}</Text>.
        </Text>

        <View className="flex-row justify-between gap-3 mb-8">
          {[0, 1, 2, 3].map((i) => (
            <TextInput
              key={i}
              ref={(ref) => { inputRefs.current[i] = ref; }}
              className="w-14 h-16 rounded-xl border-2 border-border bg-muted text-center text-2xl font-bold text-foreground focus:border-primary focus:bg-primary/5 font-sans"
              keyboardType="number-pad"
              maxLength={1}
              value={otp[i]}
              onChangeText={(text) => handleOtpChange(text, i)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
                  inputRefs.current[i - 1]?.focus();
                }
              }}
            />
          ))}
        </View>

        <Text className="text-center text-sm text-muted-foreground mb-8 font-sans">
          Didn't receive code? <Text className="text-primary font-bold">Resend (30s)</Text>
        </Text>

        <TouchableOpacity 
          onPress={handleVerify}
          disabled={loading}
          className={`w-full bg-primary py-4 rounded-xl mb-6 items-center ${loading ? 'opacity-70' : ''}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-primary-foreground font-bold font-sans">Verify</Text>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}
