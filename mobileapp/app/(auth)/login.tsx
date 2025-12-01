import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useSendOtp } from '@/hooks/useAuthQueries';
import { useColorScheme } from '@/components/useColorScheme';
import { Colors } from '@/constants/Colors';

type AuthMethod = 'phone' | 'email';

export default function Login() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const [authMethod, setAuthMethod] = useState<AuthMethod>('phone');
  const [identifier, setIdentifier] = useState('');
  
  const sendOtpMutation = useSendOtp();
  const loading = sendOtpMutation.isPending;

  const switchMethod = (method: AuthMethod) => {
    setAuthMethod(method);
    setIdentifier('');
  };

  const handleLogin = () => {
    if (!identifier || identifier.length < 3) {
      Alert.alert('Error', `Please enter a valid ${authMethod}`);
      return;
    }

    let finalIdentifier = identifier;
    
    if (authMethod === 'phone') {
      const cleanPhone = identifier.replace(/\D/g, '');
      finalIdentifier = cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone;
      finalIdentifier = `254${finalIdentifier}`;
    }
    
    sendOtpMutation.mutate(
      { 
        identifier: finalIdentifier,
        type: 'login',
        role: (role as string) || 'client' 
      },
      {
        onSuccess: () => {
          router.push({
            pathname: '/(auth)/otp',
            params: { phone: finalIdentifier, role: role || 'client' }
          });
        }
      }
    );
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="auto" />
      <SafeAreaView className="flex-1">
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
              Enter your {authMethod} to continue as a {role || 'user'}.
            </Text>
            
            {/* Method Toggle */}
            <View className="flex-row bg-muted p-1 rounded-xl mb-6">
              <TouchableOpacity 
                onPress={() => switchMethod('phone')}
                className={`flex-1 py-2 rounded-lg items-center ${authMethod === 'phone' ? 'bg-card shadow-sm' : ''}`}
              >
                <Text className={`font-bold font-sans ${authMethod === 'phone' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Phone
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => switchMethod('email')}
                className={`flex-1 py-2 rounded-lg items-center ${authMethod === 'email' ? 'bg-card shadow-sm' : ''}`}
              >
                <Text className={`font-bold font-sans ${authMethod === 'email' ? 'text-foreground' : 'text-muted-foreground'}`}>
                  Email
                </Text>
              </TouchableOpacity>
            </View>

            {/* Conditional Input Component */}
            {authMethod === 'phone' ? (
              <PhoneInput 
                value={identifier} 
                onChange={setIdentifier}
              />
            ) : (
              <EmailInput 
                value={identifier} 
                onChange={setIdentifier}
              />
            )}

            <TouchableOpacity 
              onPress={handleLogin}
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
      </SafeAreaView>
    </View>
  );
}

// Phone Input Component
function PhoneInput({ value, onChange }: { 
  value: string; 
  onChange: (val: string) => void;
}) {
  const colorScheme = useColorScheme();
  
  return (
    <>
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
          value={value}
          onChangeText={onChange}
        />
      </View>
    </>
  );
}

// Email Input Component
function EmailInput({ value, onChange }: { 
  value: string; 
  onChange: (val: string) => void;
}) {
  const colorScheme = useColorScheme();
  
  return (
    <>
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
          value={value}
          onChangeText={onChange}
        />
      </View>
    </>
  );
}
