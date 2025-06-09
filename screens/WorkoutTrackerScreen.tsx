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
import RoutinesList from '../components/workout/RoutinesList';
import WorkoutHistory from '../components/workout/WorkoutHistory';
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

type Workout = {
  id: string;
  name: string;
  exercises: Exercise[];
  date: Date;
  completed: boolean;
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
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [folderOptionsVisible, setFolderOptionsVisible] = useState<string | null>(null);
  const [routineOptionsVisible, setRoutineOptionsVisible] = useState<string | null>(null);
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);

  const styles = createStyles(theme);


  
  // Fetch exercises from database
  useEffect(() => {
    fetchExercises();
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
    if (currentWorkoutExercises.length > 0) {
      const newWorkout: Workout = {
        id: `w${Date.now()}`,
        name: `Workout ${new Date().toLocaleDateString()}`,
        exercises: currentWorkoutExercises,
        date: new Date(),
        completed: true,
      };
      setWorkouts([...workouts, newWorkout]);
    }
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
      id: `e${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
    setRoutineCreationVisible(true);
    setCurrentRoutineExercises([]);
    setRoutineName('');
    setSelectedFolder(undefined);
  };

  const addExerciseToRoutine = (exercise: DatabaseExercise) => {
    const newExercise: Exercise = {
      id: `e${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: exercise.name,
      muscleGroup: exercise.muscle_group_primary,
      sets: [],
    };
    setCurrentRoutineExercises([...currentRoutineExercises, newExercise]);
    setExerciseScreenVisible(false);
  };

  const saveRoutine = () => {
    if (!routineName.trim()) return;
    
    if (editingRoutineId) {
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
      const newRoutine: Routine = {
        id: `r${Date.now()}`,
        name: routineName,
        exercises: currentRoutineExercises,
        folderId: selectedFolder,
      };
      setRoutines([...routines, newRoutine]);
    }
    
    setRoutineCreationVisible(false);
    setCurrentRoutineExercises([]);
    setRoutineName('');
    setSelectedFolder(undefined);
  };

  const cancelRoutineCreation = () => {
    setRoutineCreationVisible(false);
    setCurrentRoutineExercises([]);
    setRoutineName('');
    setSelectedFolder(undefined);
    setEditingRoutineId(null);
  };

  const editRoutine = (routine: Routine) => {
    setEditingRoutineId(routine.id);
    setRoutineName(routine.name);
    setCurrentRoutineExercises([...routine.exercises]);
    setSelectedFolder(routine.folderId);
    setRoutineCreationVisible(true);
    setRoutineOptionsVisible(null);
  };

  const deleteRoutine = (routineId: string) => {
    setRoutines(routines.filter(routine => routine.id !== routineId));
    setRoutineOptionsVisible(null);
  };

  const startRoutineFromTemplate = (routine: Routine) => {
    const workoutExercises = routine.exercises.map(exercise => ({
      ...exercise,
      id: `e${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      sets: [{
        id: `s${Date.now()}-1`,
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

  const handleExerciseSelection = (exercise: DatabaseExercise) => {
    if (routineCreationVisible) {
      addExerciseToRoutine(exercise);
    } else {
      addExerciseToWorkout(exercise);
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
            />
            
            {/* Previous Workouts */}
            <WorkoutHistory
              workouts={workouts}
              onToggleSetCompletion={toggleSetCompletion}
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
        />

        <FolderCreationModal
          visible={folderCreationVisible}
          folderName={newFolderName}
          onFolderNameChange={setNewFolderName}
          onCreate={createFolder}
          onCancel={() => setFolderCreationVisible(false)}
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