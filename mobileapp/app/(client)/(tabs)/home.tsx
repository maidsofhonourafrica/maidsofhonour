import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function ClientHome() {
  const colorScheme = useColorScheme();
  
  return (
    <View className="flex-1 bg-secondary/30 dark:bg-background">
      <StatusBar style="auto" />
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="bg-card p-6 pb-4 shadow-sm z-10 rounded-b-3xl">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="text-xs text-muted-foreground font-sans">Good Morning,</Text>
              <Text className="text-xl font-bold text-foreground font-sans">Sarah</Text>
            </View>
            <View className="w-10 h-10 rounded-full bg-muted overflow-hidden border-2 border-card shadow-sm">
              <Image 
                source={{ uri: "https://i.pravatar.cc/150?u=sarah" }} 
                className="w-full h-full"
              />
            </View>
          </View>

          {/* AI Search Bar */}
          <TouchableOpacity 
            onPress={() => router.push('/(client)/chat/new')}
            className="relative"
          >
            <View className="absolute inset-0 bg-primary/20 rounded-2xl blur-md opacity-50" />
            <View className="bg-card border border-primary/20 rounded-2xl p-3 flex-row items-center gap-3 shadow-sm">
              <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center">
                 <Feather name="cpu" size={20} color={Colors.light.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-primary font-bold mb-0.5 font-sans">AI Assistant</Text>
                <Text className="text-sm text-muted-foreground font-sans">"Find a nanny for my 2 kids..."</Text>
              </View>
              <View className="bg-primary p-2 rounded-xl">
                <Feather name="arrow-right" size={20} color="white" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Categories */}
          <View className="p-6 pb-2">
            <Text className="font-bold text-foreground mb-3 font-sans">Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-4">
              {[
                { name: 'Nanny', icon: 'smile', color: '#CF2680' },
                { name: 'Housekeep', icon: 'home', color: '#a855f7' },
                { name: 'Cook', icon: 'coffee', color: '#22c55e' },
              ].map((cat, index) => (
                <TouchableOpacity key={index} className="items-center gap-2 mr-4 min-w-[70px]">
                  <View className="w-16 h-16 rounded-2xl bg-card items-center justify-center shadow-sm border border-border">
                    <Feather name={cat.icon as any} size={32} color={cat.color} />
                  </View>
                  <Text className="text-xs font-medium text-muted-foreground font-sans">{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Featured */}
          <View className="p-6 pt-2">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="font-bold text-foreground font-sans">Verified Pros</Text>
              <Text className="text-xs text-primary font-medium font-sans">See All</Text>
            </View>
            
            {/* Card 1 */}
            <TouchableOpacity 
              onPress={() => router.push('/(client)/provider/1')}
              className="bg-card p-4 rounded-2xl shadow-sm border border-border mb-4 flex-row gap-4"
            >
              <View className="w-20 h-20 rounded-xl bg-muted overflow-hidden relative">
                <Image 
                  source={{ uri: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop" }}
                  className="w-full h-full"
                />
                <View className="absolute bottom-0 left-0 right-0 bg-green-500 py-0.5 items-center">
                  <Text className="text-white text-[10px] font-bold font-sans">VETTED</Text>
                </View>
              </View>
              <View className="flex-1">
                <View className="flex-row justify-between items-start">
                  <Text className="font-bold text-foreground font-sans">Beatrice W.</Text>
                  <View className="flex-row items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-1.5 py-0.5 rounded-md border border-yellow-100 dark:border-yellow-900/30">
                    <Feather name="star" size={12} color="#eab308" />
                    <Text className="text-xs font-bold text-yellow-700 dark:text-yellow-500 font-sans">4.9</Text>
                  </View>
                </View>
                <Text className="text-xs text-muted-foreground mb-2 font-sans">Nanny • 5 Yrs Exp • Nairobi</Text>
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-bold text-primary font-sans">Ksh 800<Text className="text-muted-foreground text-xs font-normal">/day</Text></Text>
                  <View className="bg-foreground px-3 py-1.5 rounded-lg">
                    <Text className="text-background text-xs font-sans">View</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
