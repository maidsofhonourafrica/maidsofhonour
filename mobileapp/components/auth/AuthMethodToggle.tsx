import { View, Text, TouchableOpacity } from 'react-native';

type AuthMethod = 'phone' | 'email';

type Props = {
  currentMethod: AuthMethod;
  onMethodChange: (method: AuthMethod) => void;
};

export default function AuthMethodToggle({ currentMethod, onMethodChange }: Props) {
  return (
    <View className="px-8 pt-4 pb-6">
      <View className="flex-row bg-muted p-1 rounded-xl">
        <TouchableOpacity 
          onPress={() => onMethodChange('phone')}
          className={`flex-1 py-2 rounded-lg items-center ${currentMethod === 'phone' ? 'bg-card shadow-sm' : ''}`}
        >
          <Text className={`font-bold font-sans ${currentMethod === 'phone' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Phone
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => onMethodChange('email')}
          className={`flex-1 py-2 rounded-lg items-center ${currentMethod === 'email' ? 'bg-card shadow-sm' : ''}`}
        >
          <Text className={`font-bold font-sans ${currentMethod === 'email' ? 'text-foreground' : 'text-muted-foreground'}`}>
            Email
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
