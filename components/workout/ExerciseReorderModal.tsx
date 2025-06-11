import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: any[];
};

interface ExerciseReorderModalProps {
  visible: boolean;
  exercises: Exercise[];
  onCancel: () => void;
  onSave: (reorderedExercises: Exercise[]) => void;
}

export default function ExerciseReorderModal({
  visible,
  exercises,
  onCancel,
  onSave
}: ExerciseReorderModalProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [reorderedExercises, setReorderedExercises] = React.useState<Exercise[]>(exercises);

  React.useEffect(() => {
    setReorderedExercises(exercises);
  }, [exercises]);

  const moveExercise = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= reorderedExercises.length) return;
    
    const updatedExercises = [...reorderedExercises];
    const [movedExercise] = updatedExercises.splice(fromIndex, 1);
    updatedExercises.splice(toIndex, 0, movedExercise);
    setReorderedExercises(updatedExercises);
  };

  const handleSave = () => {
    onSave(reorderedExercises);
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.title}>Reorder Exercises</Text>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.content}>
              <Text style={styles.instructions}>
                Use the up and down arrows to reorder your exercises
              </Text>
              
              {reorderedExercises.map((exercise, index) => (
                <View key={exercise.id} style={styles.exerciseItem}>
                  <View style={styles.exerciseInfo}>
                    <Text style={styles.exerciseNumber}>{index + 1}.</Text>
                    <View style={styles.exerciseDetails}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseMuscleGroup}>{exercise.muscleGroup}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.reorderButtons}>
                    <TouchableOpacity
                      style={[styles.reorderButton, index === 0 && styles.disabledButton]}
                      onPress={() => moveExercise(index, index - 1)}
                      disabled={index === 0}
                    >
                      <Text style={[styles.reorderButtonText, index === 0 && styles.disabledButtonText]}>▲</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.reorderButton, index === reorderedExercises.length - 1 && styles.disabledButton]}
                      onPress={() => moveExercise(index, index + 1)}
                      disabled={index === reorderedExercises.length - 1}
                    >
                      <Text style={[styles.reorderButtonText, index === reorderedExercises.length - 1 && styles.disabledButtonText]}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  saveButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  instructions: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primary,
    marginRight: 12,
    minWidth: 25,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  exerciseMuscleGroup: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  reorderButtons: {
    flexDirection: 'column',
  },
  reorderButton: {
    backgroundColor: theme.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 2,
    alignItems: 'center',
    minWidth: 40,
  },
  disabledButton: {
    backgroundColor: theme.border,
  },
  reorderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: theme.textMuted,
  },
});