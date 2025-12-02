import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function RoleSelection() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  
  return (
    <View className="flex-1 bg-secondary/30 dark:bg-background">
      <StatusBar style="auto" />
      <SafeAreaView className="flex-1 p-8 pt-16">
        <Text className="text-3xl font-bold text-foreground mb-2 font-sans">Welcome!</Text>
        <Text className="text-muted-foreground mb-8 font-sans">Choose how you want to use the app.</Text>
        
        <View className="gap-4">
          {/* Client Card */}
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/login?role=client')}
            className="bg-card p-6 rounded-3xl border-2 border-transparent active:border-primary"
          >
            <View className="w-14 h-14 bg-primary/10 rounded-2xl items-center justify-center mb-4">
               <Feather name="home" size={24} color={Colors.light.primary} />
            </View>
            <Text className="text-xl font-bold text-foreground mb-1 font-sans">I need help</Text>
            <Text className="text-sm text-muted-foreground font-sans">Find verified nannies, housekeepers, and cooks.</Text>
          </TouchableOpacity>

          {/* SP Card */}
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/login?role=service_provider')}
            className="bg-card p-6 rounded-3xl border-2 border-transparent active:border-primary"
          >
            <View className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl items-center justify-center mb-4">
               <Feather name="briefcase" size={24} color="#9333ea" />
            </View>
            <Text className="text-xl font-bold text-foreground mb-1 font-sans">I want to work</Text>
            <Text className="text-sm text-muted-foreground font-sans">Join as a professional, get trained, and find jobs.</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-auto p-8 items-center">
          <Text className="text-xs text-muted-foreground font-sans text-center">
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
