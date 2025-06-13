import { useState, useCallback } from 'react';
import { workoutStorageService, WorkoutSession } from '../services/WorkoutStorageService';
import { debouncedStorageService } from '../services/DebouncedStorageService';

export type ExerciseSet = {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
};

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: ExerciseSet[];
  notes?: string;
};

export type DatabaseExercise = {
  id: string;
  name: string;
  category: string;
  muscle_group_primary: string;
  muscle_group_secondary: string;
  equipment: string;
  degree?: number;
};

export const useActiveWorkout = () => {
  const [activeWorkoutVisible, setActiveWorkoutVisible] = useState(false);
  const [isWorkoutMinimized, setIsWorkoutMinimized] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [currentWorkoutExercises, setCurrentWorkoutExercises] = useState<Exercise[]>([]);
  const [workoutPauseTime, setWorkoutPauseTime] = useState<Date | null>(null);
  const [totalPausedDuration, setTotalPausedDuration] = useState(0);
  const [currentWorkoutId, setCurrentWorkoutId] = useState<string | null>(null);
  const [workoutOverviewVisible, setWorkoutOverviewVisible] = useState(false);
  const [workoutEndTime, setWorkoutEndTime] = useState<Date | null>(null);
  const [currentRoutineName, setCurrentRoutineName] = useState<string | null>(null);

  // Restore active workout from storage on app start
  const restoreActiveWorkout = useCallback(async () => {
    try {
      const activeWorkout = await workoutStorageService.loadActiveWorkout();
      if (activeWorkout && activeWorkout.status === 'active') {
        setCurrentWorkoutId(activeWorkout.id);
        setWorkoutStartTime(activeWorkout.startTime);
        setCurrentWorkoutExercises(activeWorkout.exercises);
        setTotalPausedDuration(activeWorkout.totalPausedDuration);
        setIsWorkoutMinimized(true); // Start minimized so user can restore when ready
        console.log('Restored active workout:', activeWorkout.id);
      }
    } catch (error) {
      console.error('Error restoring active workout:', error);
    }
  }, []);

  // Start new workout
  const startNewWorkout = useCallback(async () => {
    const workoutId = workoutStorageService.generateWorkoutId();
    const startTime = new Date();
    
    setCurrentWorkoutId(workoutId);
    setActiveWorkoutVisible(true);
    setWorkoutStartTime(startTime);
    setCurrentWorkoutExercises([]);
    setCurrentRoutineName(null);
    setIsWorkoutMinimized(false);
    setWorkoutPauseTime(null);
    setTotalPausedDuration(0);

    // Save initial workout to storage
    const initialWorkout: WorkoutSession = {
      id: workoutId,
      startTime,
      exercises: [],
      totalPausedDuration: 0,
      status: 'active'
    };
    
    await workoutStorageService.saveActiveWorkout(initialWorkout);
  }, []);

  // Start workout from routine template
  const startWorkoutFromRoutine = useCallback(async (routineExercises: Exercise[], routineName?: string) => {
    const workoutId = workoutStorageService.generateWorkoutId();
    const startTime = new Date();
    
    setCurrentWorkoutId(workoutId);
    setActiveWorkoutVisible(true);
    setWorkoutStartTime(startTime);
    setCurrentWorkoutExercises(routineExercises);
    setCurrentRoutineName(routineName || null);
    setIsWorkoutMinimized(false);
    setWorkoutPauseTime(null);
    setTotalPausedDuration(0);

    // Save initial workout to storage
    const initialWorkout: WorkoutSession = {
      id: workoutId,
      startTime,
      exercises: routineExercises,
      totalPausedDuration: 0,
      status: 'active'
    };
    
    await workoutStorageService.saveActiveWorkout(initialWorkout);
  }, []);

  // Minimize workout
  const minimizeWorkout = useCallback(() => {
    setIsWorkoutMinimized(true);
    setActiveWorkoutVisible(false);
    setWorkoutPauseTime(new Date()); // Start pause timer
  }, []);

  // Restore workout
  const restoreWorkout = useCallback(() => {
    setIsWorkoutMinimized(false);
    setActiveWorkoutVisible(true);
    
    // Calculate paused duration and add to total
    if (workoutPauseTime) {
      const pausedDuration = new Date().getTime() - workoutPauseTime.getTime();
      setTotalPausedDuration(prev => prev + pausedDuration);
      setWorkoutPauseTime(null);
    }
  }, [workoutPauseTime]);

  // Add exercise to workout
  const addExerciseToWorkout = useCallback(async (exercise: DatabaseExercise) => {
    const newExercise: Exercise = {
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscle_group_primary,
      sets: [{
        id: `s${Date.now()}-1`,
        weight: 0,
        reps: 0,
        completed: false,
      }],
    };
    
    const updatedExercises = [...currentWorkoutExercises, newExercise];
    setCurrentWorkoutExercises(updatedExercises);

    // Save to storage
    if (currentWorkoutId && workoutStartTime) {
      const workout: WorkoutSession = {
        id: currentWorkoutId,
        startTime: workoutStartTime,
        exercises: updatedExercises,
        totalPausedDuration,
        status: 'active'
      };
      await workoutStorageService.saveActiveWorkout(workout);
    }
  }, [currentWorkoutExercises, currentWorkoutId, workoutStartTime, totalPausedDuration]);

  // Toggle set completion
  const toggleActiveWorkoutSetCompletion = useCallback(async (exerciseId: string, setId: string) => {
    let updatedExercises: Exercise[] = [];
    
    setCurrentWorkoutExercises(prevExercises => {
      updatedExercises = prevExercises.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;
        
        const updatedSets = exercise.sets.map(set => {
          if (set.id !== setId) return set;
          return { ...set, completed: !set.completed };
        });
        
        return { ...exercise, sets: updatedSets };
      });
      return updatedExercises;
    });

    // Save to storage with immediate save for completion toggles
    if (currentWorkoutId && workoutStartTime) {
      const workout: WorkoutSession = {
        id: currentWorkoutId,
        startTime: workoutStartTime,
        exercises: updatedExercises,
        totalPausedDuration,
        status: 'active'
      };
      await debouncedStorageService.immediateSaveWorkout(workout);
    }
  }, [currentWorkoutId, workoutStartTime, totalPausedDuration]);

  // Update set values (weight/reps)
  const updateActiveWorkoutSet = useCallback((exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) => {
    let updatedExercises: Exercise[] = [];
    
    setCurrentWorkoutExercises(prevExercises => {
      updatedExercises = prevExercises.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;
        
        const updatedSets = exercise.sets.map(set => {
          if (set.id !== setId) return set;
          return { ...set, [field]: value };
        });
        
        return { ...exercise, sets: updatedSets };
      });
      return updatedExercises;
    });

    // Save to storage with debouncing for text input changes
    if (currentWorkoutId && workoutStartTime) {
      const workout: WorkoutSession = {
        id: currentWorkoutId,
        startTime: workoutStartTime,
        exercises: updatedExercises,
        totalPausedDuration,
        status: 'active'
      };
      debouncedStorageService.debouncedSaveWorkout(workout);
    }
  }, [currentWorkoutId, workoutStartTime, totalPausedDuration]);

  // Add set to exercise
  const addSetToExercise = useCallback(async (exerciseId: string) => {
    let updatedExercises: Exercise[] = [];
    
    setCurrentWorkoutExercises(prevExercises => {
      updatedExercises = prevExercises.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;
        
        const newSet: ExerciseSet = {
          id: `s${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          weight: 0,
          reps: 0,
          completed: false,
        };
        
        return { ...exercise, sets: [...exercise.sets, newSet] };
      });
      return updatedExercises;
    });

    // Save to storage
    if (currentWorkoutId && workoutStartTime) {
      const workout: WorkoutSession = {
        id: currentWorkoutId,
        startTime: workoutStartTime,
        exercises: updatedExercises,
        totalPausedDuration,
        status: 'active'
      };
      await workoutStorageService.saveActiveWorkout(workout);
    }
  }, [currentWorkoutId, workoutStartTime, totalPausedDuration]);

  // Remove set from exercise
  const removeSetFromExercise = useCallback(async (exerciseId: string, setId: string) => {
    let updatedExercises: Exercise[] = [];
    
    setCurrentWorkoutExercises(prevExercises => {
      updatedExercises = prevExercises.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;
        
        if (exercise.sets.length <= 1) return exercise;
        
        const updatedSets = exercise.sets.filter(set => set.id !== setId);
        return { ...exercise, sets: updatedSets };
      });
      return updatedExercises;
    });

    // Save to storage
    if (currentWorkoutId && workoutStartTime) {
      const workout: WorkoutSession = {
        id: currentWorkoutId,
        startTime: workoutStartTime,
        exercises: updatedExercises,
        totalPausedDuration,
        status: 'active'
      };
      await workoutStorageService.saveActiveWorkout(workout);
    }
  }, [currentWorkoutId, workoutStartTime, totalPausedDuration]);

  // Finish workout (show overview)
  const finishWorkout = useCallback(async () => {
    const endTime = new Date();
    setWorkoutEndTime(endTime);
    setActiveWorkoutVisible(false);
    setWorkoutOverviewVisible(true);
  }, []);

  // Save workout (from overview)
  const saveWorkout = useCallback(async (notes: string) => {
    if (!currentWorkoutId || !workoutStartTime || !workoutEndTime) return null;

    try {
      // Cancel any pending debounced updates
      debouncedStorageService.cancelPendingSaves();
      
      // Create completed workout
      const completedWorkout: WorkoutSession = {
        id: currentWorkoutId,
        startTime: workoutStartTime,
        endTime: workoutEndTime,
        exercises: currentWorkoutExercises,
        totalPausedDuration,
        status: 'completed',
        notes: notes.trim() || undefined
      };
      
      // Save to storage
      await workoutStorageService.saveCompletedWorkout(completedWorkout);
      
      // Clear active workout from storage
      await workoutStorageService.clearActiveWorkout();
      
      // Reset state
      setActiveWorkoutVisible(false);
      setWorkoutOverviewVisible(false);
      setIsWorkoutMinimized(false);
      setWorkoutStartTime(null);
      setWorkoutEndTime(null);
      setCurrentWorkoutExercises([]);
      setCurrentRoutineName(null);
      setWorkoutPauseTime(null);
      setTotalPausedDuration(0);
      setCurrentWorkoutId(null);
      
      return completedWorkout;
    } catch (error) {
      console.error('Error saving workout:', error);
      return null;
    }
  }, [currentWorkoutId, workoutStartTime, workoutEndTime, currentWorkoutExercises, totalPausedDuration]);

  // Cancel overview (go back to workout)
  const cancelOverview = useCallback(() => {
    setWorkoutOverviewVisible(false);
    setActiveWorkoutVisible(true);
    setWorkoutEndTime(null);
  }, []);

  // Discard workout
  const discardWorkout = useCallback(async () => {
    try {
      // Cancel any pending debounced updates
      debouncedStorageService.cancelPendingSaves();
      
      // Clear active workout from storage
      await workoutStorageService.clearActiveWorkout();
      
      // Reset state
      setActiveWorkoutVisible(false);
      setWorkoutOverviewVisible(false);
      setIsWorkoutMinimized(false);
      setWorkoutStartTime(null);
      setWorkoutEndTime(null);
      setCurrentWorkoutExercises([]);
      setWorkoutPauseTime(null);
      setTotalPausedDuration(0);
      setCurrentWorkoutId(null);
    } catch (error) {
      console.error('Error discarding workout:', error);
    }
  }, []);

  return {
    // State
    activeWorkoutVisible,
    isWorkoutMinimized,
    workoutStartTime,
    workoutEndTime,
    currentWorkoutExercises,
    workoutPauseTime,
    totalPausedDuration,
    currentWorkoutId,
    workoutOverviewVisible,
    currentRoutineName,

    // Actions
    restoreActiveWorkout,
    startNewWorkout,
    startWorkoutFromRoutine,
    minimizeWorkout,
    restoreWorkout,
    addExerciseToWorkout,
    toggleActiveWorkoutSetCompletion,
    updateActiveWorkoutSet,
    addSetToExercise,
    removeSetFromExercise,
    finishWorkout,
    saveWorkout,
    cancelOverview,
    discardWorkout,

    // Setters (for specific use cases)
    setActiveWorkoutVisible,
    setCurrentWorkoutExercises,
  };
};