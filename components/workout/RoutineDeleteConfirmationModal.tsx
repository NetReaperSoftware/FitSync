import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface RoutineDeleteConfirmationModalProps {
  visible: boolean;
  routineName: string;
  exerciseCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function RoutineDeleteConfirmationModal({
  visible,
  routineName,
  exerciseCount,
  onConfirm,
  onCancel
}: RoutineDeleteConfirmationModalProps) {
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
          <Text style={styles.modalHeader}>Delete Routine</Text>
          
          <View style={styles.warningContainer}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              This routine contains {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'}
            </Text>
          </View>
          
          <Text style={styles.confirmationText}>
            Deleting "{routineName}" will permanently remove this routine. This action cannot be undone.
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
              <Text style={styles.deleteButtonText}>Delete</Text>
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