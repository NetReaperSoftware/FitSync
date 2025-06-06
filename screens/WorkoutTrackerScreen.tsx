import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  FlatList,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type ExerciseSet = {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
};

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: ExerciseSet[];
};

type Workout = {
  id: string;
  name: string;
  exercises: Exercise[];
  date: Date;
  completed: boolean;
};

export default function WorkoutTrackerScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const [workouts, setWorkouts] = useState<Workout[]>([
    {
      id: '1',
      name: 'Upper Body Strength',
      exercises: [
        {
          id: 'e1',
          name: 'Bench Press',
          muscleGroup: 'Chest',
          sets: [
            { id: 's1', weight: 135, reps: 10, completed: true },
            { id: 's2', weight: 155, reps: 8, completed: true },
            { id: 's3', weight: 175, reps: 6, completed: false },
          ],
        },
        {
          id: 'e2',
          name: 'Pull-ups',
          muscleGroup: 'Back',
          sets: [
            { id: 's4', weight: 0, reps: 10, completed: true },
            { id: 's5', weight: 0, reps: 8, completed: false },
            { id: 's6', weight: 0, reps: 8, completed: false },
          ],
        },
      ],
      date: new Date(),
      completed: false,
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [exerciseLibrary, setExerciseLibrary] = useState([
    { id: 'el1', name: 'Bench Press', muscleGroup: 'Chest' },
    { id: 'el2', name: 'Squats', muscleGroup: 'Legs' },
    { id: 'el3', name: 'Deadlift', muscleGroup: 'Back' },
    { id: 'el4', name: 'Pull-ups', muscleGroup: 'Back' },
    { id: 'el5', name: 'Shoulder Press', muscleGroup: 'Shoulders' },
  ]);
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

  const toggleSetCompletion = (workoutId: string, exerciseId: string, setId: string) => {
    setWorkouts(prevWorkouts => 
      prevWorkouts.map(workout => {
        if (workout.id !== workoutId) return workout;
        
        const updatedExercises = workout.exercises.map(exercise => {
          if (exercise.id !== exerciseId) return exercise;
          
          const updatedSets = exercise.sets.map(set => {
            if (set.id !== setId) return set;
            return { ...set, completed: !set.completed };
          });
          
          return { ...exercise, sets: updatedSets };
        });
        
        return { ...workout, exercises: updatedExercises };
      })
    );
  };

  const createNewWorkout = () => {
    if (!newWorkoutName.trim()) return;
    
    const selectedExercisesData = exerciseLibrary
      .filter(ex => selectedExercises.includes(ex.id))
      .map(ex => ({
        id: `e${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: [1, 2, 3].map((_, idx) => ({
          id: `s${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${idx}`,
          weight: 0,
          reps: 10,
          completed: false,
        })),
      }));
    
    const newWorkout: Workout = {
      id: `w${Date.now()}`,
      name: newWorkoutName,
      exercises: selectedExercisesData,
      date: new Date(),
      completed: false,
    };
    
    setWorkouts([...workouts, newWorkout]);
    setModalVisible(false);
    setNewWorkoutName('');
    setSelectedExercises([]);
  };

  const toggleExerciseSelection = (exerciseId: string) => {
    if (selectedExercises.includes(exerciseId)) {
      setSelectedExercises(selectedExercises.filter(id => id !== exerciseId));
    } else {
      setSelectedExercises([...selectedExercises, exerciseId]);
    }
  };

  const styles = createStyles(theme);

  const renderWorkout = (workout: Workout) => {
    return (
      <View key={workout.id} style={styles.workoutCard}>
        <Text style={styles.workoutTitle}>{workout.name}</Text>
        <Text style={styles.workoutDate}>
          {workout.date.toLocaleDateString()}
        </Text>
        
        {workout.exercises.map(exercise => (
          <View key={exercise.id} style={styles.exerciseContainer}>
            <Text style={styles.exerciseName}>
              {exercise.name} - {exercise.muscleGroup}
            </Text>
            
            <View style={styles.setsHeader}>
              <Text style={styles.setHeaderText}>Set</Text>
              <Text style={styles.setHeaderText}>Weight</Text>
              <Text style={styles.setHeaderText}>Reps</Text>
              <Text style={styles.setHeaderText}>Done</Text>
            </View>
            
            {exercise.sets.map((set, index) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={styles.setText}>{index + 1}</Text>
                <Text style={styles.setText}>{set.weight > 0 ? `${set.weight} lbs` : 'BW'}</Text>
                <Text style={styles.setText}>{set.reps}</Text>
                <TouchableOpacity
                  style={[
                    styles.completionButton,
                    set.completed ? styles.completedButton : styles.pendingButton,
                  ]}
                  onPress={() => toggleSetCompletion(workout.id, exercise.id, set.id)}
                >
                  <Text style={styles.completionButtonText}>
                    {set.completed ? '✓' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
            <Text style={styles.header}>Workout Tracker</Text>
            
            {workouts.map(workout => renderWorkout(workout))}
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addButtonText}>+ Create New Workout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* New Workout Modal */}
        <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>Create New Workout</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Workout Name"
              placeholderTextColor={theme.textMuted}
              value={newWorkoutName}
              onChangeText={setNewWorkoutName}
            />
            
            <Text style={styles.sectionTitle}>Select Exercises:</Text>
            
            <ScrollView style={styles.exerciseList}>
              {exerciseLibrary.map(exercise => (
                <TouchableOpacity
                  key={exercise.id}
                  style={[
                    styles.exerciseItem,
                    selectedExercises.includes(exercise.id) && styles.selectedExercise,
                  ]}
                  onPress={() => toggleExerciseSelection(exercise.id)}
                >
                  <Text style={styles.exerciseItemText}>
                    {exercise.name} - {exercise.muscleGroup}
                  </Text>
                  {selectedExercises.includes(exercise.id) && (
                    <Text style={styles.selectedIcon}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={createNewWorkout}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
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
  workoutCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 16,
  },
  exerciseContainer: {
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
    paddingTop: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
    marginBottom: 8,
  },
  setHeaderText: {
    fontWeight: '600',
    color: theme.textSecondary,
    flex: 1,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  setText: {
    flex: 1,
    textAlign: 'center',
    color: theme.text,
  },
  completionButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 10,
  },
  completedButton: {
    backgroundColor: theme.success,
  },
  pendingButton: {
    backgroundColor: theme.border,
  },
  completionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
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
    maxHeight: '80%',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.text,
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
  selectedExercise: {
    backgroundColor: theme.primaryVariant + '20',
  },
  exerciseItemText: {
    fontSize: 16,
    color: theme.text,
  },
  selectedIcon: {
    color: theme.primary,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: theme.border,
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: theme.primary,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});