import React, { useEffect, useCallback } from 'react';
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

// Import all our custom hooks
import { useActiveWorkout } from '../hooks/useActiveWorkout';
import { useRoutineManagement } from '../hooks/useRoutineManagement';
import { useFolderManagement } from '../hooks/useFolderManagement';
import { useWorkoutData } from '../hooks/useWorkoutData';

// Import components
import ActiveWorkoutModal from '../components/workout/ActiveWorkoutModal';
import WorkoutOverviewModal from '../components/workout/WorkoutOverviewModal';
import RoutineCreationModal from '../components/workout/RoutineCreationModal';
import FolderCreationModal from '../components/workout/FolderCreationModal';
import RoutineRenameModal from '../components/workout/RoutineRenameModal';
import FolderRenameModal from '../components/workout/FolderRenameModal';
import FolderDeleteConfirmationModal from '../components/workout/FolderDeleteConfirmationModal';
import RoutineDeleteConfirmationModal from '../components/workout/RoutineDeleteConfirmationModal';
import OptionsBottomSheet from '../components/workout/OptionsBottomSheet';
import RoutinesList from '../components/workout/RoutinesList';
import BottomWorkoutProgressBar from '../components/workout/BottomWorkoutProgressBar';
import ExerciseSelectionScreen from './ExerciseSelectionScreen';

// Import services
import { WorkoutSession } from '../services/WorkoutStorageService';

export default function WorkoutTrackerScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Use our custom hooks
  const activeWorkout = useActiveWorkout();
  const routineManagement = useRoutineManagement();
  const folderManagement = useFolderManagement();
  const workoutData = useWorkoutData();

  // Initialize data on component mount
  useEffect(() => {
    routineManagement.fetchRoutines();
    folderManagement.fetchFolders();
    activeWorkout.restoreActiveWorkout();
  }, []);

  // Database operations that require coordination between hooks
  const saveWorkoutToDatabase = useCallback(async (workout: WorkoutSession) => {
    try {
      // Check authentication status
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        return;
      }

      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.error('No authenticated user for workout save');
        console.log('Session:', session);
        return;
      }

      console.log('🔐 Saving workout for user:', user.data.user.id);
      console.log('📊 Session status:', {
        hasSession: !!session,
        userId: user.data.user.id,
        userEmail: user.data.user.email
      });

      // Test database connection with auth
      const { error: testError } = await supabase
        .schema('fitness')
        .from('workouts')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Auth test failed:', testError);
        return;
      }
      console.log('✅ Auth test passed');

      console.log('📊 Workout data:', {
        user_id: user.data.user.id,
        date: workout.startTime.toISOString().split('T')[0],
        start_time: workout.startTime.toISOString(),
        end_time: workout.endTime?.toISOString(),
        exerciseCount: workout.exercises.length,
        notes: workout.notes || 'No notes provided'
      });

      // 1. Create the workout record
      const { data: workoutData, error: workoutError } = await supabase
        .schema('fitness')
        .from('workouts')
        .insert({
          user_id: user.data.user.id,
          date: workout.startTime.toISOString().split('T')[0], // Date only
          start_time: workout.startTime.toISOString(),
          end_time: workout.endTime?.toISOString(),
          notes: workout.notes || `Workout completed with ${workout.exercises.length} exercises`
        })
        .select()
        .single();

      if (workoutError) {
        console.error('Error creating workout record:', workoutError);
        return;
      }

      console.log('Created workout record:', workoutData.id);

      // 2. Create workout_exercises and exercise_sets
      for (let exerciseIndex = 0; exerciseIndex < workout.exercises.length; exerciseIndex++) {
        const exercise = workout.exercises[exerciseIndex];
        
        console.log('💪 Creating workout exercise:', {
          exerciseName: exercise.name,
          exerciseId: exercise.id,
          isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(exercise.id)
        });
        
        // Create workout_exercise record
        const { data: workoutExerciseData, error: workoutExerciseError } = await supabase
          .schema('fitness')
          .from('workout_exercises')
          .insert({
            workout_id: workoutData.id,
            exercise_id: exercise.id,
            order: exerciseIndex + 1,
            notes: exercise.notes || null
          })
          .select()
          .single();

        if (workoutExerciseError) {
          console.error('Error creating workout exercise:', workoutExerciseError);
          continue;
        }

        // Create exercise_sets for completed sets only
        const completedSets = exercise.sets.filter(set => set.completed);
        
        for (const set of completedSets) {
          const { error: setError } = await supabase
            .schema('fitness')
            .from('exercise_sets')
            .insert({
              workout_exercise_id: workoutExerciseData.id,
              reps: set.reps || 0,
              weight_lbs: set.weight || 0,
              degree: set.degree || null,
              created_at: new Date().toISOString()
            });

          if (setError) {
            console.error('Error creating exercise set:', setError);
          }
        }

        console.log(`Saved ${completedSets.length} sets for exercise: ${exercise.name}`);
      }

      console.log('Successfully saved workout to database');
    } catch (error) {
      console.error('Unexpected error saving workout to database:', error);
    }
  }, []);

  // Enhanced finish workout that saves to database
  // Handle saving workout from overview
  const handleSaveWorkout = useCallback(async (notes: string) => {
    try {
      const completedWorkout = await activeWorkout.saveWorkout(notes);
      if (completedWorkout) {
        // Save to database
        await saveWorkoutToDatabase(completedWorkout);
        console.log('Workout completed and saved:', completedWorkout.id);
      }
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  }, [activeWorkout, saveWorkoutToDatabase]);


  // Handle exercise selection - coordinate between active workout and routine creation
  const handleExerciseSelection = useCallback((exercise: any) => {
    if (routineManagement.routineCreationVisible) {
      // Check if we're replacing an exercise
      const wasReplaced = routineManagement.handleExerciseReplacement(exercise);
      if (!wasReplaced) {
        // Add new exercise to routine
        routineManagement.addExerciseToRoutine(exercise);
      }
      workoutData.setExerciseScreenVisible(false);
    } else {
      // Add to active workout
      activeWorkout.addExerciseToWorkout(exercise);
      workoutData.setExerciseScreenVisible(false);
    }
  }, [routineManagement, activeWorkout, workoutData]);

  // Start routine from template - coordinate between routine and active workout
  const startRoutineFromTemplate = useCallback(async (routine: any) => {
    const workoutExercises = routineManagement.createWorkoutFromRoutine(routine);
    await activeWorkout.startWorkoutFromRoutine(workoutExercises, routine.name);
  }, [routineManagement, activeWorkout]);

  // Show routine options
  const showRoutineOptions = useCallback((routine: any) => {
    const options = [
      {
        text: 'Edit Routine',
        onPress: async () => {
          routineManagement.startEditingRoutine(routine);
        }
      },
      {
        text: 'Rename Routine',
        onPress: async () => routineManagement.startRenamingRoutine(routine.id, routine.name)
      },
      {
        text: 'Delete Routine',
        onPress: async () => routineManagement.deleteRoutine(routine.id),
        isDelete: true
      }
    ];
    
    workoutData.showBottomSheetOptions(options, routine.name);
  }, [routineManagement, workoutData]);

  // Show folder options
  const showFolderOptions = useCallback((folder: any) => {
    folderManagement.showFolderOptions(folder, (options, title) => {
      // Enhance the options to handle "Add New Routine" and "Delete Folder" for this specific folder
      const enhancedOptions = options.map(option => {
        if (option.text === 'Add New Routine') {
          return {
            ...option,
            onPress: async () => {
              // Start new routine creation with this folder pre-selected
              routineManagement.startNewRoutine(folder.id, folderManagement.folders);
            }
          };
        } else if (option.text === 'Delete Folder') {
          return {
            ...option,
            onPress: async () => {
              // Get routines in this folder and pass them to deleteFolder
              const routinesInFolder = routineManagement.routines.filter(r => r.folderId === folder.id);
              await folderManagement.deleteFolder(folder.id, routinesInFolder);
            }
          };
        }
        return option;
      });
      
      workoutData.showBottomSheetOptions(enhancedOptions, title);
    });
  }, [folderManagement, workoutData, routineManagement]);

  // Handle folder deletion with routine coordination
  const handleFolderDeletion = useCallback(async (folderId: string) => {
    const routinesInFolder = routineManagement.routines.filter(r => r.folderId === folderId);
    
    // Remove routines from routine management state
    const updatedRoutines = routineManagement.routines.filter(r => r.folderId !== folderId);
    routineManagement.setRoutines(updatedRoutines);
    
    // Now delete the folder itself (which will also handle database cleanup)
    await folderManagement.performFolderDeletion(folderId, routinesInFolder);
  }, [folderManagement, routineManagement]);

  // If exercise selection screen is visible, show it
  if (workoutData.exerciseScreenVisible) {
    return (
      <ExerciseSelectionScreen
        onSelectExercise={handleExerciseSelection}
        onCancel={() => workoutData.setExerciseScreenVisible(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          onScrollBeginDrag={workoutData.handleBackgroundPress}
        >
          <View style={styles.content}>
            <Text style={styles.header}>Workouts</Text>
            
            {/* New Workout Button */}
            <TouchableOpacity
              style={styles.newWorkoutButton}
              onPress={activeWorkout.startNewWorkout}
            >
              <Text style={styles.newWorkoutButtonText}>New Workout</Text>
            </TouchableOpacity>
            
            {/* Routines Section */}
            <RoutinesList
              routines={routineManagement.routines}
              folders={folderManagement.folders}
              collapsedFolders={folderManagement.collapsedFolders}
              onCreateFolder={() => folderManagement.setFolderCreationVisible(true)}
              onStartNewRoutine={() => routineManagement.startNewRoutine(undefined, folderManagement.folders)}
              onToggleFolderCollapse={folderManagement.toggleFolderCollapse}
              onShowFolderOptions={showFolderOptions}
              onShowRoutineOptions={showRoutineOptions}
              onStartRoutineFromTemplate={startRoutineFromTemplate}
              onEditRoutine={() => {
                // Implementation would go here
              }}
            />
          </View>
        </ScrollView>
        
        <ActiveWorkoutModal
          visible={activeWorkout.activeWorkoutVisible}
          exercises={activeWorkout.currentWorkoutExercises}
          workoutStartTime={activeWorkout.workoutStartTime}
          totalPausedDuration={activeWorkout.totalPausedDuration}
          onMinimize={activeWorkout.minimizeWorkout}
          onFinish={activeWorkout.finishWorkout}
          onDiscard={activeWorkout.discardWorkout}
          onAddExercise={() => workoutData.setExerciseScreenVisible(true)}
          onToggleSetCompletion={activeWorkout.toggleActiveWorkoutSetCompletion}
          onUpdateSet={activeWorkout.updateActiveWorkoutSet}
          onAddSet={activeWorkout.addSetToExercise}
          onRemoveSet={activeWorkout.removeSetFromExercise}
          onUpdateExerciseNotes={activeWorkout.updateActiveWorkoutExerciseNotes}
          onUpdateExerciseDegree={activeWorkout.updateActiveWorkoutExerciseDegree}
        />

        <WorkoutOverviewModal
          visible={activeWorkout.workoutOverviewVisible}
          workoutName={activeWorkout.currentRoutineName || "Workout"}
          exercises={activeWorkout.currentWorkoutExercises}
          workoutStartTime={activeWorkout.workoutStartTime}
          workoutEndTime={activeWorkout.workoutEndTime}
          totalPausedDuration={activeWorkout.totalPausedDuration}
          onSave={handleSaveWorkout}
          onDiscard={activeWorkout.discardWorkout}
          onCancel={activeWorkout.cancelOverview}
        />

        <RoutineCreationModal
          visible={routineManagement.routineCreationVisible}
          routineName={routineManagement.routineName}
          exercises={routineManagement.currentRoutineExercises}
          folders={folderManagement.folders}
          selectedFolder={routineManagement.selectedFolder}
          isEditing={!!routineManagement.editingRoutineId}
          onCancel={routineManagement.cancelRoutineCreation}
          onSave={routineManagement.saveRoutine}
          onRoutineNameChange={routineManagement.setRoutineName}
          onFolderSelect={routineManagement.setSelectedFolder}
          onAddExercise={() => workoutData.setExerciseScreenVisible(true)}
          onUpdateExerciseSet={routineManagement.updateRoutineExerciseSet}
          onAddExerciseSet={routineManagement.addRoutineExerciseSet}
          onRemoveExerciseSet={routineManagement.removeRoutineExerciseSet}
          onRemoveExercise={routineManagement.removeExerciseFromRoutine}
          onReplaceExercise={routineManagement.replaceExerciseInRoutine}
          onReorderExercises={routineManagement.reorderRoutineExercises}
          onUpdateExerciseNotes={routineManagement.updateExerciseNotes}
          onUpdateExerciseDegree={routineManagement.updateExerciseDegree}
        />

        <FolderCreationModal
          visible={folderManagement.folderCreationVisible}
          folderName={folderManagement.newFolderName}
          onFolderNameChange={folderManagement.setNewFolderName}
          onCreate={folderManagement.createFolder}
          onCancel={() => folderManagement.setFolderCreationVisible(false)}
        />

        <RoutineRenameModal
          visible={routineManagement.routineRenameVisible}
          routineName={routineManagement.newRoutineName}
          onRoutineNameChange={(name) => routineManagement.setNewRoutineName(name)}
          onRename={routineManagement.renameRoutine}
          onCancel={routineManagement.cancelRoutineRename}
        />

        <FolderRenameModal
          visible={folderManagement.folderRenameVisible}
          folderName={folderManagement.renameFolderName}
          onFolderNameChange={folderManagement.setRenameFolderName}
          onRename={folderManagement.renameFolderFromModal}
          onCancel={folderManagement.cancelFolderRename}
        />

        <OptionsBottomSheet
          visible={workoutData.bottomSheetVisible}
          title={workoutData.bottomSheetTitle}
          options={workoutData.bottomSheetOptions}
          onClose={workoutData.hideBottomSheet}
        />

        <FolderDeleteConfirmationModal
          visible={folderManagement.folderDeleteConfirmVisible}
          folderName={folderManagement.deletingFolderId ? 
            folderManagement.folders.find(f => f.id === folderManagement.deletingFolderId)?.name || '' : ''}
          routineCount={folderManagement.deletingFolderId ? 
            routineManagement.routines.filter(r => r.folderId === folderManagement.deletingFolderId).length : 0}
          onConfirm={async () => {
            if (folderManagement.deletingFolderId) {
              await handleFolderDeletion(folderManagement.deletingFolderId);
            }
            folderManagement.setFolderDeleteConfirmVisible(false);
            folderManagement.setDeletingFolderId(null);
          }}
          onCancel={() => {
            folderManagement.setFolderDeleteConfirmVisible(false);
            folderManagement.setDeletingFolderId(null);
          }}
        />

        <RoutineDeleteConfirmationModal
          visible={routineManagement.routineDeleteConfirmVisible}
          routineName={routineManagement.deletingRoutineId ? 
            routineManagement.routines.find(r => r.id === routineManagement.deletingRoutineId)?.name || '' : ''}
          exerciseCount={routineManagement.deletingRoutineId ? 
            routineManagement.routines.find(r => r.id === routineManagement.deletingRoutineId)?.exercises.length || 0 : 0}
          onConfirm={async () => {
            if (routineManagement.deletingRoutineId) {
              await routineManagement.performRoutineDeletion(routineManagement.deletingRoutineId);
            }
            routineManagement.setRoutineDeleteConfirmVisible(false);
            routineManagement.setDeletingRoutineId(null);
          }}
          onCancel={() => {
            routineManagement.setRoutineDeleteConfirmVisible(false);
            routineManagement.setDeletingRoutineId(null);
          }}
        />

        {/* Bottom Workout Progress Bar */}
        <BottomWorkoutProgressBar
          visible={activeWorkout.isWorkoutMinimized}
          onResume={activeWorkout.restoreWorkout}
          onDiscard={activeWorkout.discardWorkout}
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