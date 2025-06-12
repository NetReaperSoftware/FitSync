import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../supabaseClient';
import ActiveWorkoutModal from '../components/workout/ActiveWorkoutModal';
import RoutineCreationModal from '../components/workout/RoutineCreationModal';
import FolderCreationModal from '../components/workout/FolderCreationModal';
import RoutineRenameModal from '../components/workout/RoutineRenameModal';
import FolderRenameModal from '../components/workout/FolderRenameModal';
import FolderDeleteConfirmationModal from '../components/workout/FolderDeleteConfirmationModal';
import OptionsBottomSheet from '../components/workout/OptionsBottomSheet';
import RoutinesList from '../components/workout/RoutinesList';
import ExerciseSelectionScreen from './ExerciseSelectionScreen';
import { dataSyncService } from '../services/DataSyncService';

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
  notes?: string;
};

type DatabaseExercise = {
  id: string;
  name: string;
  category: string;
  muscle_group_primary: string;
  muscle_group_secondary: string;
  equipment: string;
  degree?: number;
};

type Routine = {
  id: string;
  name: string;
  exercises: Exercise[];
  folderId?: string;
  isDefault?: boolean;
  isUserOwned?: boolean;
};

type Folder = {
  id: string;
  name: string;
  isDefault?: boolean;
  isUserOwned?: boolean;
};

export default function WorkoutTrackerScreen(): React.JSX.Element {
  const { theme } = useTheme();

  const [activeWorkoutVisible, setActiveWorkoutVisible] = useState(false);
  const [isWorkoutMinimized, setIsWorkoutMinimized] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [currentWorkoutExercises, setCurrentWorkoutExercises] = useState<Exercise[]>([]);
  const [exerciseLibrary, setExerciseLibrary] = useState<DatabaseExercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [exerciseScreenVisible, setExerciseScreenVisible] = useState(false);
  const [routineCreationVisible, setRoutineCreationVisible] = useState(false);
  const [currentRoutineExercises, setCurrentRoutineExercises] = useState<Exercise[]>([]);
  const [routineName, setRoutineName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
  const [folderCreationVisible, setFolderCreationVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [routineRenameVisible, setRoutineRenameVisible] = useState(false);
  const [renamingRoutineId, setRenamingRoutineId] = useState<string | null>(null);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [folderRenameVisible, setFolderRenameVisible] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [bottomSheetOptions, setBottomSheetOptions] = useState<any[]>([]);
  const [bottomSheetTitle, setBottomSheetTitle] = useState<string | undefined>(undefined);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [replacingExerciseIndex, setReplacingExerciseIndex] = useState<number | null>(null);
  const [isCreatingCopy, setIsCreatingCopy] = useState<boolean>(false);
  const [folderDeleteConfirmVisible, setFolderDeleteConfirmVisible] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);
  const [workoutPauseTime, setWorkoutPauseTime] = useState<Date | null>(null);
  const [totalPausedDuration, setTotalPausedDuration] = useState(0);

  const styles = createStyles(theme);


  
  // Fetch exercises, routines, and folders from database
  useEffect(() => {
    fetchExercises();
    fetchFolders();
    fetchRoutines();
    
    // Log sync status every 5 seconds for debugging
    const syncStatusInterval = setInterval(() => {
      const status = dataSyncService.getSyncStatus();
      if (status.queueLength > 0) {
        console.log('📊 DataSync Status:', status);
      }
    }, 5000);

    // Add global debugging functions
    if (__DEV__) {
      // @ts-ignore
      global.syncStatus = () => {
        const status = dataSyncService.getSyncStatus();
        console.log('📊 Current Sync Status:', JSON.stringify(status, null, 2));
        return status;
      };
      // @ts-ignore
      global.forceSync = () => {
        console.log('🔄 Forcing sync manually...');
        dataSyncService.forceSyncNow();
      };
      // @ts-ignore
      global.clearSync = () => {
        dataSyncService.clearSyncQueue();
      };
      // @ts-ignore
      global.testFolderDelete = (folderId) => {
        console.log('🧪 Testing folder deletion for:', folderId);
        deleteFolder(folderId);
      };
      // @ts-ignore
      global.testFolderRename = (folderId, newName) => {
        console.log('🧪 Testing folder rename for:', folderId, 'to:', newName);
        renameFolderOptimistic(folderId, newName);
      };
      console.log('🔧 Debug functions available: syncStatus(), forceSync(), clearSync(), testFolderDelete(id), testFolderRename(id, name)');
    }

    return () => clearInterval(syncStatusInterval);
  }, []);

  const fetchExercises = async () => {
    const { data, error } = await supabase
      .schema('fitness')
      .from('exercises')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching exercises:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
    } else {
      setExerciseLibrary(data as DatabaseExercise[]);
      console.log('Successfully fetched exercises:', data?.length || 0);
    }
  };

  const fetchFolders = async () => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      // Fetch both default folders and user-created folders
      const { data: foldersData, error: foldersError } = await supabase
        .schema('fitness')
        .from('workout_routine_folders')
        .select('id, name, description, is_default, created_by')
        .or(`is_default.eq.true,created_by.eq.${userId}`)
        .order('name');

      if (foldersError) {
        console.error('Error fetching folders:', foldersError);
        return;
      }

      if (!foldersData) {
        console.log('No folders found');
        return;
      }

      // Convert database folders to app format
      const convertedFolders: Folder[] = foldersData.map((dbFolder: any) => ({
        id: dbFolder.id,
        name: dbFolder.name,
        isDefault: dbFolder.is_default,
        isUserOwned: dbFolder.created_by === userId
      }));

      setFolders(convertedFolders);
      console.log('Successfully fetched folders:', convertedFolders.length);
    } catch (error) {
      console.error('Unexpected error fetching folders:', error);
    }
  };

  const fetchRoutines = async () => {
    try {
      // Fetch both default routines and user-created routines
      const { data: routinesData, error: routinesError } = await supabase
        .schema('fitness')
        .from('workout_routines')
        .select(`
          id,
          name,
          description,
          is_default,
          created_by,
          folder_id,
          workout_routine_exercises (
            id,
            sets,
            reps,
            weight_lbs,
            order_in_routine,
            exercises (
              id,
              name,
              muscle_group_primary
            )
          )
        `)
        .or(`is_default.eq.true,created_by.eq.${(await supabase.auth.getUser()).data.user?.id}`)
        .order('name');

      if (routinesError) {
        console.error('Error fetching routines:', routinesError);
        return;
      }

      if (!routinesData) {
        console.log('No routines found');
        return;
      }

      // Convert database routines to app format
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;
      
      const convertedRoutines: Routine[] = routinesData.map((dbRoutine: any) => {
        // Group routine exercises by exercise_id to reconstruct sets
        const exerciseGroups = new Map();
        
        dbRoutine.workout_routine_exercises
          .sort((a: any, b: any) => a.order_in_routine - b.order_in_routine || (a.set_number || 0) - (b.set_number || 0))
          .forEach((dbExercise: any) => {
            const exerciseId = dbExercise.exercises.id;
            if (!exerciseGroups.has(exerciseId)) {
              exerciseGroups.set(exerciseId, {
                id: exerciseId,
                name: dbExercise.exercises.name,
                muscleGroup: dbExercise.exercises.muscle_group_primary,
                sets: [],
                order: dbExercise.order_in_routine
              });
            }
            
            // Add this set to the exercise
            exerciseGroups.get(exerciseId).sets.push({
              id: `s${dbExercise.id}`,
              weight: dbExercise.weight_lbs || 0,
              reps: dbExercise.reps || 0,
              completed: false
            });
          });
        
        return {
          id: dbRoutine.id,
          name: dbRoutine.name,
          exercises: Array.from(exerciseGroups.values())
            .sort((a, b) => a.order - b.order)
            .map(({ order, ...exercise }) => exercise), // Remove order field
          folderId: dbRoutine.folder_id,
          isDefault: dbRoutine.is_default,
          isUserOwned: dbRoutine.created_by === userId
        };
      });

      setRoutines(convertedRoutines);
      console.log('Successfully fetched routines:', convertedRoutines.length);
    } catch (error) {
      console.error('Unexpected error fetching routines:', error);
    }
  };

  // Workout functions
  const startNewWorkout = () => {
    setActiveWorkoutVisible(true);
    setWorkoutStartTime(new Date());
    setCurrentWorkoutExercises([]);
    setIsWorkoutMinimized(false);
    setWorkoutPauseTime(null);
    setTotalPausedDuration(0);
  };

  const minimizeWorkout = () => {
    setIsWorkoutMinimized(true);
    setActiveWorkoutVisible(false);
    setWorkoutPauseTime(new Date()); // Start pause timer
  };

  const restoreWorkout = () => {
    setIsWorkoutMinimized(false);
    setActiveWorkoutVisible(true);
    
    // Calculate paused duration and add to total
    if (workoutPauseTime) {
      const pausedDuration = new Date().getTime() - workoutPauseTime.getTime();
      setTotalPausedDuration(prev => prev + pausedDuration);
      setWorkoutPauseTime(null);
    }
  };

  const finishWorkout = () => {
    setActiveWorkoutVisible(false);
    setIsWorkoutMinimized(false);
    setWorkoutStartTime(null);
    setCurrentWorkoutExercises([]);
    setWorkoutPauseTime(null);
    setTotalPausedDuration(0);
  };

  const discardWorkout = () => {
    setActiveWorkoutVisible(false);
    setIsWorkoutMinimized(false);
    setWorkoutStartTime(null);
    setCurrentWorkoutExercises([]);
    setWorkoutPauseTime(null);
    setTotalPausedDuration(0);
  };

  const addExerciseToWorkout = (exercise: DatabaseExercise) => {
    const newExercise: Exercise = {
      id: exercise.id, // Use the actual database exercise ID
      name: exercise.name,
      muscleGroup: exercise.muscle_group_primary,
      sets: [{
        id: `s${Date.now()}-1`,
        weight: 0,
        reps: 0,
        completed: false,
      }],
    };
    setCurrentWorkoutExercises([...currentWorkoutExercises, newExercise]);
    setExerciseScreenVisible(false);
  };

  const toggleActiveWorkoutSetCompletion = (exerciseId: string, setId: string) => {
    setCurrentWorkoutExercises(prevExercises => 
      prevExercises.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;
        
        const updatedSets = exercise.sets.map(set => {
          if (set.id !== setId) return set;
          return { ...set, completed: !set.completed };
        });
        
        return { ...exercise, sets: updatedSets };
      })
    );
  };

  const updateActiveWorkoutSet = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) => {
    setCurrentWorkoutExercises(prevExercises => 
      prevExercises.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;
        
        const updatedSets = exercise.sets.map(set => {
          if (set.id !== setId) return set;
          return { ...set, [field]: value };
        });
        
        return { ...exercise, sets: updatedSets };
      })
    );
  };

  const addSetToExercise = (exerciseId: string) => {
    setCurrentWorkoutExercises(prevExercises => 
      prevExercises.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;
        
        const newSet: ExerciseSet = {
          id: `s${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          weight: 0,
          reps: 0,
          completed: false,
        };
        
        return { ...exercise, sets: [...exercise.sets, newSet] };
      })
    );
  };

  const removeSetFromExercise = (exerciseId: string, setId: string) => {
    setCurrentWorkoutExercises(prevExercises => 
      prevExercises.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;
        
        if (exercise.sets.length <= 1) return exercise;
        
        const updatedSets = exercise.sets.filter(set => set.id !== setId);
        return { ...exercise, sets: updatedSets };
      })
    );
  };

  // Routine functions
  const startNewRoutine = () => {
    // Find "My Routines" folder and set it as default
    const myRoutinesFolder = folders.find(folder => folder.name === 'My Routines');
    const defaultFolderId = myRoutinesFolder ? myRoutinesFolder.id : folders[0]?.id;
    
    setRoutineCreationVisible(true);
    setCurrentRoutineExercises([]);
    setRoutineName('');
    setSelectedFolder(defaultFolderId);
  };

  const addExerciseToRoutine = (exercise: DatabaseExercise) => {
    const newExercise: Exercise = {
      id: exercise.id, // Use the actual database exercise ID
      name: exercise.name,
      muscleGroup: exercise.muscle_group_primary,
      sets: [{
        id: `s${Date.now()}-1`,
        weight: 0,
        reps: 0,
        completed: false,
      }],
    };
    setCurrentRoutineExercises([...currentRoutineExercises, newExercise]);
    setExerciseScreenVisible(false);
  };

  const updateRoutineExerciseSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
    setCurrentRoutineExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      const exercise = updatedExercises[exerciseIndex];
      if (exercise && exercise.sets[setIndex]) {
        exercise.sets[setIndex] = {
          ...exercise.sets[setIndex],
          [field]: value
        };
      }
      return updatedExercises;
    });
  };

  const addRoutineExerciseSet = (exerciseIndex: number) => {
    setCurrentRoutineExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      const exercise = updatedExercises[exerciseIndex];
      if (exercise) {
        const newSet: ExerciseSet = {
          id: `s${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          weight: 0,
          reps: 0,
          completed: false,
        };
        exercise.sets.push(newSet);
      }
      return updatedExercises;
    });
  };

  const updateExerciseNotes = (exerciseIndex: number, notes: string) => {
    setCurrentRoutineExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      if (updatedExercises[exerciseIndex]) {
        updatedExercises[exerciseIndex] = {
          ...updatedExercises[exerciseIndex],
          notes: notes
        };
      }
      return updatedExercises;
    });
  };

  const removeRoutineExerciseSet = (exerciseIndex: number, setIndex: number) => {
    setCurrentRoutineExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      const exercise = updatedExercises[exerciseIndex];
      if (exercise && exercise.sets.length > 1) { // Don't allow removing the last set
        exercise.sets.splice(setIndex, 1);
      }
      return updatedExercises;
    });
  };

  const removeExerciseFromRoutine = (exerciseIndex: number) => {
    setCurrentRoutineExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      updatedExercises.splice(exerciseIndex, 1);
      return updatedExercises;
    });
  };

  const replaceExerciseInRoutine = (exerciseIndex: number) => {
    setReplacingExerciseIndex(exerciseIndex);
    setExerciseScreenVisible(true);
  };

  const reorderRoutineExercises = (fromIndex: number, toIndex: number) => {
    const reorderedExercises = [...currentRoutineExercises];
    const [movedExercise] = reorderedExercises.splice(fromIndex, 1);
    reorderedExercises.splice(toIndex, 0, movedExercise);
    
    setCurrentRoutineExercises(reorderedExercises);
    
    // If we're editing an existing routine, update the order in the database immediately
    if (editingRoutineId) {
      updateExerciseOrderInDatabase(reorderedExercises);
    }
  };

  const updateExerciseOrderInDatabase = async (reorderedExercises: Exercise[]) => {
    try {
      // Delete existing routine exercises
      const { error: deleteError } = await supabase
        .schema('fitness')
        .from('workout_routine_exercises')
        .delete()
        .eq('routine_id', editingRoutineId);

      if (deleteError) {
        console.error('Error deleting old routine exercises for reorder:', deleteError);
        return;
      }

      // Re-insert exercises with new order
      const routineExercises: any[] = [];
      reorderedExercises.forEach((exercise, exerciseIndex) => {
        exercise.sets.forEach((set, setIndex) => {
          routineExercises.push({
            routine_id: editingRoutineId,
            exercise_id: exercise.id,
            sets: 1,
            reps: set.reps || 0,
            weight_lbs: set.weight || 0,
            order_in_routine: exerciseIndex + 1, // New order based on reordered array
            set_number: setIndex + 1
          });
        });
      });

      const { error: insertError } = await supabase
        .schema('fitness')
        .from('workout_routine_exercises')
        .insert(routineExercises);

      if (insertError) {
        console.error('Error updating exercise order:', insertError);
        return;
      }

      console.log('Successfully updated exercise order in database');
    } catch (error) {
      console.error('Unexpected error updating exercise order:', error);
    }
  };

  const saveRoutine = async () => {
    if (!routineName.trim()) return;
    if (!selectedFolder) {
      console.error('Folder selection is required');
      return;
    }
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.error('No authenticated user');
        return;
      }

      if (editingRoutineId && !editingRoutineId.startsWith('temp_')) {
        // Update existing routine in database (only for real database IDs)
        const { error: routineError } = await supabase
          .schema('fitness')
          .from('workout_routines')
          .update({
            name: routineName,
            folder_id: selectedFolder
          })
          .eq('id', editingRoutineId);

        if (routineError) {
          console.error('Error updating routine:', routineError);
          return;
        }

        // Delete existing exercises for this routine
        const { error: deleteError } = await supabase
          .schema('fitness')
          .from('workout_routine_exercises')
          .delete()
          .eq('routine_id', editingRoutineId);

        if (deleteError) {
          console.error('Error deleting old routine exercises:', deleteError);
          return;
        }

        // Insert updated exercises
        if (currentRoutineExercises.length > 0) {
          const routineExercises: any[] = [];
          currentRoutineExercises.forEach((exercise, exerciseIndex) => {
            exercise.sets.forEach((set, setIndex) => {
              routineExercises.push({
                routine_id: editingRoutineId,
                exercise_id: exercise.id,
                sets: 1, // Each row represents one set
                reps: set.reps || 0,
                weight_lbs: set.weight || 0,
                order_in_routine: exerciseIndex + 1,
                set_number: setIndex + 1
              });
            });
          });

          const { error: exercisesError } = await supabase
            .schema('fitness')
            .from('workout_routine_exercises')
            .insert(routineExercises);

          if (exercisesError) {
            console.error('Error inserting routine exercises:', exercisesError);
            return;
          }
        }

        // Update local state
        setRoutines(routines.map(routine =>
          routine.id === editingRoutineId
            ? {
                ...routine,
                name: routineName,
                exercises: currentRoutineExercises,
                folderId: selectedFolder,
              }
            : routine
        ));
        setEditingRoutineId(null);
      } else if (editingRoutineId && editingRoutineId.startsWith('temp_')) {
        // Editing a temporary routine - replace it with updated version
        console.log('Updating temporary routine:', editingRoutineId);
        
        // Update the existing temporary routine in local state
        setRoutines(prevRoutines => prevRoutines.map(routine =>
          routine.id === editingRoutineId
            ? {
                ...routine,
                name: routineName,
                exercises: currentRoutineExercises,
                folderId: selectedFolder,
              }
            : routine
        ));
        setEditingRoutineId(null);
      } else {
        // OPTIMISTIC UPDATE: Create new routine with temporary ID
        const tempId = dataSyncService.generateTempId();
        const newRoutine: Routine = {
          id: tempId,
          name: routineName,
          exercises: currentRoutineExercises,
          folderId: selectedFolder,
          isDefault: false,
          isUserOwned: true
        };

        // Immediately update UI
        addRoutineToState(newRoutine);
        console.log('Optimistically created routine with temp ID:', tempId);

        // Queue for background sync (now synchronous and instant)
        try {
          const syncTempId = dataSyncService.createRoutineOptimistic({
            name: routineName,
            description: 'User created routine',
            folderId: selectedFolder,
            exercises: currentRoutineExercises,
            tempId: tempId
          });
          console.log('🚀 Routine queued for sync:', routineName, 'with temp ID:', syncTempId);
        } catch (error) {
          console.error('❌ Failed to queue routine creation:', error);
          // Rollback optimistic update
          setRoutines(prevRoutines => prevRoutines.filter(r => r.id !== tempId));
          alert('Failed to save routine. Please try again.');
          return;
        }
      }
      
      setRoutineCreationVisible(false);
      setCurrentRoutineExercises([]);
      setRoutineName('');
      setSelectedFolder(undefined);
    } catch (error) {
      console.error('Unexpected error saving routine:', error);
    }
  };

  const cancelRoutineCreation = () => {
    setRoutineCreationVisible(false);
    setCurrentRoutineExercises([]);
    setRoutineName('');
    setSelectedFolder(undefined);
    setEditingRoutineId(null);
  };

  const editRoutine = async (routine: Routine) => {
    let routineToEdit = routine;
    
    // If editing a default routine, create a user copy first
    if (isDefaultRoutine(routine)) {
      // Prevent multiple simultaneous copy operations
      if (isCreatingCopy) {
        console.log('Copy operation already in progress');
        return;
      }
      
      setIsCreatingCopy(true);
      try {
        const userCopy = await createUserRoutineFromDefault(routine);
        if (userCopy) {
          // Add to local state and refresh routines
          addRoutineToState(userCopy);
          routineToEdit = userCopy;
        } else {
          console.error('Failed to create user copy of default routine');
          return;
        }
      } finally {
        setIsCreatingCopy(false);
      }
    }
    
    setEditingRoutineId(routineToEdit.id);
    setRoutineName(routineToEdit.name);
    setCurrentRoutineExercises([...routineToEdit.exercises]);
    setSelectedFolder(routineToEdit.folderId);
    setRoutineCreationVisible(true);
  };

  const deleteRoutine = async (routineId: string) => {
    console.log('Attempting to delete routine:', routineId);
    
    const routine = routines.find(r => r.id === routineId);
    if (!routine) {
      console.error('Routine not found in local state:', routineId);
      return;
    }

    console.log('Routine details:', {
      id: routine.id,
      name: routine.name,
      isDefault: routine.isDefault,
      isUserOwned: routine.isUserOwned,
      folderId: routine.folderId
    });

    if (isDefaultRoutine(routine)) {
      // For default routines, we can't actually delete them from the database
      // They'll just not show up for this user anymore (this is optional behavior)
      console.log('Cannot delete default routines');
      return;
    }

    if (!routine.isUserOwned) {
      console.error('Cannot delete routine: user does not own this routine');
      throw new Error('You can only delete routines that you created.');
    }

    // OPTIMISTIC UPDATE: Delete routine immediately from UI
    try {
      console.log('Starting optimistic deletion for user-created routine');
      
      // Store routine data for potential rollback
      const routineToDelete = { ...routine };
      
      // Immediately remove from local state
      setRoutines(prevRoutines => prevRoutines.filter(r => r.id !== routineId));
      console.log('Optimistically removed routine from UI');

      // Queue for background deletion (only if it's not a temp ID)
      if (!routineId.startsWith('temp_')) {
        try {
          dataSyncService.deleteRoutineOptimistic(routineId);
          console.log('🗑️ Routine queued for deletion:', routineId);
        } catch (error) {
          console.error('❌ Failed to queue routine deletion:', error);
          // Rollback optimistic update
          setRoutines(prevRoutines => [...prevRoutines, routineToDelete]);
          throw new Error('Failed to delete routine. Please try again.');
        }
      } else {
        console.log('⏭️ Skipping database deletion for temporary routine:', routineId);
      }
      
    } catch (error) {
      console.error('Error in optimistic routine deletion:', error);
      throw error; // Re-throw to let the UI handle the error
    }

  };

  const startRoutineFromTemplate = (routine: Routine) => {
    const workoutExercises = routine.exercises.map((exercise, exerciseIndex) => ({
      ...exercise,
      id: `e${Date.now()}-${exerciseIndex}-${Math.random().toString(36).substring(2, 7)}`,
      sets: exercise.sets.length > 0 
        ? exercise.sets.map((set, setIndex) => ({
            id: `s${Date.now()}-${exerciseIndex}-${setIndex}`,
            weight: set.weight || 0,
            reps: set.reps || 0,
            completed: false,
          }))
        : [{
            id: `s${Date.now()}-${exerciseIndex}-1`,
            weight: 0,
            reps: 0,
            completed: false,
          }],
    }));
    
    setCurrentWorkoutExercises(workoutExercises);
    setActiveWorkoutVisible(true);
    setWorkoutStartTime(new Date());
    setIsWorkoutMinimized(false);
  };

  // Folder functions
  const createFolder = () => {
    if (!newFolderName.trim()) return;
    
    // OPTIMISTIC UPDATE: Create folder with temporary ID
    const tempId = dataSyncService.generateTempId();
    const newFolder: Folder = {
      id: tempId,
      name: newFolderName.trim(),
      isDefault: false,
      isUserOwned: true
    };
    
    // Immediately update UI
    setFolders([...folders, newFolder]);
    console.log('Optimistically created folder with temp ID:', tempId);
    
    // Queue for background sync
    try {
      const syncTempId = dataSyncService.createFolderOptimistic({
        name: newFolderName.trim(),
        description: 'User created folder',
        tempId: tempId
      });
      console.log('📁 Folder queued for sync:', newFolderName.trim(), 'with temp ID:', syncTempId);
    } catch (error) {
      console.error('❌ Failed to queue folder creation:', error);
      // Rollback optimistic update
      setFolders(prevFolders => prevFolders.filter(f => f.id !== tempId));
      alert('Failed to create folder. Please try again.');
      return;
    }
    
    setFolderCreationVisible(false);
    setNewFolderName('');
  };

  const toggleFolderCollapse = (folderId: string) => {
    const newCollapsed = new Set(collapsedFolders);
    if (newCollapsed.has(folderId)) {
      newCollapsed.delete(folderId);
    } else {
      newCollapsed.add(folderId);
    }
    setCollapsedFolders(newCollapsed);
  };

  const deleteFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    if (isDefaultFolder(folder)) {
      // Cannot delete default folders
      console.log('Cannot delete default folders');
        return;
    }

    // Check if folder has routines - show confirmation modal if it does
    const routinesInFolder = routines.filter(r => r.folderId === folderId);
    if (routinesInFolder.length > 0) {
      setDeletingFolderId(folderId);
      setFolderDeleteConfirmVisible(true);
      return;
    }

    // If folder is empty, delete immediately
    await performFolderDeletion(folderId);
  };

  const performFolderDeletion = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // OPTIMISTIC UPDATE: Delete folder and all routines immediately from UI
    try {
      console.log('Starting optimistic deletion for folder:', folderId);
      
      // Store folder and routines data for potential rollback
      const folderToDelete = { ...folder };
      const routinesInFolder = routines.filter(r => r.folderId === folderId);
      
      // Immediately update local state - delete folder and all routines in it
      setRoutines(prevRoutines => prevRoutines.filter(routine => routine.folderId !== folderId));
      setFolders(prevFolders => prevFolders.filter(f => f.id !== folderId));
      console.log('Optimistically removed folder and', routinesInFolder.length, 'routines from UI');

      // Queue for background deletion (only if it's not a temp ID)
      if (!folderId.startsWith('temp_')) {
        console.log('🔄 Queuing folder deletion for database sync:', folderId);
        try {
          dataSyncService.deleteFolderOptimistic(folderId);
          console.log('🗑️ Folder queued for deletion:', folderId);
          
          // Also queue deletion for all routines in the folder
          routinesInFolder.forEach(routine => {
            if (!routine.id.startsWith('temp_')) {
              dataSyncService.deleteRoutineOptimistic(routine.id);
              console.log('🗑️ Routine queued for deletion:', routine.id);
            }
          });
          
          // Log sync status for debugging
          setTimeout(() => {
            const status = dataSyncService.getSyncStatus();
            console.log('📊 Sync status after folder deletion queue:', status);
          }, 100);
        } catch (error) {
          console.error('❌ Failed to queue folder deletion:', error);
          // Rollback optimistic update
          setFolders(prevFolders => [...prevFolders, folderToDelete]);
          setRoutines(prevRoutines => [...prevRoutines, ...routinesInFolder]);
          throw new Error('Failed to delete folder. Please try again.');
        }
      } else {
        console.log('⏭️ Skipping database deletion for temporary folder:', folderId);
      }
      
    } catch (error) {
      console.error('Error in optimistic folder deletion:', error);
      alert('Failed to delete folder. Please try again.');
    }
  };

  const startRenamingFolder = async (folderId: string, currentName: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // Prevent renaming default folders
    if (isDefaultFolder(folder)) {
      console.log('Cannot rename default folders');
      alert('Default folders cannot be renamed.');
      return;
    }
    
    console.log('📝 Starting folder rename for:', folderId, 'current name:', currentName);
    
    // Use custom modal for folder renaming
    setRenamingFolderId(folderId);
    setRenameFolderName(currentName);
    setFolderRenameVisible(true);
  };

  const renameFolderOptimistic = (folderId: string, newName: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // OPTIMISTIC UPDATE: Update folder name immediately in UI
    const oldName = folder.name;
    
    // Immediately update local state
    setFolders(prevFolders => prevFolders.map(f =>
      f.id === folderId
        ? { ...f, name: newName }
        : f
    ));
    console.log('Optimistically renamed folder from', oldName, 'to', newName);

    // Queue for background sync (only if it's not a temp ID)
    if (!folderId.startsWith('temp_')) {
      console.log('🔄 Queuing folder rename for database sync:', folderId, 'new name:', newName);
      try {
        dataSyncService.updateFolderOptimistic({
          id: folderId,
          name: newName,
          description: 'User created folder'
        });
        console.log('📝 Folder rename queued for sync:', folderId);
        
        // Log sync status for debugging
        setTimeout(() => {
          const status = dataSyncService.getSyncStatus();
          console.log('📊 Sync status after folder rename queue:', status);
        }, 100);
      } catch (error) {
        console.error('❌ Failed to queue folder rename:', error);
        // Rollback optimistic update
        setFolders(prevFolders => prevFolders.map(f =>
          f.id === folderId
            ? { ...f, name: oldName }
            : f
        ));
        alert('Failed to rename folder. Please try again.');
      }
    } else {
      console.log('⏭️ Skipping database update for temporary folder:', folderId);
    }
  };

  const startNewRoutineInFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    let targetFolderId = folderId;
    
    // If trying to create a routine in a default folder, redirect to "My Routines" instead
    if (folder && isDefaultFolder(folder)) {
      const myRoutinesFolder = folders.find(f => f.name === 'My Routines');
      if (myRoutinesFolder) {
        targetFolderId = myRoutinesFolder.id;
        console.log('Redirecting new routine creation from default folder to My Routines');
      } else {
        // If "My Routines" folder doesn't exist, create routine without folder
        targetFolderId = '';
        console.log('My Routines folder not found, creating routine without folder');
      }
    }
    
    setSelectedFolder(targetFolderId);
    startNewRoutine();
  };

  const startRenamingRoutine = (routineId: string, currentName: string) => {
    setRenamingRoutineId(routineId);
    setNewRoutineName(currentName);
    setRoutineRenameVisible(true);
  };

  const renameRoutine = async () => {
    if (!newRoutineName.trim() || !renamingRoutineId) return;

    try {
      const routine = routines.find(r => r.id === renamingRoutineId);
      if (!routine) return;

      // Check if it's a default routine (can't rename default routines directly)
      if (isDefaultRoutine(routine)) {
        console.log('Cannot rename default routines');
        setRoutineRenameVisible(false);
        setRenamingRoutineId(null);
        setNewRoutineName('');
        return;
      }

      // OPTIMISTIC UPDATE: Update routine name immediately in UI
      const oldName = routine.name;
      
      // Immediately update local state
      setRoutines(prevRoutines => prevRoutines.map(r =>
        r.id === renamingRoutineId
          ? { ...r, name: newRoutineName.trim() }
          : r
      ));
      console.log('Optimistically renamed routine from', oldName, 'to', newRoutineName.trim());

      // Queue for background sync (only if it's not a temp ID)
      if (!renamingRoutineId.startsWith('temp_')) {
        try {
          dataSyncService.updateRoutineOptimistic({
            id: renamingRoutineId,
            name: newRoutineName.trim(),
            folderId: routine.folderId
          });
          console.log('📝 Routine rename queued for sync:', renamingRoutineId);
        } catch (error) {
          console.error('❌ Failed to queue routine rename:', error);
          // Rollback optimistic update
          setRoutines(prevRoutines => prevRoutines.map(r =>
            r.id === renamingRoutineId
              ? { ...r, name: oldName }
              : r
          ));
          alert('Failed to rename routine. Please try again.');
          return;
        }
      } else {
        console.log('⏭️ Skipping database update for temporary routine:', renamingRoutineId);
      }
    } catch (error) {
      console.error('Unexpected error renaming routine:', error);
    }

    setRoutineRenameVisible(false);
    setRenamingRoutineId(null);
    setNewRoutineName('');
  };

  const cancelRoutineRename = () => {
    setRoutineRenameVisible(false);
    setRenamingRoutineId(null);
    setNewRoutineName('');
  };

  const renameFolderFromModal = () => {
    if (!renameFolderName.trim() || !renamingFolderId) return;
    
    console.log('📝 User entered new folder name:', renameFolderName.trim());
    renameFolderOptimistic(renamingFolderId, renameFolderName.trim());
    
    setFolderRenameVisible(false);
    setRenamingFolderId(null);
    setRenameFolderName('');
  };

  const cancelFolderRename = () => {
    setFolderRenameVisible(false);
    setRenamingFolderId(null);
    setRenameFolderName('');
  };


  const handleExerciseSelection = (exercise: DatabaseExercise) => {
    if (routineCreationVisible) {
      if (replacingExerciseIndex !== null) {
        // Replace exercise at specific index
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
        
        setCurrentRoutineExercises(prevExercises => {
          const updatedExercises = [...prevExercises];
          updatedExercises[replacingExerciseIndex] = newExercise;
          return updatedExercises;
        });
        
        setReplacingExerciseIndex(null);
        setExerciseScreenVisible(false);
      } else {
        // Add new exercise
        addExerciseToRoutine(exercise);
      }
    } else {
      addExerciseToWorkout(exercise);
    }
  };

  const handleBackgroundPress = () => {
    setBottomSheetVisible(false);
  };

  const showFolderOptions = (folder: Folder) => {
    const isMyRoutines = folder.name === 'My Routines';
    const options: Array<{text: string; onPress: () => Promise<void>; isDelete?: boolean}> = [];
    
    // Add rename option for non-My Routines folders
    if (!isMyRoutines) {
      options.push({
        text: 'Rename Folder',
        onPress: async () => startRenamingFolder(folder.id, folder.name)
      });
    }
    
    // Add delete option for non-My Routines folders  
    if (!isMyRoutines) {
      options.push({
        text: 'Delete Folder',
        onPress: async () => {
          await deleteFolder(folder.id);
        },
        isDelete: true
      });
    }
    
    // Add new routine option
    options.push({
      text: 'Add New Routine',
      onPress: async () => await startNewRoutineInFolder(folder.id)
    });
    
    setBottomSheetTitle(folder.name);
    setBottomSheetOptions(options);
    setBottomSheetVisible(true);
  };

  const showRoutineOptions = (routine: Routine) => {
    const options: Array<{text: string; onPress: () => Promise<void>; isDelete?: boolean}> = [
      {
        text: 'Edit Routine',
        onPress: async () => editRoutine(routine)
      },
      {
        text: 'Rename Routine',
        onPress: async () => startRenamingRoutine(routine.id, routine.name)
      },
      {
        text: 'Delete Routine',
        onPress: async () => {
          try {
            await deleteRoutine(routine.id);
          } catch (error) {
            console.error('Failed to delete routine:', error);
            alert('Failed to delete routine. Please try again.');
          }
        },
        isDelete: true
      }
    ];
    
    setBottomSheetTitle(routine.name);
    setBottomSheetOptions(options);
    setBottomSheetVisible(true);
  };

  // Utility function to check if a routine is a default routine (not created by user)
  const isDefaultRoutine = (routine: Routine) => {
    return routine.isDefault === true;
  };

  // Utility function to check if a folder is a default folder (not created by user)
  const isDefaultFolder = (folder: Folder) => {
    return folder.isDefault === true;
  };

  // Helper function to safely add a routine to state without duplicates
  const addRoutineToState = (newRoutine: Routine) => {
    setRoutines(prevRoutines => {
      // Check if routine already exists in state
      const existingRoutine = prevRoutines.find(r => r.id === newRoutine.id);
      if (existingRoutine) {
        console.log('Routine already exists in state, not adding duplicate:', newRoutine.id);
        return prevRoutines;
      }
      console.log('Adding new routine to state:', newRoutine.id, newRoutine.name);
      return [...prevRoutines, newRoutine];
    });
  };

  // Create a user routine in the database based on a default routine
  const createUserRoutineFromDefault = async (defaultRoutine: Routine): Promise<Routine | null> => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.error('No authenticated user');
        return null;
      }

      // Check if user already has a copy of this routine
      const routineCopyName = defaultRoutine.name + ' (My Copy)';
      
      console.log('Checking for existing routine copy:', {
        routineCopyName,
        currentRoutines: routines.map(r => ({ name: r.name, isUserOwned: r.isUserOwned }))
      });
      
      const existingCopy = routines.find(r => 
        r.name === routineCopyName && r.isUserOwned
      );
      
      if (existingCopy) {
        console.log('User already has a copy of this routine, returning existing copy:', existingCopy.id);
        return existingCopy;
      }
      
      // Always place copied routines in "My Routines" folder
      let targetFolderId: string | undefined = undefined;
      const myRoutinesFolder = folders.find(f => f.name === 'My Routines');
      if (myRoutinesFolder) {
        targetFolderId = myRoutinesFolder.id;
        console.log('Placing routine copy in My Routines folder:', myRoutinesFolder.id);
      } else {
        console.log('My Routines folder not found, routine will be placed without a folder');
      }

      // Also check the database for existing copies (in case local state is out of sync)
      const { data: existingDbCopies } = await supabase
        .schema('fitness')
        .from('workout_routines')
        .select('id, name, folder_id')
        .eq('name', routineCopyName)
        .eq('created_by', user.data.user.id);
        
      if (existingDbCopies && existingDbCopies.length > 0) {
        console.log('Found existing database copy, preventing duplicate creation');
        // Return the first existing copy (convert to our format)
        const dbCopy = existingDbCopies[0];
        return {
          id: dbCopy.id,
          name: dbCopy.name,
          exercises: defaultRoutine.exercises,
          folderId: dbCopy.folder_id,
          isDefault: false,
          isUserOwned: true
        };
      }
      
      console.log('No existing copy found in database, proceeding to create new copy');

      // Create the user routine
      const { data: newRoutineData, error: routineError } = await supabase
        .schema('fitness')
        .from('workout_routines')
        .insert({
          name: defaultRoutine.name + ' (My Copy)',
          description: `User copy of ${defaultRoutine.name}`,
          is_default: false,
          created_by: user.data.user.id,
          folder_id: targetFolderId
        })
        .select()
        .single();

      if (routineError) {
        console.error('Error creating user routine:', routineError);
        return null;
      }

      // Copy the exercises from the default routine
      const routineExercises: any[] = [];
      defaultRoutine.exercises.forEach((exercise, exerciseIndex) => {
        if (exercise.sets.length === 0) {
          // If no sets, create default set
          routineExercises.push({
            routine_id: newRoutineData.id,
            exercise_id: exercise.id,
            sets: 1,
            reps: 10,
            weight_lbs: 0,
            order_in_routine: exerciseIndex + 1,
            set_number: 1
          });
        } else {
          // Copy existing sets
          exercise.sets.forEach((set, setIndex) => {
            routineExercises.push({
              routine_id: newRoutineData.id,
              exercise_id: exercise.id,
              sets: 1,
              reps: set.reps || 10,
              weight_lbs: set.weight || 0,
              order_in_routine: exerciseIndex + 1,
              set_number: setIndex + 1
            });
          });
        }
      });

      const { error: exercisesError } = await supabase
        .schema('fitness')
        .from('workout_routine_exercises')
        .insert(routineExercises);

      if (exercisesError) {
        console.error('Error creating routine exercises:', exercisesError);
        return null;
      }

      // Return the new routine in the app format
      const newRoutine: Routine = {
        id: newRoutineData.id,
        name: newRoutineData.name,
        exercises: defaultRoutine.exercises,
        folderId: newRoutineData.folder_id,
        isDefault: false,
        isUserOwned: true
      };

      return newRoutine;
    } catch (error) {
      console.error('Unexpected error creating user routine:', error);
      return null;
    }
  };

  if (exerciseScreenVisible) {
    return (
      <ExerciseSelectionScreen
        onSelectExercise={handleExerciseSelection}
        onCancel={() => setExerciseScreenVisible(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          onScrollBeginDrag={handleBackgroundPress}
        >
          <View style={styles.content}>
            <Text style={styles.header}>Workouts</Text>
            
            {/* Minimized Active Workout Indicator */}
            {isWorkoutMinimized && (
              <TouchableOpacity
                style={styles.minimizedWorkoutBar}
                onPress={restoreWorkout}
              >
                <Text style={styles.minimizedWorkoutText}>
                  Workout Paused - Tap to Resume
                </Text>
              </TouchableOpacity>
            )}
            
            {/* New Workout Button */}
            <TouchableOpacity
              style={styles.newWorkoutButton}
              onPress={startNewWorkout}
            >
              <Text style={styles.newWorkoutButtonText}>New Workout</Text>
            </TouchableOpacity>
            
            {/* Routines Section */}
            <RoutinesList
              routines={routines}
              folders={folders}
              collapsedFolders={collapsedFolders}
              onCreateFolder={() => setFolderCreationVisible(true)}
              onStartNewRoutine={startNewRoutine}
              onToggleFolderCollapse={toggleFolderCollapse}
              onShowFolderOptions={showFolderOptions}
              onShowRoutineOptions={showRoutineOptions}
              onStartRoutineFromTemplate={startRoutineFromTemplate}
              onEditRoutine={editRoutine}
            />
          </View>
        </ScrollView>
        
        <ActiveWorkoutModal
          visible={activeWorkoutVisible}
          exercises={currentWorkoutExercises}
          workoutStartTime={workoutStartTime}
          totalPausedDuration={totalPausedDuration}
          onMinimize={minimizeWorkout}
          onFinish={finishWorkout}
          onDiscard={discardWorkout}
          onAddExercise={() => setExerciseScreenVisible(true)}
          onToggleSetCompletion={toggleActiveWorkoutSetCompletion}
          onUpdateSet={updateActiveWorkoutSet}
          onAddSet={addSetToExercise}
          onRemoveSet={removeSetFromExercise}
        />

        <RoutineCreationModal
          visible={routineCreationVisible}
          routineName={routineName}
          exercises={currentRoutineExercises}
          folders={folders}
          selectedFolder={selectedFolder}
          isEditing={!!editingRoutineId}
          onCancel={cancelRoutineCreation}
          onSave={saveRoutine}
          onRoutineNameChange={setRoutineName}
          onFolderSelect={setSelectedFolder}
          onAddExercise={() => setExerciseScreenVisible(true)}
          onUpdateExerciseSet={updateRoutineExerciseSet}
          onAddExerciseSet={addRoutineExerciseSet}
          onRemoveExerciseSet={removeRoutineExerciseSet}
          onRemoveExercise={removeExerciseFromRoutine}
          onReplaceExercise={replaceExerciseInRoutine}
          onReorderExercises={reorderRoutineExercises}
          onUpdateExerciseNotes={updateExerciseNotes}
        />

        <FolderCreationModal
          visible={folderCreationVisible}
          folderName={newFolderName}
          onFolderNameChange={setNewFolderName}
          onCreate={createFolder}
          onCancel={() => setFolderCreationVisible(false)}
        />

        <RoutineRenameModal
          visible={routineRenameVisible}
          routineName={newRoutineName}
          onRoutineNameChange={setNewRoutineName}
          onRename={renameRoutine}
          onCancel={cancelRoutineRename}
        />

        <FolderRenameModal
          visible={folderRenameVisible}
          folderName={renameFolderName}
          onFolderNameChange={setRenameFolderName}
          onRename={renameFolderFromModal}
          onCancel={cancelFolderRename}
        />

        <OptionsBottomSheet
          visible={bottomSheetVisible}
          title={bottomSheetTitle}
          options={bottomSheetOptions}
          onClose={() => setBottomSheetVisible(false)}
        />

        <FolderDeleteConfirmationModal
          visible={folderDeleteConfirmVisible}
          folderName={deletingFolderId ? folders.find(f => f.id === deletingFolderId)?.name || '' : ''}
          routineCount={deletingFolderId ? routines.filter(r => r.folderId === deletingFolderId).length : 0}
          onConfirm={async () => {
            if (deletingFolderId) {
              await performFolderDeletion(deletingFolderId);
            }
            setFolderDeleteConfirmVisible(false);
            setDeletingFolderId(null);
          }}
          onCancel={() => {
            setFolderDeleteConfirmVisible(false);
            setDeletingFolderId(null);
          }}
        />

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
  minimizedWorkoutBar: {
    backgroundColor: theme.primary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  minimizedWorkoutText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  newWorkoutButton: {
    backgroundColor: theme.primary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  newWorkoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});