import AsyncStorage from '@react-native-async-storage/async-storage';

export type WorkoutSet = {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  completedAt?: Date;
};

export type WorkoutExercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: WorkoutSet[];
  notes?: string;
};

export type WorkoutSession = {
  id: string;
  startTime: Date;
  endTime?: Date;
  exercises: WorkoutExercise[];
  totalPausedDuration: number;
  status: 'active' | 'completed' | 'discarded';
  notes?: string;
};

const ACTIVE_WORKOUT_KEY = 'active_workout';
const COMPLETED_WORKOUTS_KEY = 'completed_workouts';

class WorkoutStorageService {
  // Save active workout to local storage
  async saveActiveWorkout(workout: WorkoutSession): Promise<void> {
    try {
      const workoutData = {
        ...workout,
        startTime: workout.startTime.toISOString(),
        endTime: workout.endTime?.toISOString(),
        exercises: workout.exercises.map(exercise => ({
          ...exercise,
          sets: exercise.sets.map(set => ({
            ...set,
            completedAt: set.completedAt?.toISOString()
          }))
        }))
      };
      
      await AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(workoutData));
    } catch (error) {
      console.error('Error saving active workout:', error);
    }
  }

  // Load active workout from local storage
  async loadActiveWorkout(): Promise<WorkoutSession | null> {
    try {
      const workoutData = await AsyncStorage.getItem(ACTIVE_WORKOUT_KEY);
      if (!workoutData) return null;

      const parsed = JSON.parse(workoutData);
      return {
        ...parsed,
        startTime: new Date(parsed.startTime),
        endTime: parsed.endTime ? new Date(parsed.endTime) : undefined,
        exercises: parsed.exercises.map((exercise: any) => ({
          ...exercise,
          sets: exercise.sets.map((set: any) => ({
            ...set,
            completedAt: set.completedAt ? new Date(set.completedAt) : undefined
          }))
        }))
      };
    } catch (error) {
      console.error('Error loading active workout:', error);
      return null;
    }
  }

  // Clear active workout (when completed or discarded)
  async clearActiveWorkout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ACTIVE_WORKOUT_KEY);
    } catch (error) {
      console.error('Error clearing active workout:', error);
    }
  }

  // Save completed workout
  async saveCompletedWorkout(workout: WorkoutSession): Promise<void> {
    try {
      const completedWorkouts = await this.getCompletedWorkouts();
      const workoutToSave = {
        ...workout,
        status: 'completed' as const,
        endTime: workout.endTime || new Date()
      };
      
      completedWorkouts.push(workoutToSave);
      
      const workoutData = completedWorkouts.map(w => ({
        ...w,
        startTime: w.startTime.toISOString(),
        endTime: w.endTime?.toISOString(),
        exercises: w.exercises.map(exercise => ({
          ...exercise,
          sets: exercise.sets.map(set => ({
            ...set,
            completedAt: set.completedAt?.toISOString()
          }))
        }))
      }));
      
      await AsyncStorage.setItem(COMPLETED_WORKOUTS_KEY, JSON.stringify(workoutData));
    } catch (error) {
      console.error('Error saving completed workout:', error);
    }
  }

  // Get completed workouts
  async getCompletedWorkouts(): Promise<WorkoutSession[]> {
    try {
      const workoutsData = await AsyncStorage.getItem(COMPLETED_WORKOUTS_KEY);
      if (!workoutsData) return [];

      const parsed = JSON.parse(workoutsData);
      return parsed.map((workout: any) => ({
        ...workout,
        startTime: new Date(workout.startTime),
        endTime: workout.endTime ? new Date(workout.endTime) : undefined,
        exercises: workout.exercises.map((exercise: any) => ({
          ...exercise,
          sets: exercise.sets.map((set: any) => ({
            ...set,
            completedAt: set.completedAt ? new Date(set.completedAt) : undefined
          }))
        }))
      }));
    } catch (error) {
      console.error('Error loading completed workouts:', error);
      return [];
    }
  }

  // Update active workout set (when user changes weight/reps or marks as done)
  async updateActiveWorkoutSet(
    exerciseId: string, 
    setId: string, 
    updates: Partial<WorkoutSet>
  ): Promise<void> {
    try {
      const activeWorkout = await this.loadActiveWorkout();
      if (!activeWorkout) return;

      const updatedExercises = activeWorkout.exercises.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;
        
        const updatedSets = exercise.sets.map(set => {
          if (set.id !== setId) return set;
          
          const updatedSet = { ...set, ...updates };
          
          // If marking as completed, add completion timestamp
          if (updates.completed === true && !set.completed) {
            updatedSet.completedAt = new Date();
          } else if (updates.completed === false) {
            updatedSet.completedAt = undefined;
          }
          
          return updatedSet;
        });
        
        return { ...exercise, sets: updatedSets };
      });

      await this.saveActiveWorkout({
        ...activeWorkout,
        exercises: updatedExercises
      });
    } catch (error) {
      console.error('Error updating active workout set:', error);
    }
  }

  // Generate unique ID for workout sessions
  generateWorkoutId(): string {
    return `workout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const workoutStorageService = new WorkoutStorageService();