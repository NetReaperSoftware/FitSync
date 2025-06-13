import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface BottomWorkoutProgressBarProps {
  visible: boolean;
  onResume: () => void;
  onDiscard: () => void;
}

export default function BottomWorkoutProgressBar({
  visible,
  onResume,
  onDiscard
}: BottomWorkoutProgressBarProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  if (!visible) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.progressBar}>
        <View style={styles.content}>
          <View style={styles.statusSection}>
            <View style={styles.statusIndicator} />
            <Text style={styles.statusText}>Workout in Progress</Text>
          </View>
          
          <View style={styles.buttonSection}>
            <TouchableOpacity
              style={styles.discardButton}
              onPress={onDiscard}
            >
              <Text style={styles.discardButtonText}>Discard</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.resumeButton}
              onPress={onResume}
            >
              <Text style={styles.resumeButtonText}>Resume</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.background,
  },
  progressBar: {
    backgroundColor: theme.cardBackground,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statusSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.primary,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  buttonSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  discardButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: theme.error,
  },
  discardButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  resumeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: theme.primary,
  },
  resumeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});