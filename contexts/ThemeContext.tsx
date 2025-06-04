import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Theme {
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryVariant: string;
  secondary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  success: string;
  warning: string;
  error: string;
  shadow: string;
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  modalBackground: string;
  inputBackground: string;
  inputBorder: string;
  cardBackground: string;
}

const lightTheme: Theme = {
  background: '#f5f5f5',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  primary: '#4285F4',
  primaryVariant: '#1a73e8',
  secondary: '#34a853',
  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#999999',
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#ff4444',
  shadow: '#000000',
  tabBarBackground: '#ffffff',
  tabBarActive: '#4285F4',
  tabBarInactive: '#999999',
  modalBackground: 'rgba(0,0,0,0.5)',
  inputBackground: '#ffffff',
  inputBorder: '#ddd',
  cardBackground: '#ffffff',
};

const darkTheme: Theme = {
  background: '#121212',
  surface: '#1e1e1e',
  surfaceElevated: '#2d2d2d',
  primary: '#4285F4',
  primaryVariant: '#1a73e8',
  secondary: '#34a853',
  text: '#ffffff',
  textSecondary: '#b3b3b3',
  textMuted: '#808080',
  border: '#404040',
  borderLight: '#2d2d2d',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#ff6b6b',
  shadow: '#000000',
  tabBarBackground: '#1e1e1e',
  tabBarActive: '#4285F4',
  tabBarInactive: '#808080',
  modalBackground: 'rgba(0,0,0,0.8)',
  inputBackground: '#2d2d2d',
  inputBorder: '#404040',
  cardBackground: '#1e1e1e',
};

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@FitSync:theme_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemColorScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;

  useEffect(() => {
    loadThemeMode();
  }, []);

  const loadThemeMode = async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
        setThemeModeState(savedMode as ThemeMode);
      }
    } catch (error) {
      console.log('Error loading theme mode:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.log('Error saving theme mode:', error);
    }
  };

  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};