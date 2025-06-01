import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
// @ts-ignore
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

export default function HomeScreen(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home</Text>
      <Text>SUPABASE_URL: {SUPABASE_URL}</Text>
      <Text>SUPABASE_ANON_KEY: {SUPABASE_ANON_KEY.slice(0, 6)}...</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 24, fontWeight: 'bold' },
});
