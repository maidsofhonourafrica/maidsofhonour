import { Text, View, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createStyles } from '@/theme/createStyles';
import { useSession } from '@/context/SessionContext';
import { trpc } from '@/lib/trpc';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const useStyles = createStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold,
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold,
    color: theme.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    fontFamily: theme.fonts.regular,
    color: theme.muted,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: theme.fonts.semibold,
    color: theme.muted,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.muted,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: theme.fonts.semibold,
    color: theme.text,
  },
  logoutButton: {
    backgroundColor: theme.destructive,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutButtonDisabled: {
    opacity: 0.5,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: theme.fonts.semibold,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: theme.fonts.medium,
    color: theme.muted,
    marginTop: 12,
  },
}));

export default function ProfileScreen() {
  const styles = useStyles();
  const { user, signOut } = useSession();
  
  // tRPC logout mutation
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      // Clear local session
      signOut();
      // Navigate to auth screen
      router.replace('/(auth)/onboarding');
    },
    onError: (error) => {
      // Even if server logout fails, we can still clear local session
      Alert.alert(
        'Logout Warning',
        `Server logout failed: ${error.message}. Clear local session anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout Anyway',
            style: 'destructive',
            onPress: () => {
              signOut();
              router.replace('/(auth)/onboarding');
            },
          },
        ]
      );
    },
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logoutMutation.mutate();
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get user initials for avatar
  const getInitials = () => {
    const email = user.email || '';
    return email.charAt(0).toUpperCase();
  };

  // Format user type for display
  const formatUserType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with avatar */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{getInitials()}</Text>
          </View>
          <Text style={styles.userName}>Welcome</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="mail-outline" size={20} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Email</Text>
              </View>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="call-outline" size={20} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Phone</Text>
              </View>
              <Text style={styles.infoValue}>{user.phoneNumber}</Text>
            </View>

            <View style={[styles.infoRow, { marginBottom: 0 }]}>
              <View style={styles.infoLabelContainer}>
                <Ionicons name="person-outline" size={20} style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Account Type</Text>
              </View>
              <Text style={styles.infoValue}>{formatUserType(user.userType)}</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session</Text>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              logoutMutation.isPending && styles.logoutButtonDisabled,
            ]}
            onPress={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.logoutButtonText}>
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
