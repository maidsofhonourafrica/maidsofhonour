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

export default function EmailLogin({ role }: Props) {
  const colorScheme = useColorScheme();
  const [email, setEmail] = useState('');
  
  const sendOtpMutation = useSendOtp();
  const loading = sendOtpMutation.isPending;

  const handleContinue = () => {
    if (!email || email.length < 3 || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    sendOtpMutation.mutate(
      { 
        identifier: email,
        type: 'login',
        role: role || 'client' 
      },
      {
        onSuccess: () => {
          router.push({
            pathname: '/(auth)/otp',
            params: { phone: email, role: role || 'client' }
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
          Enter your email to continue as a {role || 'user'}.
        </Text>

        <Text className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide font-sans">
          Email Address
        </Text>
        
        <View className="flex-row gap-3 mb-6">
          <TextInput
            className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 font-bold text-foreground font-sans"
            placeholder="john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor={Colors[colorScheme ?? 'light'].muted}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <TouchableOpacity 
          onPress={handleContinue}
          disabled={loading}
          className={`w-full bg-primary py-4 rounded-xl mb-6 items-center ${loading ? 'opacity-70' : ''}`}
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
