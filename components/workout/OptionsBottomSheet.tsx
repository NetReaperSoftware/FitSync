import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const { height: screenHeight } = Dimensions.get('window');

interface OptionItem {
  text: string;
  onPress: () => void | Promise<void>;
  isDelete?: boolean;
}

interface OptionsBottomSheetProps {
  visible: boolean;
  title?: string;
  options: OptionItem[];
  onClose: () => void;
}

export default function OptionsBottomSheet({
  visible,
  title,
  options,
  onClose
}: OptionsBottomSheetProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const slideAnim = React.useRef(new Animated.Value(screenHeight)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: screenHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleBackdropPress = () => {
    onClose();
  };

  const handleOptionPress = (option: OptionItem) => {
    onClose();
    // Small delay to allow modal to close before executing action
    setTimeout(async () => {
      try {
        await option.onPress();
      } catch (error) {
        console.error('Error executing option:', error);
      }
    }, 100);
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleBackdropPress}
        />
        
        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handle} />
          
          {/* Title */}
          {title && (
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{title}</Text>
            </View>
          )}
          
          {/* Options */}
          <View style={styles.optionsContainer}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionItem,
                  index === options.length - 1 && styles.lastOptionItem
                ]}
                onPress={() => handleOptionPress(option)}
              >
                <Text style={[
                  styles.optionText,
                  option.isDelete && styles.deleteOptionText
                ]}>
                  {option.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Cancel button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: theme.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40, // Extra padding for bottom safe area
    shadowColor: theme.shadow,
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  titleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  optionItem: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  lastOptionItem: {
    borderBottomWidth: 0,
  },
  optionText: {
    fontSize: 17,
    color: theme.text,
    fontWeight: '500',
  },
  deleteOptionText: {
    color: theme.error,
  },
  cancelButton: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 16,
    backgroundColor: theme.border,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 17,
    color: theme.textSecondary,
    fontWeight: '600',
  },
});