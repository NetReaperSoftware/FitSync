import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Image } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function SplashScreen({ navigation }: any): React.JSX.Element {
  const { theme } = useTheme();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FitSync</Text>
      <Text style={styles.subtitle}>Your fitness journey, synchronized</Text>
      <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: theme.background,
  },
  title: {
    fontSize: 38, 
    fontWeight: 'bold', 
    color: theme.primary,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 8,
  }
});
