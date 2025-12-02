import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useSendOtp } from '@/hooks/useAuthQueries';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';

type Props = {
  role: string;
};

export default function PhoneLogin({ role }: Props) {
  const colorScheme = useColorScheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const sendOtpMutation = useSendOtp();
  const loading = sendOtpMutation.isPending;

  const handleContinue = () => {
    if (!phoneNumber || phoneNumber.length < 3) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;
    const fullPhone = `254${finalPhone}`;
    
    sendOtpMutation.mutate(
      { 
        identifier: fullPhone,
        type: 'login',
        role: role || 'client' 
      },
      {
        onSuccess: () => {
          router.push({
            pathname: '/(auth)/otp',
            params: { phone: fullPhone, role: role || 'client' }
          });
        }
      }
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 32 }}>
        {/* Back Button */}
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full border border-border items-center justify-center mb-8 bg-card"
        >
          <Feather name="arrow-left" size={20} color={Colors[colorScheme ?? 'light'].text} />
        </TouchableOpacity>

        <View className="w-12 h-12 bg-primary/10 rounded-xl items-center justify-center mb-6">
          <Feather name="log-in" size={24} color={Colors.light.primary} />
        </View>
        <Text className="text-3xl font-bold text-foreground mb-2 font-sans">Let's sign you in</Text>
        <Text className="text-muted-foreground mb-8 font-sans">
          Enter your phone number to continue as a {role || 'user'}.
        </Text>

        <Text className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide font-sans">
          Phone Number
        </Text>
        
        <View className="flex-row gap-3 mb-6">
          <View className="bg-muted border border-border rounded-xl px-4 py-3 flex-row items-center gap-2">
            <Text className="font-bold text-foreground font-sans">+254</Text>
          </View>
          <TextInput
            className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 font-bold text-foreground font-sans"
            placeholder="712 345 678"
            keyboardType="phone-pad"
            autoCapitalize="none"
            placeholderTextColor={Colors[colorScheme ?? 'light'].muted}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        <TouchableOpacity 
          onPress={handleContinue}
          disabled={loading}
          className={`w-full bg-primary py-4 rounded-xl shadow-lg shadow-primary/30 mb-6 items-center ${loading ? 'opacity-70' : ''}`}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-primary-foreground font-bold font-sans">Continue</Text>
          )}
        </TouchableOpacity>

        <View className="flex-row py-5 items-center">
          <View className="flex-1 border-t border-border" />
          <Text className="mx-4 text-muted-foreground text-xs font-sans">Or continue with</Text>
          <View className="flex-1 border-t border-border" />
        </View>

        <View className="flex-row gap-4 justify-center">
          <TouchableOpacity className="w-14 h-14 rounded-full border border-border items-center justify-center bg-card">
            <Text className="font-bold text-lg text-foreground">G</Text>
          </TouchableOpacity>
          <TouchableOpacity className="w-14 h-14 rounded-full border border-border items-center justify-center bg-card">
             <FontAwesome name="apple" size={24} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
