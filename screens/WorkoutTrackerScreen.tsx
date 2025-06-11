import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TouchableWithoutFeedback
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../supabaseClient';
import ActiveWorkoutModal from '../components/workout/ActiveWorkoutModal';
import RoutineCreationModal from '../components/workout/RoutineCreationModal';
import FolderCreationModal from '../components/workout/FolderCreationModal';
import RoutineRenameModal from '../components/workout/RoutineRenameModal';
import RoutinesList from '../components/workout/RoutinesList';
import ExerciseSelectionScreen from './ExerciseSelectionScreen';

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
};

type Folder = {
  id: string;
  name: string;
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
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [folderOptionsVisible, setFolderOptionsVisible] = useState<string | null>(null);
  const [routineOptionsVisible, setRoutineOptionsVisible] = useState<string | null>(null);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [replacingExerciseIndex, setReplacingExerciseIndex] = useState<number | null>(null);

  const styles = createStyles(theme);


  
  // Fetch exercises, routines, and folders from database
  useEffect(() => {
    fetchExercises();
    fetchFolders();
    fetchRoutines();
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
      const { data: foldersData, error: foldersError } = await supabase
        .schema('fitness')
        .from('workout_routine_folders')
        .select('id, name, description, is_default')
        .eq('is_default', true)
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
        name: dbFolder.name
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
          folderId: dbRoutine.folder_id
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
  };

  const minimizeWorkout = () => {
    setIsWorkoutMinimized(true);
    setActiveWorkoutVisible(false);
  };

  const restoreWorkout = () => {
    setIsWorkoutMinimized(false);
    setActiveWorkoutVisible(true);
  };

  const finishWorkout = () => {
    setActiveWorkoutVisible(false);
    setIsWorkoutMinimized(false);
    setWorkoutStartTime(null);
    setCurrentWorkoutExercises([]);
  };

  const discardWorkout = () => {
    setActiveWorkoutVisible(false);
    setIsWorkoutMinimized(false);
    setWorkoutStartTime(null);
    setCurrentWorkoutExercises([]);
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
          id: `s${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
          id: `s${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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

      if (editingRoutineId) {
        // Update existing routine in database
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
      } else {
        // Create new routine in database
        const { data: newRoutineData, error: routineError } = await supabase
          .schema('fitness')
          .from('workout_routines')
          .insert({
            name: routineName,
            description: 'User created routine',
            is_default: false,
            created_by: user.data.user.id,
            folder_id: selectedFolder
          })
          .select()
          .single();

        if (routineError) {
          console.error('Error creating routine:', routineError);
          return;
        }

        // Insert routine exercises
        if (currentRoutineExercises.length > 0) {
          const routineExercises: any[] = [];
          currentRoutineExercises.forEach((exercise, exerciseIndex) => {
            exercise.sets.forEach((set, setIndex) => {
              routineExercises.push({
                routine_id: newRoutineData.id,
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
            console.error('Error creating routine exercises:', exercisesError);
            return;
          }
        }

        // Add to local state
        const newRoutine: Routine = {
          id: newRoutineData.id,
          name: newRoutineData.name,
          exercises: currentRoutineExercises,
          folderId: newRoutineData.folder_id,
        };
        setRoutines([...routines, newRoutine]);
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
      const userCopy = await createUserRoutineFromDefault(routine);
      if (userCopy) {
        // Add to local state and refresh routines
        setRoutines(prevRoutines => [...prevRoutines, userCopy]);
        routineToEdit = userCopy;
      } else {
        console.error('Failed to create user copy of default routine');
        return;
      }
    }
    
    setEditingRoutineId(routineToEdit.id);
    setRoutineName(routineToEdit.name);
    setCurrentRoutineExercises([...routineToEdit.exercises]);
    setSelectedFolder(routineToEdit.folderId);
    setRoutineCreationVisible(true);
    setRoutineOptionsVisible(null);
  };

  const deleteRoutine = async (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (!routine) return;

    if (isDefaultRoutine(routine)) {
      // For default routines, we can't actually delete them from the database
      // They'll just not show up for this user anymore (this is optional behavior)
      console.log('Cannot delete default routines');
      setRoutineOptionsVisible(null);
      return;
    }

    // For user-created routines, delete from database
    try {
      // First delete the routine exercises
      const { error: exercisesError } = await supabase
        .schema('fitness')
        .from('workout_routine_exercises')
        .delete()
        .eq('routine_id', routineId);

      if (exercisesError) {
        console.error('Error deleting routine exercises:', exercisesError);
        return;
      }

      // Then delete the routine itself
      const { error: routineError } = await supabase
        .schema('fitness')
        .from('workout_routines')
        .delete()
        .eq('id', routineId);

      if (routineError) {
        console.error('Error deleting routine:', routineError);
        return;
      }

      // Remove from local state
      setRoutines(routines.filter(routine => routine.id !== routineId));
      console.log('Successfully deleted routine');
    } catch (error) {
      console.error('Unexpected error deleting routine:', error);
    }

    setRoutineOptionsVisible(null);
  };

  const startRoutineFromTemplate = (routine: Routine) => {
    const workoutExercises = routine.exercises.map((exercise, exerciseIndex) => ({
      ...exercise,
      id: `e${Date.now()}-${exerciseIndex}-${Math.random().toString(36).substr(2, 5)}`,
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
    
    const newFolder: Folder = {
      id: `f${Date.now()}`,
      name: newFolderName,
    };
    
    setFolders([...folders, newFolder]);
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

  const deleteFolder = (folderId: string) => {
    setRoutines(routines.map(routine => 
      routine.folderId === folderId 
        ? { ...routine, folderId: undefined }
        : routine
    ));
    
    setFolders(folders.filter(folder => folder.id !== folderId));
    setFolderOptionsVisible(null);
  };

  const startRenamingFolder = (_folderId: string, _currentName: string) => {
    // TODO: Implement folder renaming
    setFolderOptionsVisible(null);
  };

  const startNewRoutineInFolder = (folderId: string) => {
    setSelectedFolder(folderId);
    startNewRoutine();
    setFolderOptionsVisible(null);
  };

  const startRenamingRoutine = (routineId: string, currentName: string) => {
    setRenamingRoutineId(routineId);
    setNewRoutineName(currentName);
    setRoutineRenameVisible(true);
    setRoutineOptionsVisible(null);
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

      // Update routine name in database
      const { error } = await supabase
        .schema('fitness')
        .from('workout_routines')
        .update({ name: newRoutineName.trim() })
        .eq('id', renamingRoutineId);

      if (error) {
        console.error('Error renaming routine:', error);
        return;
      }

      // Update local state
      setRoutines(routines.map(r =>
        r.id === renamingRoutineId
          ? { ...r, name: newRoutineName.trim() }
          : r
      ));

      console.log('Successfully renamed routine');
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
    setFolderOptionsVisible(null);
    setRoutineOptionsVisible(null);
  };

  // Utility function to check if a routine is a default routine (not created by user)
  const isDefaultRoutine = (routine: Routine) => {
    // Check if routine has is_default property or lacks created_by field indicating it's a default
    return (routine as any).is_default === true;
  };

  // Create a user routine in the database based on a default routine
  const createUserRoutineFromDefault = async (defaultRoutine: Routine): Promise<Routine | null> => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.error('No authenticated user');
        return null;
      }

      // Create the user routine
      const { data: newRoutineData, error: routineError } = await supabase
        .schema('fitness')
        .from('workout_routines')
        .insert({
          name: defaultRoutine.name + ' (Modified)',
          description: `Modified version of ${defaultRoutine.name}`,
          is_default: false,
          created_by: user.data.user.id,
          folder_id: defaultRoutine.folderId
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
        folderId: newRoutineData.folder_id
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
      <TouchableWithoutFeedback onPress={handleBackgroundPress}>
        <View style={styles.container}>
          <ScrollView style={styles.scrollView}>
            <View style={styles.content}>
              <Text style={styles.header}>Workouts</Text>
              
              {/* Minimized Active Workout Indicator */}
              {isWorkoutMinimized && (
                <TouchableOpacity
                  style={styles.minimizedWorkoutBar}
                  onPress={restoreWorkout}
                >
                  <Text style={styles.minimizedWorkoutText}>
                    Active Workout in Progress - Tap to Resume
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
                folderOptionsVisible={folderOptionsVisible}
                routineOptionsVisible={routineOptionsVisible}
                onCreateFolder={() => setFolderCreationVisible(true)}
                onStartNewRoutine={startNewRoutine}
                onToggleFolderCollapse={toggleFolderCollapse}
                onSetFolderOptionsVisible={setFolderOptionsVisible}
                onSetRoutineOptionsVisible={setRoutineOptionsVisible}
                onStartRenamingFolder={startRenamingFolder}
                onDeleteFolder={deleteFolder}
                onStartRoutineFromTemplate={startRoutineFromTemplate}
                onEditRoutine={editRoutine}
                onDeleteRoutine={deleteRoutine}
                onStartNewRoutineInFolder={startNewRoutineInFolder}
                onRenameRoutine={startRenamingRoutine}
              />
            </View>
          </ScrollView>
        
        <ActiveWorkoutModal
          visible={activeWorkoutVisible}
          exercises={currentWorkoutExercises}
          workoutStartTime={workoutStartTime}
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

        </View>
      </TouchableWithoutFeedback>
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