import { View, Text, Dimensions } from 'react-native';
import { createStyles } from '@/theme/createStyles';

const { width } = Dimensions.get('window');

interface OnboardingSlideProps {
  item: {
    id: string;
    title: string;
    description: string;
    emoji: string;
  };
}

const useStyles = createStyles((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emojiContainer: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: (width * 0.5) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    backgroundColor: theme.primary + '20',
  },
  emoji: {
    fontSize: 80,
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: theme.fonts.bold,
    color: theme.text,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: theme.fonts.regular,
    color: theme.muted,
  },
}));

export default function OnboardingSlide({ item }: OnboardingSlideProps) {
  const styles = useStyles();

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>
          {item.description}
        </Text>
      </View>
    </View>
  );
}
