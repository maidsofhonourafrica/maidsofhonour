import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createStyles } from '@/theme/createStyles';

const useStyles = createStyles((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.background,
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: theme.fonts.bold,
    color: theme.text,
  },
}));

export default function ProviderDetails() {
  const { id } = useLocalSearchParams();
  const styles = useStyles();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Provider Details: {id}</Text>
    </SafeAreaView>
  );
}
