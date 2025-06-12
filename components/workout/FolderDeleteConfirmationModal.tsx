import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface FolderDeleteConfirmationModalProps {
  visible: boolean;
  folderName: string;
  routineCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function FolderDeleteConfirmationModal({
  visible,
  folderName,
  routineCount,
  onConfirm,
  onCancel
}: FolderDeleteConfirmationModalProps) {
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
          <Text style={styles.modalHeader}>Delete Folder</Text>
          
          <View style={styles.warningContainer}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              This folder contains {routineCount} routine{routineCount === 1 ? '' : 's'}
            </Text>
          </View>
          
          <Text style={styles.confirmationText}>
            Deleting "{folderName}" will also delete all routines inside it. This action cannot be undone.
          </Text>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={onConfirm}
            >
              <Text style={styles.deleteButtonText}>Delete All</Text>
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
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    padding: 12,
    backgroundColor: theme.warningBackground || 'rgba(255, 204, 0, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.warning || '#FFCC00',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.warning || '#B8860B',
  },
  confirmationText: {
    fontSize: 16,
    color: theme.text,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
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
  deleteButton: {
    backgroundColor: theme.error || '#FF3B30',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});