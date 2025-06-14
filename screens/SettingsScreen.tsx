import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useUnits } from '../contexts/UnitsContext';

export default function SettingsScreen(): React.JSX.Element {
  const { theme, isDark, toggleTheme } = useTheme();
  const { signOut } = useAuth();
  const { useMetricUnits, setUseMetricUnits, getWeightLabel } = useUnits();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    dateOfBirth: '01/01/1995',
    height: '5\'9"', // Imperial default
    weight: '165', // Imperial default (lbs)
    gender: 'Male',
    activityLevel: 'Moderately Active'
  });
  
  const [tempProfileData, setTempProfileData] = useState({ ...profileData });

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => signOut()
        }
      ]
    );
  };

  const handleProfilePress = () => {
    setTempProfileData({ ...profileData });
    setShowProfileModal(true);
  };

  const handleSaveProfile = () => {
    // Validate inputs
    if (!validateDate(tempProfileData.dateOfBirth)) {
      Alert.alert('Invalid Date', 'Please enter a valid date in MM/DD/YYYY format.');
      return;
    }
    
    if (!tempProfileData.height || !tempProfileData.weight) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    
    if (!validateHeight(tempProfileData.height)) {
      Alert.alert('Invalid Height', useMetricUnits ? 'Please enter a valid height in centimeters.' : 'Please enter a valid height (e.g., 5\'9" or 69).');
      return;
    }
    
    if (!validateWeight(tempProfileData.weight)) {
      Alert.alert('Invalid Weight', useMetricUnits ? 'Please enter a valid weight in kilograms.' : 'Please enter a valid weight in pounds.');
      return;
    }
    
    setProfileData({ ...tempProfileData });
    setShowProfileModal(false);
    Alert.alert('Success', 'Profile information updated successfully!');
  };

  const handleCancelProfile = () => {
    setTempProfileData({ ...profileData });
    setShowProfileModal(false);
  };

  const validateDate = (dateString: string) => {
    const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/(19|20)\d{2}$/;
    return regex.test(dateString);
  };

  const validateHeight = (height: string) => {
    if (useMetricUnits) {
      // Metric: just a number (cm)
      return !isNaN(Number(height)) && Number(height) > 0;
    } else {
      // Imperial: format like 5'9" or 5'9 or 69 (inches)
      const feetInchesRegex = /^\d+\'\d*(\")?$|^\d+$/;
      return feetInchesRegex.test(height.replace(/\s/g, ''));
    }
  };

  const validateWeight = (weight: string) => {
    return !isNaN(Number(weight)) && Number(weight) > 0;
  };

  const getHeightPlaceholder = () => {
    return useMetricUnits ? 'Enter height in cm' : 'Enter height (e.g., 5\'9" or 69)';
  };

  const getWeightPlaceholder = () => {
    return useMetricUnits ? 'Enter weight in kg' : 'Enter weight in lbs';
  };

  const getHeightLabel = () => {
    return useMetricUnits ? 'Height (cm)' : 'Height (ft\'in" or inches)';
  };

  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const activityLevels = [
    'Sedentary',
    'Lightly Active',
    'Moderately Active',
    'Very Active',
    'Extremely Active'
  ];

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
              handleProfilePress
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
            {renderSettingItem(
              'Units',
              useMetricUnits ? 'Metric (kg, cm)' : 'Imperial (lbs, ft/in)',
              <Switch
                value={useMetricUnits}
                onValueChange={setUseMetricUnits}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={useMetricUnits ? '#ffffff' : '#f4f3f4'}
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
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Profile Information Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCancelProfile}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Profile Information</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Date of Birth */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Date of Birth</Text>
              <TextInput
                style={styles.textInput}
                value={tempProfileData.dateOfBirth}
                onChangeText={(text) => setTempProfileData({ ...tempProfileData, dateOfBirth: text })}
                placeholder="MM/DD/YYYY"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
              <Text style={styles.inputHint}>Format: MM/DD/YYYY</Text>
            </View>

            {/* Height */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>{getHeightLabel()}</Text>
              <TextInput
                style={styles.textInput}
                value={tempProfileData.height}
                onChangeText={(text) => setTempProfileData({ ...tempProfileData, height: text })}
                placeholder={getHeightPlaceholder()}
                placeholderTextColor={theme.textSecondary}
                keyboardType={useMetricUnits ? 'numeric' : 'default'}
              />
              {!useMetricUnits && (
                <Text style={styles.inputHint}>Examples: 5'9", 5'9, or 69 (inches)</Text>
              )}
            </View>

            {/* Weight */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>{getWeightLabel()}</Text>
              <TextInput
                style={styles.textInput}
                value={tempProfileData.weight}
                onChangeText={(text) => setTempProfileData({ ...tempProfileData, weight: text })}
                placeholder={getWeightPlaceholder()}
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
            </View>

            {/* Gender */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Gender</Text>
              <View style={styles.optionContainer}>
                {genderOptions.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionButton,
                      tempProfileData.gender === option && styles.optionButtonSelected
                    ]}
                    onPress={() => setTempProfileData({ ...tempProfileData, gender: option })}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        tempProfileData.gender === option && styles.optionButtonTextSelected
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Activity Level */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Activity Level</Text>
              <View style={styles.optionContainer}>
                {activityLevels.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.optionButton,
                      tempProfileData.activityLevel === level && styles.optionButtonSelected
                    ]}
                    onPress={() => setTempProfileData({ ...tempProfileData, activityLevel: level })}
                  >
                    <Text
                      style={[
                        styles.optionButtonText,
                        tempProfileData.activityLevel === level && styles.optionButtonTextSelected
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.activityLevelDescription}>
                {tempProfileData.activityLevel === 'Sedentary' && 'Little to no exercise, desk job'}
                {tempProfileData.activityLevel === 'Lightly Active' && 'Light exercise 1-3 days/week'}
                {tempProfileData.activityLevel === 'Moderately Active' && 'Moderate exercise 3-5 days/week'}
                {tempProfileData.activityLevel === 'Very Active' && 'Hard exercise 6-7 days/week'}
                {tempProfileData.activityLevel === 'Extremely Active' && 'Very hard exercise, physical job'}
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  modalCancelText: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  modalSaveText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.text,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  dateButton: {
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  dateButtonText: {
    fontSize: 16,
    color: theme.text,
  },
  optionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.borderLight,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  optionButtonText: {
    fontSize: 14,
    color: theme.text,
  },
  optionButtonTextSelected: {
    color: 'white',
    fontWeight: '500',
  },
  activityLevelDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 8,
    fontStyle: 'italic',
  },
  inputHint: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
  },
});