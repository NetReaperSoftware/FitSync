import React from 'react';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Screens
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import FoodTrackerScreen from './screens/FoodTrackerScreen';
import SettingsScreen from './screens/SettingsScreen';
import WorkoutTrackerScreen from './screens/WorkoutTrackerScreen';
import CardioScreen from './screens/CardioScreen';

// Type definitions
type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Signup: undefined;
  MainTabs: undefined;
};

type MainTabParamList = {
  Home: undefined;
  FoodTracker: undefined;
  WorkoutTracker: undefined;
  Cardio: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Bottom tabs navigator
function MainTabNavigator(): React.JSX.Element {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'FoodTracker') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'WorkoutTracker') {
            iconName = focused ? 'barbell' : 'barbell-outline';
          } else if (route.name === 'Cardio') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarStyle: {
          backgroundColor: theme.tabBarBackground,
          borderTopColor: theme.border,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen 
        name="FoodTracker" 
        component={FoodTrackerScreen}
        options={{ tabBarLabel: 'Food' }}
      />
      <Tab.Screen 
        name="WorkoutTracker" 
        component={WorkoutTrackerScreen}
        options={{ tabBarLabel: 'Workouts' }}
      />
      <Tab.Screen 
        name="Cardio" 
        component={CardioScreen}
        options={{ tabBarLabel: 'Cardio' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

function AppContent(): React.JSX.Element {
  const { isDark, theme } = useTheme();
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: theme.background 
      }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }
  
  return (
    <NavigationContainer>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <Stack.Navigator 
        initialRouteName={user ? "MainTabs" : "Splash"} 
        screenOptions={{ headerShown: false }}
      >
        {user ? (
          <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        ) : (
          <>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
