import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function SettingsScreen(): React.JSX.Element {
  const { theme, isDark, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(true);

  const renderSettingItem = (
    title: string,
    subtitle?: string,
    rightComponent?: React.ReactNode,
    onPress?: () => void
  ) => {
    return (
      <TouchableOpacity
        style={styles.settingItem}
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        {rightComponent && <View style={styles.settingAction}>{rightComponent}</View>}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (title: string) => {
    return <Text style={styles.sectionHeader}>{title}</Text>;
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Text style={styles.header}>Settings</Text>

            {renderSectionHeader('Account')}
            {renderSettingItem(
              'Profile Information',
              'Update your personal details',
              <Text style={styles.arrowText}>›</Text>,
              () => console.log('Profile pressed')
            )}
            {renderSettingItem(
              'Goals & Preferences',
              'Set your fitness goals and preferences',
              <Text style={styles.arrowText}>›</Text>,
              () => console.log('Goals pressed')
            )}

            {renderSectionHeader('App Settings')}
            {renderSettingItem(
              'Notifications',
              'Get reminders and updates',
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
              />
            )}
            {renderSettingItem(
              'Dark Mode',
              'Toggle dark theme',
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={isDark ? '#ffffff' : '#f4f3f4'}
              />
            )}
            {renderSettingItem(
              'Data Sync',
              'Sync data across devices',
              <Switch
                value={syncEnabled}
                onValueChange={setSyncEnabled}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={syncEnabled ? '#ffffff' : '#f4f3f4'}
              />
            )}

            {renderSectionHeader('Support')}
            {renderSettingItem(
              'Help & FAQ',
              'Get help and find answers',
              <Text style={styles.arrowText}>›</Text>,
              () => console.log('Help pressed')
            )}
            {renderSettingItem(
              'Contact Support',
              'Get in touch with our team',
              <Text style={styles.arrowText}>›</Text>,
              () => console.log('Contact pressed')
            )}
            {renderSettingItem(
              'Privacy Policy',
              'Learn about data usage',
              <Text style={styles.arrowText}>›</Text>,
              () => console.log('Privacy pressed')
            )}

            {renderSectionHeader('Account Actions')}
            <TouchableOpacity style={styles.logoutButton}>
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 16,
    color: theme.text,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 18,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  settingAction: {
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 20,
    color: theme.textMuted,
    fontWeight: '300',
  },
  logoutButton: {
    backgroundColor: theme.error,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});