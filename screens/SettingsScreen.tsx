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

export default function SettingsScreen(): React.JSX.Element {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
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
                trackColor={{ false: '#e0e0e0', true: '#4285F4' }}
                thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
              />
            )}
            {renderSettingItem(
              'Dark Mode',
              'Toggle dark theme',
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#e0e0e0', true: '#4285F4' }}
                thumbColor={darkModeEnabled ? '#ffffff' : '#f4f3f4'}
              />
            )}
            {renderSettingItem(
              'Data Sync',
              'Sync data across devices',
              <Switch
                value={syncEnabled}
                onValueChange={setSyncEnabled}
                trackColor={{ false: '#e0e0e0', true: '#4285F4' }}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#333',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4285F4',
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingAction: {
    marginLeft: 12,
  },
  arrowText: {
    fontSize: 20,
    color: '#ccc',
    fontWeight: '300',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  logoutButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});