import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';

type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  Home: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" />
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
