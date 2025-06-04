import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function SignupScreen({ navigation }: any): React.JSX.Element {
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignup = () => {
    // In a real app, we would validate and create an account here
    // For demo purposes, just navigate to the main app
    navigation.replace('MainTabs');
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <Text style={styles.title}>FitSync</Text>
          <Text style={styles.subtitle}>Create a new account</Text>
          
          <TextInput 
            style={styles.input} 
            placeholder="Full Name" 
            placeholderTextColor={theme.textMuted}
            value={name} 
            onChangeText={setName} 
            autoCapitalize="words" 
          />
          
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
          
          <TextInput 
            style={styles.input} 
            placeholder="Confirm Password" 
            placeholderTextColor={theme.textMuted}
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            secureTextEntry 
          />
          
          <TouchableOpacity style={styles.button} onPress={handleSignup}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.background 
  },
  scrollContent: {
    flexGrow: 1,
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
  loginContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 20 
  },
  loginText: { 
    color: theme.textSecondary, 
    fontSize: 16 
  },
  loginLink: { 
    color: theme.primary, 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
});
