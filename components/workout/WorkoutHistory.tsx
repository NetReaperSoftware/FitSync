import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

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

interface WorkoutHistoryProps {
  workouts: Workout[];
  onToggleSetCompletion: (workoutId: string, exerciseId: string, setId: string) => void;
}

export default function WorkoutHistory({
  workouts,
  onToggleSetCompletion
}: WorkoutHistoryProps) {
  const { theme } = useTheme();
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
                  onPress={() => onToggleSetCompletion(workout.id, exercise.id, set.id)}
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
    <View style={styles.previousWorkoutsSection}>
      <Text style={styles.sectionTitle}>Previous Workouts</Text>
      {workouts.map(workout => renderWorkout(workout))}
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  previousWorkoutsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
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
});