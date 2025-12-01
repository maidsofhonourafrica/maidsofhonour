import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function Chat() {
  const { id } = useLocalSearchParams();
  const colorScheme = useColorScheme();

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="auto" />
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="p-4 border-b border-border flex-row items-center gap-3 bg-card">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-8 h-8 rounded-full bg-muted items-center justify-center"
          >
            <Feather name="arrow-left" size={20} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 bg-primary rounded-full items-center justify-center">
              <Text className="text-primary-foreground font-bold text-xs font-sans">AI</Text>
            </View>
            <View>
              <Text className="font-bold text-foreground text-sm font-sans">Maids Assistant</Text>
              <View className="flex-row items-center gap-1">
                <View className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <Text className="text-[10px] text-muted-foreground font-sans">Online</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView className="flex-1 bg-secondary/30 dark:bg-background p-4" contentContainerStyle={{ paddingBottom: 20 }}>
          {/* AI Message */}
          <View className="flex-row gap-3 mb-4">
            <View className="w-8 h-8 bg-primary rounded-full items-center justify-center mt-1">
              <Text className="text-primary-foreground text-xs font-bold font-sans">AI</Text>
            </View>
            <View className="bg-card p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]">
              <Text className="text-sm text-foreground font-sans">
                Hello Sarah! How can I help you today? I can find verified nannies, housekeepers, or cooks for you.
              </Text>
            </View>
          </View>

          {/* User Message */}
          <View className="flex-row gap-3 mb-4 flex-row-reverse">
            <View className="w-8 h-8 bg-muted rounded-full overflow-hidden mt-1">
              <Image 
                source={{ uri: "https://i.pravatar.cc/150?u=sarah" }} 
                className="w-full h-full"
              />
            </View>
            <View className="bg-primary p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[80%]">
              <Text className="text-primary-foreground text-sm font-sans">
                I need a nanny for my 2 kids (ages 3 and 5). Someone who can cook and lives in Kilimani.
              </Text>
            </View>
          </View>

          {/* AI Typing */}
          <View className="flex-row gap-3 mb-4">
            <View className="w-8 h-8 bg-primary rounded-full items-center justify-center mt-1">
              <Text className="text-primary-foreground text-xs font-bold font-sans">AI</Text>
            </View>
            <View className="bg-card p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[80%] flex-row items-center gap-1">
              <View className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
              <View className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
              <View className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
            </View>
          </View>
        </ScrollView>

        {/* Input */}
        <View className="p-4 bg-card border-t border-border">
          <View className="flex-row gap-2">
            <TextInput
              className="flex-1 bg-muted border border-border rounded-xl px-4 py-3 text-sm font-sans text-foreground"
              placeholder="Type a message..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].muted}
            />
            <TouchableOpacity className="w-12 h-12 bg-primary rounded-xl items-center justify-center shadow-lg shadow-primary/20">
              <Feather name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
