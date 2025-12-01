import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function SPDashboard() {
  const colorScheme = useColorScheme();

  return (
    <View className="flex-1 bg-secondary/30 dark:bg-background">
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="bg-dark dark:bg-card p-6 pt-12 pb-8 rounded-b-[30px] shadow-lg z-10">
        <View className="flex-row justify-between items-center mb-6">
          <View>
            <Text className="text-xs text-slate-400 font-sans">Welcome back,</Text>
            <Text className="text-xl font-bold text-white dark:text-foreground font-sans">Beatrice</Text>
          </View>
          <View className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border-2 border-slate-600">
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop" }} 
              className="w-full h-full"
            />
          </View>
        </View>
        
        {/* Earnings Card */}
        <View className="bg-primary rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <View className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10" />
          <Text className="text-xs text-pink-100 mb-1 font-sans">Total Earnings</Text>
          <Text className="text-3xl font-bold text-white mb-4 font-sans">Ksh 24,500</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity className="bg-white/20 px-3 py-1.5 rounded-lg">
              <Text className="text-white text-xs font-medium font-sans">Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-white/20 px-3 py-1.5 rounded-lg">
              <Text className="text-white text-xs font-medium font-sans">History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Vetting Status */}
        <View className="bg-card p-4 rounded-2xl shadow-sm border border-border mb-6">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-bold text-foreground text-sm font-sans">Vetting Status</Text>
            <View className="bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
              <Text className="text-xs font-bold text-orange-500 font-sans">In Progress</Text>
            </View>
          </View>
          <View className="w-full bg-muted rounded-full h-2 mb-2">
            <View className="bg-orange-500 h-2 rounded-full w-[60%]" />
          </View>
          <Text className="text-xs text-muted-foreground font-sans">Complete your profile to start getting jobs.</Text>
          <TouchableOpacity className="w-full mt-3 py-2 bg-foreground rounded-lg items-center">
            <Text className="text-background text-xs font-bold font-sans">Continue Vetting</Text>
          </TouchableOpacity>
        </View>

        {/* Requests */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="font-bold text-foreground font-sans">New Requests</Text>
            <Text className="text-xs text-primary font-medium font-sans">View All</Text>
          </View>
          
          <View className="bg-card p-4 rounded-2xl shadow-sm border border-border mb-3">
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-row gap-3">
                <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
                  <Text className="font-bold text-sm text-muted-foreground font-sans">JM</Text>
                </View>
                <View>
                  <Text className="font-bold text-foreground text-sm font-sans">John M.</Text>
                  <Text className="text-xs text-muted-foreground font-sans">Nanny • 3 Days</Text>
                </View>
              </View>
              <View className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">
                <Text className="text-xs font-bold text-green-600 dark:text-green-500 font-sans">New</Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <TouchableOpacity className="flex-1 bg-muted py-2 rounded-xl items-center">
                <Text className="text-muted-foreground text-xs font-bold font-sans">Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-primary py-2 rounded-xl items-center">
                <Text className="text-white text-xs font-bold font-sans">Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
