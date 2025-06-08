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
  const [exerciseLibrary, setExerciseLibrary] = useState([
    { id: 'el1', name: 'Bench Press', muscleGroup: 'Chest' },
    { id: 'el2', name: 'Squats', muscleGroup: 'Legs' },
    { id: 'el3', name: 'Deadlift', muscleGroup: 'Back' },
    { id: 'el4', name: 'Pull-ups', muscleGroup: 'Back' },
    { id: 'el5', name: 'Shoulder Press', muscleGroup: 'Shoulders' },
  ]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [exerciseModalVisible, setExerciseModalVisible] = useState(false);
  const [routineCreationVisible, setRoutineCreationVisible] = useState(false);
  const [currentRoutineExercises, setCurrentRoutineExercises] = useState<Exercise[]>([]);
  const [routineName, setRoutineName] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
  const [folderCreationVisible, setFolderCreationVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [folderOptionsVisible, setFolderOptionsVisible] = useState<string | null>(null);
  const [routineOptionsVisible, setRoutineOptionsVisible] = useState<string | null>(null);
  const [renameFolderVisible, setRenameFolderVisible] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);

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

  const addExerciseToWorkout = (exercise: any) => {
    const newExercise: Exercise = {
      id: `e${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: [{
        id: `s${Date.now()}-1`,
        weight: 0,
        reps: 0,
        completed: false,
      }],
    };
    setCurrentWorkoutExercises([...currentWorkoutExercises, newExercise]);
    setExerciseModalVisible(false);
  };

  const startNewRoutine = () => {
    setRoutineCreationVisible(true);
    setCurrentRoutineExercises([]);
    setRoutineName('');
    setSelectedFolder(undefined);
  };

  const addExerciseToRoutine = (exercise: any) => {
    const newExercise: Exercise = {
      id: `e${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets: [], // No sets for routines
    };
    setCurrentRoutineExercises([...currentRoutineExercises, newExercise]);
    setExerciseModalVisible(false);
  };

  const saveRoutine = () => {
    if (!routineName.trim()) return;
    
    if (editingRoutineId) {
      // Update existing routine
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
      // Create new routine
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
  };

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

  const startRenamingFolder = (folderId: string, currentName: string) => {
    setEditingFolderId(folderId);
    setEditingFolderName(currentName);
    setRenameFolderVisible(true);
    setFolderOptionsVisible(null);
  };

  const renameFolder = () => {
    if (!editingFolderName.trim() || !editingFolderId) return;
    
    setFolders(folders.map(folder => 
      folder.id === editingFolderId 
        ? { ...folder, name: editingFolderName }
        : folder
    ));
    
    setRenameFolderVisible(false);
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const deleteFolder = (folderId: string) => {
    // Move routines in this folder to no folder
    setRoutines(routines.map(routine => 
      routine.folderId === folderId 
        ? { ...routine, folderId: undefined }
        : routine
    ));
    
    setFolders(folders.filter(folder => folder.id !== folderId));
    setFolderOptionsVisible(null);
  };

  const startRoutineFromTemplate = (routine: Routine) => {
    // Create a new workout from the routine template
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

  const getWorkoutStats = () => {
    const totalSets = currentWorkoutExercises.reduce((total, exercise) => total + exercise.sets.length, 0);
    const totalVolume = currentWorkoutExercises.reduce((total, exercise) => 
      total + exercise.sets.reduce((setTotal, set) => setTotal + (set.weight * set.reps), 0), 0
    );
    const duration = workoutStartTime ? Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 60000) : 0;
    
    return { totalSets, totalVolume, duration };
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

  const renderActiveWorkoutScreen = () => {
    const stats = getWorkoutStats();
    
    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={activeWorkoutVisible}
        onRequestClose={minimizeWorkout}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            {/* Active Workout Header */}
            <View style={styles.activeWorkoutHeader}>
              <TouchableOpacity
                style={styles.minimizeButton}
                onPress={minimizeWorkout}
              >
                <Text style={styles.minimizeButtonText}>−</Text>
              </TouchableOpacity>
              
              <Text style={styles.activeWorkoutTitle}>Active Workout</Text>
              
              <TouchableOpacity
                style={styles.finishButton}
                onPress={finishWorkout}
              >
                <Text style={styles.finishButtonText}>Finish</Text>
              </TouchableOpacity>
            </View>
            
            {/* Workout Stats */}
            <View style={styles.workoutStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.duration}</Text>
                <Text style={styles.statLabel}>Duration (min)</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalVolume}</Text>
                <Text style={styles.statLabel}>Volume (lbs)</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalSets}</Text>
                <Text style={styles.statLabel}>Sets</Text>
              </View>
            </View>
            
            <ScrollView style={styles.scrollView}>
              <View style={styles.content}>
                {/* Current Exercises */}
                {currentWorkoutExercises.map(exercise => (
                  <View key={exercise.id} style={styles.workoutCard}>
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
                        <TextInput
                          style={styles.setInput}
                          value={set.weight.toString()}
                          placeholder="0"
                          keyboardType="numeric"
                        />
                        <TextInput
                          style={styles.setInput}
                          value={set.reps.toString()}
                          placeholder="0"
                          keyboardType="numeric"
                        />
                        <TouchableOpacity
                          style={[
                            styles.completionButton,
                            set.completed ? styles.completedButton : styles.pendingButton,
                          ]}
                        >
                          <Text style={styles.completionButtonText}>
                            {set.completed ? '✓' : ''}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ))}
                
                {/* Add Exercise Button */}
                <TouchableOpacity
                  style={styles.addExerciseButton}
                  onPress={() => setExerciseModalVisible(true)}
                >
                  <Text style={styles.addButtonText}>+ Add Exercise</Text>
                </TouchableOpacity>
                
                {/* Discard Workout Button */}
                <TouchableOpacity
                  style={styles.discardButton}
                  onPress={discardWorkout}
                >
                  <Text style={styles.discardButtonText}>Discard Workout</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

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
            <View style={styles.routinesSection}>
              <View style={styles.routinesSectionHeader}>
                <Text style={styles.sectionTitle}>Routines</Text>
                <TouchableOpacity 
                  style={styles.createFolderButton}
                  onPress={() => setFolderCreationVisible(true)}
                >
                  <Text style={styles.createFolderButtonText}>+ Folder</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.newRoutineButton}
                onPress={startNewRoutine}
              >
                <Text style={styles.newRoutineButtonText}>+ New Routine</Text>
              </TouchableOpacity>
              
              {/* Display Folders and Routines */}
              {folders.map(folder => {
                const isCollapsed = collapsedFolders.has(folder.id);
                const folderRoutines = routines.filter(routine => routine.folderId === folder.id);
                
                return (
                  <View key={folder.id} style={styles.folderContainer}>
                    {/* Folder Header */}
                    <View style={styles.folderHeader}>
                      <TouchableOpacity
                        style={styles.folderToggle}
                        onPress={() => toggleFolderCollapse(folder.id)}
                      >
                        <Text style={styles.folderToggleIcon}>
                          {isCollapsed ? '▶' : '▼'}
                        </Text>
                        <Text style={styles.folderName}>{folder.name}</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.optionsButton}
                        onPress={() => setFolderOptionsVisible(
                          folderOptionsVisible === folder.id ? null : folder.id
                        )}
                      >
                        <Text style={styles.optionsButtonText}>⋯</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Folder Options Menu */}
                    {folderOptionsVisible === folder.id && (
                      <View style={styles.optionsMenu}>
                        <TouchableOpacity
                          style={styles.optionItem}
                          onPress={() => startRenamingFolder(folder.id, folder.name)}
                        >
                          <Text style={styles.optionText}>Rename Folder</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.optionItem}
                          onPress={() => deleteFolder(folder.id)}
                        >
                          <Text style={[styles.optionText, styles.deleteOptionText]}>Delete Folder</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.optionItem}
                          onPress={() => {
                            setSelectedFolder(folder.id);
                            startNewRoutine();
                          }}
                        >
                          <Text style={styles.optionText}>Add New Routine</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    
                    {/* Folder Contents */}
                    {!isCollapsed && folderRoutines.map(routine => (
                      <View key={routine.id} style={styles.routineItem}>
                        <TouchableOpacity
                          style={styles.routineMainContent}
                          onPress={() => editRoutine(routine)}
                        >
                          <Text style={styles.routineName}>{routine.name}</Text>
                          <Text style={styles.routineExerciseCount}>
                            {routine.exercises.length} exercises
                          </Text>
                        </TouchableOpacity>
                        
                        <View style={styles.routineActions}>
                          <TouchableOpacity
                            style={styles.startRoutineButton}
                            onPress={() => startRoutineFromTemplate(routine)}
                          >
                            <Text style={styles.startRoutineButtonText}>Start Routine</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={styles.routineOptionsButton}
                            onPress={() => setRoutineOptionsVisible(
                              routineOptionsVisible === routine.id ? null : routine.id
                            )}
                          >
                            <Text style={styles.optionsButtonText}>⋯</Text>
                          </TouchableOpacity>
                        </View>
                        
                        {/* Routine Options Menu */}
                        {routineOptionsVisible === routine.id && (
                          <View style={styles.routineOptionsMenu}>
                            <TouchableOpacity
                              style={styles.optionItem}
                              onPress={() => editRoutine(routine)}
                            >
                              <Text style={styles.optionText}>Edit Routine</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.optionItem}
                              onPress={() => deleteRoutine(routine.id)}
                            >
                              <Text style={[styles.optionText, styles.deleteOptionText]}>Delete Routine</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                );
              })}
              
              {/* Routines without folders */}
              {routines
                .filter(routine => !routine.folderId)
                .map(routine => (
                  <View key={routine.id} style={styles.standaloneRoutineItem}>
                    <TouchableOpacity
                      style={styles.routineMainContent}
                      onPress={() => editRoutine(routine)}
                    >
                      <Text style={styles.routineName}>{routine.name}</Text>
                      <Text style={styles.routineExerciseCount}>
                        {routine.exercises.length} exercises
                      </Text>
                    </TouchableOpacity>
                    
                    <View style={styles.routineActions}>
                      <TouchableOpacity
                        style={styles.startRoutineButton}
                        onPress={() => startRoutineFromTemplate(routine)}
                      >
                        <Text style={styles.startRoutineButtonText}>Start Routine</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={styles.routineOptionsButton}
                        onPress={() => setRoutineOptionsVisible(
                          routineOptionsVisible === routine.id ? null : routine.id
                        )}
                      >
                        <Text style={styles.optionsButtonText}>⋯</Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* Routine Options Menu */}
                    {routineOptionsVisible === routine.id && (
                      <View style={styles.routineOptionsMenu}>
                        <TouchableOpacity
                          style={styles.optionItem}
                          onPress={() => editRoutine(routine)}
                        >
                          <Text style={styles.optionText}>Edit Routine</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.optionItem}
                          onPress={() => deleteRoutine(routine.id)}
                        >
                          <Text style={[styles.optionText, styles.deleteOptionText]}>Delete Routine</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              
              {routines.length === 0 && folders.length === 0 && (
                <Text style={styles.emptyRoutinesText}>
                  No routines created yet. Create your first routine to get started!
                </Text>
              )}
            </View>
            
            {/* Previous Workouts */}
            <View style={styles.previousWorkoutsSection}>
              <Text style={styles.sectionTitle}>Previous Workouts</Text>
              {workouts.map(workout => renderWorkout(workout))}
            </View>
          </View>
        </ScrollView>
        
        {renderActiveWorkoutScreen()}
        
        {/* Exercise Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={exerciseModalVisible}
          onRequestClose={() => setExerciseModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Select Exercise</Text>
              
              <ScrollView style={styles.exerciseList}>
                {exerciseLibrary.map(exercise => (
                  <TouchableOpacity
                    key={exercise.id}
                    style={styles.exerciseItem}
                    onPress={() => {
                      if (routineCreationVisible) {
                        addExerciseToRoutine(exercise);
                      } else {
                        addExerciseToWorkout(exercise);
                      }
                    }}
                  >
                    <Text style={styles.exerciseItemText}>
                      {exercise.name} - {exercise.muscleGroup}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setExerciseModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Routine Creation Screen */}
        <Modal
          animationType="slide"
          transparent={false}
          visible={routineCreationVisible}
          onRequestClose={cancelRoutineCreation}
        >
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
              {/* Routine Creation Header */}
              <View style={styles.routineCreationHeader}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={cancelRoutineCreation}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <Text style={styles.routineCreationTitle}>New Routine</Text>
                
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveRoutine}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                  {/* Routine Name Input */}
                  <TextInput
                    style={styles.routineNameInput}
                    placeholder="Routine Name"
                    placeholderTextColor={theme.textMuted}
                    value={routineName}
                    onChangeText={setRoutineName}
                  />
                  
                  {/* Folder Selection */}
                  <Text style={styles.inputLabel}>Folder (Optional)</Text>
                  <ScrollView 
                    horizontal 
                    style={styles.folderSelection}
                    showsHorizontalScrollIndicator={false}
                  >
                    <TouchableOpacity
                      style={[
                        styles.folderOption,
                        !selectedFolder && styles.selectedFolderOption
                      ]}
                      onPress={() => setSelectedFolder(undefined)}
                    >
                      <Text style={styles.folderOptionText}>No Folder</Text>
                    </TouchableOpacity>
                    {folders.map(folder => (
                      <TouchableOpacity
                        key={folder.id}
                        style={[
                          styles.folderOption,
                          selectedFolder === folder.id && styles.selectedFolderOption
                        ]}
                        onPress={() => setSelectedFolder(folder.id)}
                      >
                        <Text style={styles.folderOptionText}>{folder.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  
                  {/* Current Exercises */}
                  {currentRoutineExercises.map(exercise => (
                    <View key={exercise.id} style={styles.routineExerciseCard}>
                      <Text style={styles.exerciseName}>
                        {exercise.name} - {exercise.muscleGroup}
                      </Text>
                    </View>
                  ))}
                  
                  {/* Add Exercise Button */}
                  <TouchableOpacity
                    style={styles.addExerciseButton}
                    onPress={() => setExerciseModalVisible(true)}
                  >
                    <Text style={styles.addButtonText}>+ Add Exercise</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>

        {/* Folder Creation Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={folderCreationVisible}
          onRequestClose={() => setFolderCreationVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeader}>Create New Folder</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Folder Name"
                placeholderTextColor={theme.textMuted}
                value={newFolderName}
                onChangeText={setNewFolderName}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setFolderCreationVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={createFolder}
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
  routinesSection: {
    marginBottom: 24,
  },
  previousWorkoutsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
  },
  newRoutineButton: {
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.primary,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  newRoutineButtonText: {
    color: theme.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  emptyRoutinesText: {
    color: theme.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  activeWorkoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  minimizeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minimizeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  activeWorkoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
  },
  finishButton: {
    backgroundColor: theme.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  finishButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: theme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.primary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 4,
  },
  setInput: {
    flex: 1,
    textAlign: 'center',
    color: theme.text,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginHorizontal: 4,
  },
  addExerciseButton: {
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginVertical: 16,
    borderWidth: 2,
    borderColor: theme.primary,
    borderStyle: 'dashed',
  },
  discardButton: {
    backgroundColor: theme.error,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  discardButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
    maxHeight: '70%',
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
  exerciseItemText: {
    fontSize: 16,
    color: theme.text,
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
  routinesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  createFolderButton: {
    backgroundColor: theme.cardBackground,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  createFolderButtonText: {
    color: theme.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  folderContainer: {
    marginBottom: 16,
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  routineItem: {
    backgroundColor: theme.background,
    borderRadius: 6,
    padding: 12,
    marginVertical: 4,
    marginLeft: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  routineName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  routineExerciseCount: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  routineCreationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  routineCreationTitle: {
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
  routineNameInput: {
    borderWidth: 1,
    borderColor: theme.inputBorder,
    backgroundColor: theme.inputBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  folderSelection: {
    marginBottom: 16,
  },
  folderOption: {
    backgroundColor: theme.cardBackground,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectedFolderOption: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  folderOptionText: {
    color: theme.text,
    fontSize: 14,
    fontWeight: '600',
  },
  routineExerciseCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.borderLight,
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  createButton: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});