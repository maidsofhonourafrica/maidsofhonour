import { View, Text, TouchableOpacity, FlatList, Dimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useState, useRef } from 'react';
import OnboardingSlide from '@/components/OnboardingSlide';
import { createStyles } from '@/theme/createStyles';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Find Trusted Help',
    description: 'Connect with vetted maids, nannies, and cleaners in your area.',
    emoji: '🏠',
  },
  {
    id: '2',
    title: 'Secure Payments',
    description: 'Pay securely through the app. Funds are held in escrow until the job is done.',
    emoji: '💳',
  },
  {
    id: '3',
    title: 'Grow Your Business',
    description: 'Service providers can find jobs, manage bookings, and get paid easily.',
    emoji: '📈',
  },
];

const useStyles = createStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
  },
  footer: {
    padding: 24,
    gap: 24,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: theme.primary,
  },
  dotInactive: {
    backgroundColor: theme.muted + '50',
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: theme.primary,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold,
  },
  skipText: {
    textAlign: 'center',
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.text,
  },
}));

export default function Onboarding() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const styles = useStyles();

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.replace('/(auth)/role-selection');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.safeArea}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={({ item }) => <OnboardingSlide item={item} />}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentIndex(index);
          }}
          keyExtractor={(item) => item.id}
        />

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleNext}
          >
            <Text style={styles.buttonText}>
              {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.replace('/(auth)/role-selection')}>
             <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
