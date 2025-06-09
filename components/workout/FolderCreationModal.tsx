import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface FolderCreationModalProps {
  visible: boolean;
  folderName: string;
  onFolderNameChange: (name: string) => void;
  onCreate: () => void;
  onCancel: () => void;
}

export default function FolderCreationModal({
  visible,
  folderName,
  onFolderNameChange,
  onCreate,
  onCancel
}: FolderCreationModalProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalHeader}>Create New Folder</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Folder Name"
            placeholderTextColor={theme.textMuted}
            value={folderName}
            onChangeText={onFolderNameChange}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.createButton}
              onPress={onCreate}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.modalBackground,
  },
  modalContent: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.text,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.inputBorder,
    backgroundColor: theme.inputBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: theme.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: theme.border,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});