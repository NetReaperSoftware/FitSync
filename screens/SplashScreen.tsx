import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

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
      <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff',
  },
  title: {
    fontSize: 32, fontWeight: 'bold', color: '#3498db',
  },
});
