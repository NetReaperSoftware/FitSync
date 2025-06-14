import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { dataSyncService } from '../services/DataSyncService';
import { Exercise, DatabaseExercise } from './useActiveWorkout';
import { useUnits } from '../contexts/UnitsContext';

export type Routine = {
  id: string;
  name: string;
  exercises: Exercise[];
  folderId?: string;
  isDefault?: boolean;
  isUserOwned?: boolean;
};

export const useRoutineManagement = () => {
  const { normalizeWeightForStorage, convertStoredWeightForDisplay } = useUnits();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineCreationVisible, setRoutineCreationVisible] = useState(false);
  const [currentRoutineExercises, setCurrentRoutineExercises] = useState<Exercise[]>([]);
  const [routineName, setRoutineName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [replacingExerciseIndex, setReplacingExerciseIndex] = useState<number | null>(null);
  const [isCreatingCopy, setIsCreatingCopy] = useState<boolean>(false);
  const [routineRenameVisible, setRoutineRenameVisible] = useState(false);
  const [renamingRoutineId, setRenamingRoutineId] = useState<string | null>(null);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [routineDeleteConfirmVisible, setRoutineDeleteConfirmVisible] = useState(false);
  const [deletingRoutineId, setDeletingRoutineId] = useState<string | null>(null);

  // Fetch routines from database
  const fetchRoutines = useCallback(async () => {
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
            notes,
            exercises (
              id,
              name,
              muscle_group_primary,
              degree
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
                degree: dbExercise.exercises.degree,
                notes: dbExercise.notes || '',
                sets: [],
                order: dbExercise.order_in_routine
              });
            }
            
            // Add this set to the exercise (convert stored weight to display units)
            const displayWeight = convertStoredWeightForDisplay(dbExercise.weight_lbs || 0);
            exerciseGroups.get(exerciseId).sets.push({
              id: `s${dbExercise.id}`,
              weight: displayWeight,
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
  }, []);

  // Start new routine creation
  const startNewRoutine = useCallback((defaultFolderId?: string, folders?: any[]) => {
    setRoutineCreationVisible(true);
    setCurrentRoutineExercises([]);
    setRoutineName('');
    
    // If no folder is specified, try to find and select "My Routines" as default
    if (!defaultFolderId && folders) {
      const myRoutinesFolder = folders.find(folder => folder.name === 'My Routines');
      setSelectedFolder(myRoutinesFolder?.id);
    } else {
      setSelectedFolder(defaultFolderId);
    }
    
    setEditingRoutineId(null);
  }, []);

  // Start editing existing routine
  const startEditingRoutine = useCallback((routine: Routine) => {
    setEditingRoutineId(routine.id);
    setRoutineName(routine.name);
    setCurrentRoutineExercises([...routine.exercises]);
    setSelectedFolder(routine.folderId);
    setRoutineCreationVisible(true);
  }, []);

  // Add exercise to routine
  const addExerciseToRoutine = useCallback((exercise: DatabaseExercise) => {
    const newExercise: Exercise = {
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscle_group_primary,
      degree: exercise.degree,
      sets: [{
        id: `s${Date.now()}-1`,
        weight: 0,
        reps: 0,
        completed: false,
        degree: exercise.degree || null,
      }],
    };
    setCurrentRoutineExercises([...currentRoutineExercises, newExercise]);
  }, [currentRoutineExercises]);

  // Update routine exercise set
  const updateRoutineExerciseSet = useCallback((exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
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
  }, []);

  // Add set to routine exercise
  const addRoutineExerciseSet = useCallback((exerciseIndex: number) => {
    setCurrentRoutineExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      const exercise = updatedExercises[exerciseIndex];
      if (exercise) {
        const newSet = {
          id: `s${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          weight: 0,
          reps: 0,
          completed: false,
        };
        exercise.sets.push(newSet);
      }
      return updatedExercises;
    });
  }, []);

  // Remove set from routine exercise
  const removeRoutineExerciseSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setCurrentRoutineExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      const exercise = updatedExercises[exerciseIndex];
      if (exercise && exercise.sets.length > 1) { // Don't allow removing the last set
        exercise.sets.splice(setIndex, 1);
      }
      return updatedExercises;
    });
  }, []);

  // Remove exercise from routine
  const removeExerciseFromRoutine = useCallback((exerciseIndex: number) => {
    setCurrentRoutineExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      updatedExercises.splice(exerciseIndex, 1);
      return updatedExercises;
    });
  }, []);

  // Replace exercise in routine
  const replaceExerciseInRoutine = useCallback((exerciseIndex: number) => {
    setReplacingExerciseIndex(exerciseIndex);
  }, []);

  // Handle exercise replacement
  const handleExerciseReplacement = useCallback((exercise: DatabaseExercise) => {
    if (replacingExerciseIndex !== null) {
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
      return true; // Indicates replacement was handled
    }
    return false; // Indicates no replacement was pending
  }, [replacingExerciseIndex]);

  // Reorder routine exercises
  const reorderRoutineExercises = useCallback((fromIndex: number, toIndex: number) => {
    const reorderedExercises = [...currentRoutineExercises];
    const [movedExercise] = reorderedExercises.splice(fromIndex, 1);
    reorderedExercises.splice(toIndex, 0, movedExercise);
    
    setCurrentRoutineExercises(reorderedExercises);
    
    // If we're editing an existing routine, update the order in the database immediately
    if (editingRoutineId) {
      updateExerciseOrderInDatabase(reorderedExercises);
    }
  }, [currentRoutineExercises, editingRoutineId]);

  // Update exercise notes
  const updateExerciseNotes = useCallback((exerciseIndex: number, notes: string) => {
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
  }, []);

  // Update exercise degree
  const updateExerciseDegree = useCallback((exerciseIndex: number, degree: number) => {
    setCurrentRoutineExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      if (updatedExercises[exerciseIndex]) {
        updatedExercises[exerciseIndex] = {
          ...updatedExercises[exerciseIndex],
          degree: degree
        };
      }
      return updatedExercises;
    });
  }, []);

  // Update exercise order in database
  const updateExerciseOrderInDatabase = useCallback(async (reorderedExercises: Exercise[]) => {
    if (!editingRoutineId) return;

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
          // Normalize weight to lbs for storage
          const normalizedWeight = normalizeWeightForStorage(set.weight || 0);
          
          routineExercises.push({
            routine_id: editingRoutineId,
            exercise_id: exercise.id,
            sets: 1,
            reps: set.reps || 0,
            weight_lbs: normalizedWeight,
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
  }, [editingRoutineId]);

  // Cancel routine creation
  const cancelRoutineCreation = useCallback(() => {
    setRoutineCreationVisible(false);
    setCurrentRoutineExercises([]);
    setRoutineName('');
    setSelectedFolder(undefined);
    setEditingRoutineId(null);
    setReplacingExerciseIndex(null);
  }, []);

  // Save routine to database
  const saveRoutine = useCallback(async () => {
    if (!routineName.trim()) {
      console.error('Routine name is required');
      return false;
    }
    if (!selectedFolder) {
      console.error('Folder selection is required');
      return false;
    }
    if (currentRoutineExercises.length === 0) {
      console.error('At least one exercise is required');
      return false;
    }
    
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.error('No authenticated user');
        return false;
      }

      if (editingRoutineId) {
        // EDITING EXISTING ROUTINE
        console.log('Updating existing routine:', editingRoutineId);
        
        // Update the routine record
        const { error: routineUpdateError } = await supabase
          .schema('fitness')
          .from('workout_routines')
          .update({
            name: routineName.trim(),
            folder_id: selectedFolder
          })
          .eq('id', editingRoutineId);

        if (routineUpdateError) {
          console.error('Error updating routine:', routineUpdateError);
          return false;
        }

        // Delete existing routine exercises
        const { error: deleteError } = await supabase
          .schema('fitness')
          .from('workout_routine_exercises')
          .delete()
          .eq('routine_id', editingRoutineId);

        if (deleteError) {
          console.error('Error deleting old routine exercises:', deleteError);
          return false;
        }

        // Insert new routine exercises with notes
        const routineExercises: any[] = [];
        currentRoutineExercises.forEach((exercise, exerciseIndex) => {
          exercise.sets.forEach((set, setIndex) => {
            // Normalize weight to lbs for storage
            const normalizedWeight = normalizeWeightForStorage(set.weight || 0);
            
            routineExercises.push({
              routine_id: editingRoutineId,
              exercise_id: exercise.id,
              sets: 1,
              reps: set.reps || 0,
              weight_lbs: normalizedWeight,
              order_in_routine: exerciseIndex + 1,
              set_number: setIndex + 1,
              notes: exercise.notes || null
            });
          });
        });

        const { error: insertError } = await supabase
          .schema('fitness')
          .from('workout_routine_exercises')
          .insert(routineExercises);

        if (insertError) {
          console.error('Error inserting routine exercises:', insertError);
          return false;
        }
        
        // OPTIMISTIC UPDATE: Update routine immediately in UI
        setRoutines(prevRoutines => prevRoutines.map(routine =>
          routine.id === editingRoutineId
            ? {
                ...routine,
                name: routineName.trim(),
                exercises: currentRoutineExercises,
                folderId: selectedFolder,
              }
            : routine
        ));
        
        console.log('Successfully updated routine in database');
      } else {
        // CREATING NEW ROUTINE
        console.log('Creating new routine');
        
        // Create the routine record
        const { data: routineData, error: routineError } = await supabase
          .schema('fitness')
          .from('workout_routines')
          .insert({
            name: routineName.trim(),
            description: `Routine with ${currentRoutineExercises.length} exercises`,
            folder_id: selectedFolder,
            created_by: user.data.user.id,
            is_default: false
          })
          .select()
          .single();

        if (routineError) {
          console.error('Error creating routine:', routineError);
          return false;
        }

        // Insert routine exercises with notes
        const routineExercises: any[] = [];
        currentRoutineExercises.forEach((exercise, exerciseIndex) => {
          exercise.sets.forEach((set, setIndex) => {
            // Normalize weight to lbs for storage
            const normalizedWeight = normalizeWeightForStorage(set.weight || 0);
            
            routineExercises.push({
              routine_id: routineData.id,
              exercise_id: exercise.id,
              sets: 1,
              reps: set.reps || 0,
              weight_lbs: normalizedWeight,
              order_in_routine: exerciseIndex + 1,
              set_number: setIndex + 1,
              notes: exercise.notes || null
            });
          });
        });

        const { error: exercisesError } = await supabase
          .schema('fitness')
          .from('workout_routine_exercises')
          .insert(routineExercises);

        if (exercisesError) {
          console.error('Error inserting routine exercises:', exercisesError);
          return false;
        }

        // Create new routine object for UI
        const newRoutine: Routine = {
          id: routineData.id,
          name: routineName.trim(),
          exercises: currentRoutineExercises,
          folderId: selectedFolder,
          isDefault: false,
          isUserOwned: true
        };
        
        // Update UI
        setRoutines(prev => [...prev, newRoutine]);
        console.log('Successfully created routine in database:', routineData.id);
      }
      
      // Reset form state
      cancelRoutineCreation();
      return true;
    } catch (error) {
      console.error('Unexpected error saving routine:', error);
      return false;
    }
  }, [routineName, selectedFolder, currentRoutineExercises, editingRoutineId, cancelRoutineCreation]);

  // Start renaming routine
  const startRenamingRoutine = useCallback((routineId: string, currentName: string) => {
    setRenamingRoutineId(routineId);
    setNewRoutineName(currentName);
    setRoutineRenameVisible(true);
  }, []);

  // Cancel routine rename
  const cancelRoutineRename = useCallback(() => {
    setRoutineRenameVisible(false);
    setRenamingRoutineId(null);
    setNewRoutineName('');
  }, []);

  // Rename routine
  const renameRoutine = useCallback(() => {
    if (!newRoutineName.trim() || !renamingRoutineId) return;
    
    const routine = routines.find(r => r.id === renamingRoutineId);
    if (!routine) return;

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
      console.log('🔄 Queuing routine rename for database sync:', renamingRoutineId, 'new name:', newRoutineName.trim());
      try {
        dataSyncService.updateRoutineOptimistic({
          id: renamingRoutineId,
          name: newRoutineName.trim(),
          description: `Routine with ${routine.exercises.length} exercises`,
          folderId: routine.folderId,
          exercises: routine.exercises
        });
        console.log('📝 Routine rename queued for sync:', renamingRoutineId);
        
        // Log sync status for debugging
        setTimeout(() => {
          const status = dataSyncService.getSyncStatus();
          console.log('📊 Sync status after routine rename queue:', status);
        }, 100);
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
    
    // Close the rename modal
    cancelRoutineRename();
  }, [newRoutineName, renamingRoutineId, routines, cancelRoutineRename]);

  // Utility function to check if a routine is a default routine
  const isDefaultRoutine = useCallback((routine: Routine) => {
    return routine.isDefault === true;
  }, []);

  // Delete routine
  const deleteRoutine = useCallback(async (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    if (isDefaultRoutine(routine)) {
      // Cannot delete default routines
      console.log('Cannot delete default routines');
      alert('Default routines cannot be deleted.');
      return;
    }

    // Show confirmation modal
    setDeletingRoutineId(routineId);
    setRoutineDeleteConfirmVisible(true);
  }, [routines, isDefaultRoutine]);

  // Perform routine deletion
  const performRoutineDeletion = useCallback(async (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    // OPTIMISTIC UPDATE: Delete routine immediately from UI
    try {
      console.log('Starting optimistic deletion for routine:', routineId);
      
      // Store routine data for potential rollback
      const routineToDelete = { ...routine };
      
      // Immediately update local state - delete routine
      setRoutines(prevRoutines => prevRoutines.filter(r => r.id !== routineId));
      console.log('Optimistically removed routine from UI:', routine.name);

      // Queue for background deletion (only if it's not a temp ID)
      if (!routineId.startsWith('temp_')) {
        console.log('🔄 Queuing routine deletion for database sync:', routineId);
        try {
          dataSyncService.deleteRoutineOptimistic(routineId);
          console.log('🗑️ Routine queued for deletion:', routineId);
          
          // Log sync status for debugging
          setTimeout(() => {
            const status = dataSyncService.getSyncStatus();
            console.log('📊 Sync status after routine deletion queue:', status);
          }, 100);
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
      alert('Failed to delete routine. Please try again.');
    }
  }, [routines]);

  // Helper function to safely add a routine to state without duplicates
  const addRoutineToState = useCallback((newRoutine: Routine) => {
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
  }, []);

  // Create workout from routine template
  const createWorkoutFromRoutine = useCallback((routine: Routine) => {
    const workoutExercises = routine.exercises.map((exercise, exerciseIndex) => ({
      ...exercise,
      // Keep the original exercise ID from database (it's already a UUID)
      id: exercise.id,
      // Copy routine notes to workout (will be saved to workout_exercises table)
      notes: exercise.notes || '',
      sets: exercise.sets.length > 0 
        ? exercise.sets.map((set, setIndex) => ({
            // Generate new set IDs for the workout instance
            id: `s${Date.now()}-${exerciseIndex}-${setIndex}`,
            weight: set.weight || 0,
            reps: set.reps || 0,
            completed: false,
            degree: exercise.degree || null,
          }))
        : [{
            id: `s${Date.now()}-${exerciseIndex}-1`,
            weight: 0,
            reps: 0,
            completed: false,
            degree: exercise.degree || null,
          }],
    }));
    
    return workoutExercises;
  }, []);

  return {
    // State
    routines,
    routineCreationVisible,
    currentRoutineExercises,
    routineName,
    selectedFolder,
    editingRoutineId,
    replacingExerciseIndex,
    isCreatingCopy,
    routineRenameVisible,
    renamingRoutineId,
    newRoutineName,
    routineDeleteConfirmVisible,
    deletingRoutineId,

    // Actions
    fetchRoutines,
    startNewRoutine,
    startEditingRoutine,
    addExerciseToRoutine,
    updateRoutineExerciseSet,
    addRoutineExerciseSet,
    removeRoutineExerciseSet,
    removeExerciseFromRoutine,
    replaceExerciseInRoutine,
    handleExerciseReplacement,
    reorderRoutineExercises,
    updateExerciseNotes,
    updateExerciseDegree,
    cancelRoutineCreation,
    saveRoutine,
    startRenamingRoutine,
    renameRoutine,
    cancelRoutineRename,
    deleteRoutine,
    performRoutineDeletion,
    isDefaultRoutine,
    addRoutineToState,
    createWorkoutFromRoutine,

    // Setters
    setRoutines,
    setRoutineCreationVisible,
    setCurrentRoutineExercises,
    setRoutineName,
    setSelectedFolder,
    setEditingRoutineId,
    setReplacingExerciseIndex,
    setIsCreatingCopy,
    setNewRoutineName,
    setRoutineDeleteConfirmVisible,
    setDeletingRoutineId,
  };
};