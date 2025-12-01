import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { OnboardingSlide } from '@/components/OnboardingSlide';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: 1,
    title: "AI-Powered Matching",
    description: "Tell our AI assistant exactly what you need, and we'll find the perfect, vetted professional for your home.",
    image: "https://images.unsplash.com/photo-1556910103-1c02745a30bf?q=80&w=1000&auto=format&fit=crop",
    color: "bg-secondary",
    icon: "AI" as const
  },
  {
    id: 2,
    title: "Trusted & Verified",
    description: "Every service provider undergoes rigorous background checks, including police clearance and medical screening.",
    image: "https://images.unsplash.com/photo-1581579186913-45ac3e6e3dd2?q=80&w=1000&auto=format&fit=crop",
    color: "bg-slate-100",
    icon: "Shield" as const
  }
];

export default function Onboarding() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    setActiveIndex(roundIndex);
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollViewRef.current?.scrollTo({ x: width * (activeIndex + 1), animated: true });
    } else {
      router.push('/(auth)/role-selection');
    }
  };

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="auto" />
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        className="flex-1"
        testID="onboarding-scroll"
      >
        {SLIDES.map((slide) => (
          <OnboardingSlide key={slide.id} {...slide} />
        ))}
      </ScrollView>

      {/* Controls */}
      <View className="absolute bottom-10 left-8 right-8 flex-row justify-between items-center">
        <View className="flex-row gap-2">
          {SLIDES.map((_, index) => (
            <View
              key={index}
              className={`h-2 rounded-full ${index === activeIndex ? 'w-6 bg-primary' : 'w-2 bg-muted'}`}
            />
          ))}
        </View>
        <TouchableOpacity
          onPress={handleNext}
          className={`${activeIndex === SLIDES.length - 1 ? 'px-8 py-3 bg-primary rounded-xl shadow-lg shadow-primary/30' : 'w-12 h-12 bg-foreground rounded-full items-center justify-center shadow-lg'}`}
          testID="next-button"
        >
          {activeIndex === SLIDES.length - 1 ? (
            <Text className="text-primary-foreground font-semibold">Get Started</Text>
          ) : (
            <Text className="text-background font-bold">{'>'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
