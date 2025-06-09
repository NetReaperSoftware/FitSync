import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type DatabaseExercise = {
  id: string;
  name: string;
  category: string;
  muscle_group_primary: string;
  muscle_group_secondary: string;
  equipment: string;
  degree?: number;
};

interface ExerciseSelectionModalProps {
  visible: boolean;
  exercises: DatabaseExercise[];
  onSelectExercise: (exercise: DatabaseExercise) => void;
  onClose: () => void;
}

export default function ExerciseSelectionModal({
  visible,
  exercises,
  onSelectExercise,
  onClose
}: ExerciseSelectionModalProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalHeader}>Select Exercise</Text>
          
          <ScrollView style={styles.exerciseList}>
            {exercises.map(exercise => (
              <TouchableOpacity
                key={exercise.id}
                style={styles.exerciseItem}
                onPress={() => onSelectExercise(exercise)}
              >
                <Text style={styles.exerciseItemText}>
                  {exercise.name} - {exercise.muscle_group_primary}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
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
    zIndex: 9999,
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
  exerciseList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  exerciseItemText: {
    fontSize: 16,
    color: theme.text,
  },
  cancelButton: {
    backgroundColor: theme.border,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontWeight: '600',
  },
});