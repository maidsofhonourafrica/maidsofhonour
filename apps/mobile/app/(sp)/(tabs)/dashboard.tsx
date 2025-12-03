import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { createStyles } from '@/theme/createStyles';

const useStyles = createStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.secondary + '4D',
  },
  header: {
    padding: 24,
    paddingTop: 48,
    paddingBottom: 32,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
    backgroundColor: '#1e293b',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: theme.fonts.regular,
    color: '#94a3b8',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold,
    color: '#fff',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#475569',
    backgroundColor: '#334155',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  earningsCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: theme.primary,
  },
  earningsCardDecoration: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 96,
    height: 96,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 48,
    marginRight: -40,
    marginTop: -40,
  },
  earningsLabel: {
    fontSize: 12,
    marginBottom: 4,
    fontFamily: theme.fonts.regular,
    color: '#fce7f3',
  },
  earningsAmount: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: theme.fonts.bold,
    color: 'white',
  },
  earningsActions: {
    flexDirection: 'row',
    gap: 12,
  },
  earningsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  earningsButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: theme.fonts.medium,
  },
  scrollView: {
    flex: 1,
    padding: 24,
    paddingTop: 24,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    backgroundColor: theme.card,
    borderColor: theme.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: theme.fonts.bold,
    color: theme.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#fff7ed',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold,
    color: '#f97316',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
    opacity: 0.2,
    backgroundColor: theme.muted,
  },
  progressBarFill: {
    height: 8,
    borderRadius: 4,
    width: '60%',
    backgroundColor: '#f97316',
  },
  cardDescription: {
    fontSize: 12,
    marginBottom: 12,
    fontFamily: theme.fonts.regular,
    color: theme.muted,
  },
  actionButton: {
    width: '100%',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: theme.text,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold,
    color: theme.background,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: theme.fonts.bold,
    color: theme.text,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: theme.fonts.medium,
    color: theme.primary,
  },
  requestCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    backgroundColor: theme.card,
    borderColor: theme.border,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requesterInfo: {
    flexDirection: 'row',
    gap: 12,
  },
  requesterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.2,
    backgroundColor: theme.muted,
  },
  requesterInitials: {
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: theme.fonts.bold,
    color: theme.muted,
  },
  requesterName: {
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: theme.fonts.bold,
    color: theme.text,
  },
  requestDetails: {
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    color: theme.muted,
  },
  newBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f0fdf4',
  },
  newBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold,
    color: '#16a34a',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  requestButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: theme.muted,
  },
  acceptButton: {
    backgroundColor: theme.primary,
  },
  requestButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold,
  },
  declineButtonText: {
    color: theme.muted,
  },
  acceptButtonText: {
    color: 'white',
  },
}));

export default function SPDashboard() {
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>Beatrice</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=200&auto=format&fit=crop" }} 
              style={styles.avatarImage}
            />
          </View>
        </View>
        
        {/* Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsCardDecoration} />
          <Text style={styles.earningsLabel}>Total Earnings</Text>
          <Text style={styles.earningsAmount}>Ksh 24,500</Text>
          <View style={styles.earningsActions}>
            <TouchableOpacity style={styles.earningsButton}>
              <Text style={styles.earningsButtonText}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.earningsButton}>
              <Text style={styles.earningsButtonText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Vetting Status */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Vetting Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>In Progress</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
          <Text style={styles.cardDescription}>Complete your profile to start getting jobs.</Text>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionButtonText}>Continue Vetting</Text>
          </TouchableOpacity>
        </View>

        {/* Requests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New Requests</Text>
            <Text style={styles.seeAll}>View All</Text>
          </View>
          
          <View style={styles.requestCard}>
            <View style={styles.requestHeader}>
              <View style={styles.requesterInfo}>
                <View style={styles.requesterAvatar}>
                  <Text style={styles.requesterInitials}>JM</Text>
                </View>
                <View>
                  <Text style={styles.requesterName}>John M.</Text>
                  <Text style={styles.requestDetails}>Nanny • 3 Days</Text>
                </View>
              </View>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>New</Text>
              </View>
            </View>
            <View style={styles.requestActions}>
              <TouchableOpacity style={[styles.requestButton, styles.declineButton]}>
                <Text style={[styles.requestButtonText, styles.declineButtonText]}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.requestButton, styles.acceptButton]}>
                <Text style={[styles.requestButtonText, styles.acceptButtonText]}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
