import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  FlatList
} from 'react-native';

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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#333',
    textAlign: 'center',
  },
  workoutCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  workoutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  exerciseContainer: {
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  setsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 8,
  },
  setHeaderText: {
    fontWeight: '600',
    color: '#666',
    flex: 1,
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  setText: {
    flex: 1,
    textAlign: 'center',
    color: '#444',
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
    backgroundColor: '#4CAF50',
  },
  pendingButton: {
    backgroundColor: '#e0e0e0',
  },
  completionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#4285F4',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#444',
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
    borderBottomColor: '#eee',
  },
  selectedExercise: {
    backgroundColor: '#e6f2ff',
  },
  exerciseItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedIcon: {
    color: '#4285F4',
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
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#4285F4',
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});