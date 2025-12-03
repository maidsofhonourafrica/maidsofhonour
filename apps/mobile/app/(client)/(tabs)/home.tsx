import { View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { createStyles } from '@/theme/createStyles';

const useStyles = createStyles((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.secondary + '4D',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    backgroundColor: theme.card,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: theme.fonts.regular,
    color: theme.muted,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold,
    color: theme.text,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.card,
    backgroundColor: theme.muted,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  searchBarContainer: {
    position: 'relative',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    gap: 12,
    backgroundColor: theme.card,
    borderColor: theme.primary + '33',
  },
  searchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primary + '1A',
  },
  searchTextContainer: {
    flex: 1,
  },
  searchTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    fontFamily: theme.fonts.semibold,
    color: theme.primary,
  },
  searchPlaceholder: {
    fontSize: 13,
    fontFamily: theme.fonts.regular,
    color: theme.muted,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 24,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold,
    color: theme.text,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.primary,
  },
  categoriesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    minWidth: 100,
    borderWidth: 1,
    backgroundColor: theme.card,
    borderColor: theme.border,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: theme.fonts.semibold,
    color: theme.text,
  },
  providerCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    flexDirection: 'row',
    gap: 16,
    backgroundColor: theme.card,
    borderColor: theme.border,
  },
  providerImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: theme.fonts.bold,
    color: theme.text,
  },
  providerRole: {
    fontSize: 14,
    marginBottom: 4,
    fontFamily: theme.fonts.regular,
    color: theme.muted,
  },
  providerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  providerRatingText: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: theme.text,
  },
}));

export default function ClientHome() {
  const styles = useStyles();

  const categories = [
    { id: 1, name: 'Nanny', icon: '👶' },
    { id: 2, name: 'Maid', icon: '🧹' },
    { id: 3, name: 'Cook', icon: '👨‍🍳' },
    { id: 4, name: 'Cleaner', icon: '🧽' },
  ];

  const providers = [
    { id: 1, name: 'Mary Johnson', role: 'Nanny', rating: 4.9, image: 'https://i.pravatar.cc/150?u=mary' },
    { id: 2, name: 'Grace Mwangi', role: 'Maid', rating: 4.8, image: 'https://i.pravatar.cc/150?u=grace' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Good Morning,</Text>
              <Text style={styles.username}>Sarah</Text>
            </View>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: "https://i.pravatar.cc/150?u=sarah" }} 
                style={styles.avatarImage}
              />
            </View>
          </View>

          {/* AI Search Bar */}
          <TouchableOpacity 
            onPress={() => router.push('/(client)/provider/1')}
            style={styles.searchBarContainer}
          >
            <View style={styles.searchBar}>
              <View style={styles.searchIconContainer}>
                 <Feather name="cpu" size={20} color={styles.searchTitle.color} />
              </View>
              <View style={styles.searchTextContainer}>
                <Text style={styles.searchTitle}>AI Assistant</Text>
                <Text style={styles.searchPlaceholder}>"Find a nanny for my 2 kids..."</Text>
              </View>
              <Feather name="arrow-right" size={20} color={styles.searchTitle.color} />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Categories */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoriesContainer}>
                {categories.map((category) => (
                  <TouchableOpacity key={category.id} style={styles.categoryCard}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Featured Providers */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Pros</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {providers.map((provider) => (
              <TouchableOpacity 
                key={provider.id} 
                style={styles.providerCard}
                onPress={() => router.push('/(client)/provider/1')}
              >
                <Image source={{ uri: provider.image }} style={styles.providerImage} />
                <View style={styles.providerInfo}>
                  <Text style={styles.providerName}>{provider.name}</Text>
                  <Text style={styles.providerRole}>{provider.role}</Text>
                  <View style={styles.providerRating}>
                    <Feather name="star" size={16} color="#F59E0B" />
                    <Text style={styles.providerRatingText}>{provider.rating}</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={24} color={styles.providerRole.color} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
