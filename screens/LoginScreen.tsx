import React, { useState } from 'react';
import {
  SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';

export default function LoginScreen({ navigation }: any): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>FitSync</Text>
        <Text style={styles.subtitle}>Login to your account</Text>
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  form: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, color: '#3498db' },
  subtitle: { fontSize: 18, textAlign: 'center', marginBottom: 30, color: '#7f8c8d' },
  input: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 10, marginBottom: 15, fontSize: 16 },
  button: { backgroundColor: '#3498db', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  signupContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  signupText: { color: '#7f8c8d', fontSize: 16 },
  signupLink: { color: '#3498db', fontSize: 16, fontWeight: 'bold' },
});
