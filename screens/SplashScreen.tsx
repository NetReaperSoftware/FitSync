import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, Image } from 'react-native';

export default function SplashScreen({ navigation }: any): React.JSX.Element {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FitSync</Text>
      <Text style={styles.subtitle}>Your fitness journey, synchronized</Text>
      <ActivityIndicator size="large" color="#4285F4" style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 38, 
    fontWeight: 'bold', 
    color: '#4285F4',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  }
});
