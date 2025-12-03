import { Text, View } from 'react-native';
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
    color: theme.muted,
  },
}));

export default function JobsScreen() {
  const styles = useStyles();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Coming Soon</Text>
    </SafeAreaView>
  );
}
