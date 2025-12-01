import React from 'react';
import { View, Text, Image, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface SlideProps {
  title: string;
  description: string;
  image: string;
  color: string;
  icon: 'AI' | 'Shield';
}

export const OnboardingSlide: React.FC<SlideProps> = ({ title, description, image, color, icon }) => {
  return (
    <View style={{ width, height: '100%' }} className="flex-col">
      <View className={`h-[60%] ${color} relative overflow-hidden rounded-b-[40px]`}>
        <Image
          source={{ uri: image }}
          className="w-full h-full object-cover opacity-90"
        />
        <View className="absolute inset-0 bg-transparent" />
        
        {/* Floating Card */}
        <View className="absolute bottom-8 left-8 right-8">
          <View className="bg-white/20 backdrop-blur-md border border-white/30 p-4 rounded-2xl">
            <View className="flex-row items-center gap-3 mb-2">
              <View className="w-8 h-8 bg-white rounded-full items-center justify-center">
                {icon === 'AI' ? (
                  <Text className="text-primary font-bold text-xs">AI</Text>
                ) : (
                   <View className="w-4 h-4 bg-green-500 rounded-full" />
                )}
              </View>
              <Text className="text-white text-sm font-semibold">
                {icon === 'AI' ? 'Smart Matching' : 'Fully Vetted'}
              </Text>
            </View>
            <Text className="text-white text-xs opacity-90">
              {icon === 'AI' 
                ? '"I found the perfect nanny who speaks Swahili and loves pets!"'
                : 'ID, Police Clearance & Medical Checks verified.'}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-1 p-8 justify-between bg-background">
        <View>
          <Text className="text-2xl font-bold text-foreground mb-3 font-sans">
            {title}
          </Text>
          <Text className="text-muted-foreground text-sm leading-relaxed font-sans">
            {description}
          </Text>
        </View>
      </View>
    </View>
  );
};
