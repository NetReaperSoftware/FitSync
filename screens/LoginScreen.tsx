import React, { useState } from 'react';
import {
  SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function LoginScreen({ navigation }: any): React.JSX.Element {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // In a real app, you would validate credentials here
    // For now, we'll just navigate to the main app
    navigation.replace('MainTabs');
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>FitSync</Text>
        <Text style={styles.subtitle}>Login to your account</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Email" 
          placeholderTextColor={theme.textMuted}
          value={email} 
          onChangeText={setEmail} 
          keyboardType="email-address" 
          autoCapitalize="none" 
        />
        <TextInput 
          style={styles.input} 
          placeholder="Password" 
          placeholderTextColor={theme.textMuted}
          value={password} 
          onChangeText={setPassword} 
          secureTextEntry 
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
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

const createStyles = (theme: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background 
  },
  form: { 
    flex: 1, 
    padding: 20, 
    justifyContent: 'center' 
  },
  title: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 10, 
    color: theme.primary 
  },
  subtitle: { 
    fontSize: 18, 
    textAlign: 'center', 
    marginBottom: 30, 
    color: theme.textSecondary 
  },
  input: { 
    backgroundColor: theme.inputBackground, 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15, 
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    color: theme.text,
  },
  button: { 
    backgroundColor: theme.primary, 
    padding: 15, 
    borderRadius: 12, 
    alignItems: 'center', 
    marginTop: 10,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  signupContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 20 
  },
  signupText: { 
    color: theme.textSecondary, 
    fontSize: 16 
  },
  signupLink: { 
    color: theme.primary, 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});
