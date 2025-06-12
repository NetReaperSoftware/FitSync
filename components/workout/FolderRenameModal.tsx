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

interface FolderRenameModalProps {
  visible: boolean;
  folderName: string;
  onFolderNameChange: (name: string) => void;
  onRename: () => void;
  onCancel: () => void;
}

export default function FolderRenameModal({
  visible,
  folderName,
  onFolderNameChange,
  onRename,
  onCancel
}: FolderRenameModalProps) {
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
          <Text style={styles.modalHeader}>Rename Folder</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Folder Name"
            placeholderTextColor={theme.textMuted}
            value={folderName}
            onChangeText={onFolderNameChange}
            autoFocus={true}
            selectTextOnFocus={true}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.renameButton}
              onPress={onRename}
              disabled={!folderName.trim()}
            >
              <Text style={[
                styles.renameButtonText,
                !folderName.trim() && styles.disabledButtonText
              ]}>Rename</Text>
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
    maxWidth: 400,
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
  renameButton: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  renameButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  disabledButtonText: {
    opacity: 0.5,
  },
});