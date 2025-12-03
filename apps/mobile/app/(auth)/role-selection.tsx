import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { createStyles } from '@/theme/createStyles';

const useStyles = createStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  safeArea: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: theme.fonts.bold,
    color: theme.text,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 48,
    fontFamily: theme.fonts.regular,
    color: theme.muted,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: theme.card,
    borderColor: theme.border,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: theme.primary + '20',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: theme.fonts.bold,
    color: theme.text,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: theme.fonts.regular,
    color: theme.muted,
  },
}));

export default function RoleSelection() {
  const router = useRouter();
  const styles = useStyles();

  const handleRoleSelect = (role: 'client' | 'provider') => {
    router.push({
      pathname: '/(auth)/login',
      params: { role }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Choose your role</Text>
        <Text style={styles.subtitle}>How do you want to use Maids of Honour?</Text>

        <View style={styles.cardsContainer}>
          <TouchableOpacity 
            style={styles.card}
            onPress={() => handleRoleSelect('client')}
          >
            <View style={styles.iconContainer}>
              <Text style={{ fontSize: 32 }}>🏠</Text>
            </View>
            <Text style={styles.cardTitle}>I need help</Text>
            <Text style={styles.cardDescription}>
              Find trusted maids, nannies, and cleaners.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.card}
            onPress={() => handleRoleSelect('provider')}
          >
            <View style={styles.iconContainer}>
              <Text style={{ fontSize: 32 }}>🧹</Text>
            </View>
            <Text style={styles.cardTitle}>I want to work</Text>
            <Text style={styles.cardDescription}>
              Find jobs and grow your business.
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
