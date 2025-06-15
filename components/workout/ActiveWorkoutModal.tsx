import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  Animated,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import {
  ScrollView,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { useTheme } from '../../contexts/ThemeContext';
import { useUnits } from '../../contexts/UnitsContext';
import { supabase } from '../../supabaseClient';

type ExerciseSet = {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
  degree?: number | null;
};

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: ExerciseSet[];
  degree?: number | null;
  notes?: string;
};

interface ActiveWorkoutModalProps {
  visible: boolean;
  exercises: Exercise[];
  workoutStartTime: Date | null;
  totalPausedDuration: number;
  onMinimize: () => void;
  onFinish: () => void;
  onDiscard: () => void;
  onAddExercise: () => void;
  onToggleSetCompletion: (exerciseId: string, setId: string) => void;
  onUpdateSet: (exerciseId: string, setId: string, field: 'weight' | 'reps' | 'degree', value: number) => void;
  onAddSet: (exerciseId: string) => void;
  onRemoveSet: (exerciseId: string, setId: string) => void;
  onUpdateExerciseNotes: (exerciseId: string, notes: string) => void;
  onUpdateExerciseDegree: (exerciseId: string, degree: number) => void;
}

export default function ActiveWorkoutModal({
  visible,
  exercises,
  workoutStartTime,
  totalPausedDuration,
  onMinimize,
  onFinish,
  onDiscard,
  onAddExercise,
  onToggleSetCompletion,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onUpdateExerciseNotes,
  onUpdateExerciseDegree
}: ActiveWorkoutModalProps) {
  const { theme } = useTheme();
  const { getVolumeLabel, getWeightLabel, convertStoredWeightForDisplay, getWeightUnit } = useUnits();
  const styles = createStyles(theme);
  const [swipedRows, setSwipedRows] = useState<Set<string>>(new Set());
  const [showDegreeSelector, setShowDegreeSelector] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [previousSetData, setPreviousSetData] = useState<Record<string, Array<{weight: number, reps: number}>>>({});
  

  // Fetch previous set data for exercises - only when modal opens
  const fetchPreviousSetData = React.useCallback(async (exerciseList: typeof exercises) => {
    if (!exerciseList.length) return;

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const exerciseIds = exerciseList.map(ex => ex.id);
      
      // Get the most recent completed workouts for these exercises
      // We want all sets in order from the most recent workout session
      
      const { data: previousWorkouts, error } = await supabase
        .schema('fitness')
        .from('workouts')
        .select(`
          id,
          date,
          start_time,
          end_time,
          workout_exercises!inner(
            exercise_id,
            exercise_sets(
              reps,
              weight_lbs,
              created_at
            )
          )
        `)
        .eq('user_id', user.data.user.id)
        .in('workout_exercises.exercise_id', exerciseIds)
        .not('end_time', 'is', null)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching previous sets:', error);
        return;
      }

      if (previousWorkouts) {
        console.log('Raw previous workouts data:', previousWorkouts);
        console.log('Looking for exercise IDs:', exerciseIds);
        
        const latestSetsMap: Record<string, Array<{weight: number, reps: number}>> = {};
        
        // Process workouts in chronological order (most recent first)
        previousWorkouts.forEach((workout: any, workoutIndex: number) => {
          console.log(`[Workout ${workoutIndex}] Processing workout from ${workout.date}:`, workout);
          
          workout.workout_exercises.forEach((workoutExercise: any) => {
            const exerciseId = workoutExercise.exercise_id;
            
            // Only process if we need data for this exercise and haven't found it yet
            if (!latestSetsMap[exerciseId] && exerciseIds.includes(exerciseId)) {
              const sets = workoutExercise.exercise_sets;
              
              if (sets && sets.length > 0) {
                // Sort sets by created_at to maintain the order they were performed
                const orderedSets = sets.sort((a: any, b: any) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                
                // Store all sets in order for 1:1 mapping (convert stored weights to display units)
                latestSetsMap[exerciseId] = orderedSets.map((set: any) => ({
                  weight: convertStoredWeightForDisplay(set.weight_lbs || 0),
                  reps: set.reps || 0
                }));
                
                console.log(`✅ Set previous data for exercise ${exerciseId} from workout ${workout.date}:`);
                console.log(`   Sets in order:`, orderedSets.map((s: any, i: number) => `Set ${i+1}: ${s.weight_lbs}x${s.reps}`));
              }
            } else if (latestSetsMap[exerciseId]) {
              console.log(`⏭️ Skipping exercise ${exerciseId} - already have data from more recent workout`);
            } else {
              console.log(`⏭️ Skipping exercise ${exerciseId} - not in current workout`);
            }
          });
        });

        console.log('Final previous sets map:', latestSetsMap);
        console.log('Number of exercises with previous data:', Object.keys(latestSetsMap).length);
        setPreviousSetData(latestSetsMap);
      } else {
        console.log('No previous workouts data returned from query');
      }
    } catch (error) {
      console.error('Error fetching previous set data:', error);
    }
  }, [convertStoredWeightForDisplay]);

  // Fetch previous data only when modal opens
  React.useEffect(() => {
    if (visible && exercises.length > 0) {
      fetchPreviousSetData(exercises);
    }
  }, [visible]); // Only depend on visible, not exercises


  // Isolated Timer Component that doesn't affect parent re-renders
  const IsolatedTimerDisplay = React.memo(({ 
    startTime, 
    pausedDuration 
  }: { 
    startTime: Date | null; 
    pausedDuration: number; 
  }) => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);

      return () => clearInterval(interval);
    }, []);

    const formatDuration = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m ${remainingSeconds}s`;
      } else if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      } else {
        return `${remainingSeconds}s`;
      }
    };

    const durationInSeconds = startTime ? 
      Math.floor((currentTime.getTime() - startTime.getTime() - pausedDuration) / 1000) : 0;

    return (
      <Text style={styles.statValue}>{formatDuration(durationInSeconds)}</Text>
    );
  });

  // Static stats calculation that only updates when exercises change
  const getWorkoutStats = React.useCallback(() => {
    const completedSets = exercises.reduce((total, exercise) => 
      total + exercise.sets.filter(set => set.completed).length, 0
    );
    const totalVolume = exercises.reduce((total, exercise) => 
      total + exercise.sets
        .filter(set => set.completed)
        .reduce((setTotal, set) => setTotal + (set.weight * set.reps), 0), 0
    );
    
    return { completedSets, totalVolume };
  }, [exercises]);

  // Memoized stats component with isolated timer
  const WorkoutStatsDisplay = React.useMemo(() => {
    const stats = getWorkoutStats();
    
    return (
      <View style={styles.workoutStats}>
        <View style={styles.statItem}>
          <IsolatedTimerDisplay 
            startTime={workoutStartTime}
            pausedDuration={totalPausedDuration}
          />
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalVolume}</Text>
          <Text style={styles.statLabel}>{getVolumeLabel()}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.completedSets}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
      </View>
    );
  }, [workoutStartTime, totalPausedDuration, getWorkoutStats]);


  // SwipeableSetRow Component for Active Workout - Completely isolated from timer updates
  const SwipeableSetRow = React.memo(({ exercise, set, setIndex, previousData }: {
    exercise: Exercise;
    set: ExerciseSet;
    setIndex: number;
    previousData?: Array<{weight: number, reps: number}>;
  }) => {
    const translateX = React.useRef(new Animated.Value(0)).current;
    const deleteOpacity = React.useRef(new Animated.Value(0)).current;
    const rowId = `${exercise.id}-${setIndex}`;
    const isSwipedOpen = swipedRows.has(rowId);

    // Local state for TextInput values - starts empty for placeholder behavior
    const [localWeight, setLocalWeight] = useState('');
    const [localReps, setLocalReps] = useState('');
    
    
    // Track the last known external values to detect real changes
    const lastExternalWeight = React.useRef(set.weight);
    const lastExternalReps = React.useRef(set.reps);

    // Create placeholder text from current values
    const weightPlaceholder = set.weight > 0 ? set.weight.toString() : '0';
    const repsPlaceholder = set.reps > 0 ? set.reps.toString() : '0';


    // Simple focus handlers - no complex management needed
    const handleWeightFocus = React.useCallback(() => {
      // Just a placeholder for future focus logic if needed
    }, []);

    const handleRepsFocus = React.useCallback(() => {
      // Just a placeholder for future focus logic if needed  
    }, []);

    // Handle text changes without saving to parent (to avoid re-renders)
    const handleWeightChange = React.useCallback((text: string) => {
      setLocalWeight(text);
    }, []);

    const handleRepsChange = React.useCallback((text: string) => {
      setLocalReps(text);
    }, []);

    // Handle end editing (when user finishes editing via Return key or other means)
    const handleWeightEndEditing = React.useCallback(() => {
      if (localWeight) {
        const numericWeight = parseFloat(localWeight);
        if (!isNaN(numericWeight)) {
          lastExternalWeight.current = numericWeight;
          onUpdateSet(exercise.id, set.id, 'weight', numericWeight);
          // Don't modify localWeight - keep user's input as-is
        }
      }
    }, [localWeight, exercise.id, set.id, onUpdateSet]);

    const handleRepsEndEditing = React.useCallback(() => {
      if (localReps) {
        const numericReps = parseInt(localReps);
        if (!isNaN(numericReps)) {
          lastExternalReps.current = numericReps;
          onUpdateSet(exercise.id, set.id, 'reps', numericReps);
          // Don't modify localReps - keep user's input as-is
        }
      }
    }, [localReps, exercise.id, set.id, onUpdateSet]);

    // Simple blur handlers - no saving, just placeholder for future logic
    const handleWeightBlur = React.useCallback(() => {
      // Don't save on blur to avoid interference with focus switching
    }, []);

    const handleRepsBlur = React.useCallback(() => {
      // Don't save on blur to avoid interference with focus switching
    }, []);

    // Refs for focus management
    const weightInputRef = React.useRef<TextInput>(null);
    const repsInputRef = React.useRef<TextInput>(null);

    // Format previous data for display
    const formatPreviousData = React.useCallback(() => {
      if (!previousData || !Array.isArray(previousData) || previousData.length === 0) {
        return '-';
      }
      
      // Get the corresponding set data for this set index (0-based)
      const setData = previousData[setIndex];
      if (!setData || (!setData.weight && !setData.reps)) {
        return '-';
      }
      
      // Display weight with appropriate unit based on user preference
      return `${setData.weight}${getWeightUnit()} x ${setData.reps}`;
    }, [previousData, setIndex, getWeightUnit]);


    const panGesture = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-5, 5])
      .onUpdate((event) => {
        const currentlyOpen = swipedRows.has(rowId);
        
        if (currentlyOpen) {
          // If already open, allow both left and right swipes
          if (event.translationX > 0) {
            // Right swipe to close - start from -80 position
            translateX.setValue(Math.min(-80 + event.translationX, 0));
          } else {
            // Left swipe when already open - keep at -80
            translateX.setValue(-80);
          }
        } else {
          // If not open, only allow left swipe to open
          if (event.translationX < 0) {
            translateX.setValue(Math.max(event.translationX, -80));
            // Show delete button when swiping left
            if (event.translationX < -10) {
              deleteOpacity.setValue(1);
            }
          }
        }
      })
      .onEnd((event) => {
        const currentlyOpen = swipedRows.has(rowId);
        
        if (currentlyOpen) {
          // If already open, check if user wants to close with right swipe
          if (event.translationX > 40 || (event.translationX > 20 && event.velocityX > 500)) {
            // Close the swipe
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              damping: 20,
              stiffness: 300,
            }).start();
            Animated.timing(deleteOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
            setSwipedRows(prev => {
              const newSet = new Set(prev);
              newSet.delete(rowId);
              return newSet;
            });
          } else {
            // Keep it open
            Animated.spring(translateX, {
              toValue: -80,
              useNativeDriver: true,
              damping: 20,
              stiffness: 300,
            }).start();
            deleteOpacity.setValue(1);
          }
        } else {
          // If not open, check if user wants to open with left swipe
          const shouldShowDelete = event.translationX < -40 || (event.translationX < -20 && event.velocityX < -500);
          
          if (shouldShowDelete) {
            // Open the swipe and keep it visible
            Animated.spring(translateX, {
              toValue: -80,
              useNativeDriver: true,
              damping: 20,
              stiffness: 300,
            }).start();
            setSwipedRows(prev => new Set([...prev, rowId]));
            deleteOpacity.setValue(1);
          } else {
            // Snap back to closed
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              damping: 20,
              stiffness: 300,
            }).start();
            Animated.timing(deleteOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        }
      });

    const tapGesture = Gesture.Tap()
      .onEnd(() => {
        handleTap();
      });

    // Function to close swipe from outside
    React.useEffect(() => {
      if (!swipedRows.has(rowId) && isSwipedOpen) {
        // Row was closed externally, animate back
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        Animated.timing(deleteOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }, [swipedRows, rowId, isSwipedOpen]);

    const handleDelete = () => {
      onRemoveSet(exercise.id, set.id);
    };

    const handleTap = () => {
      if (isSwipedOpen) {
        // Close if swiped open
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        Animated.timing(deleteOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
        setSwipedRows(prev => {
          const newSet = new Set(prev);
          newSet.delete(rowId);
          return newSet;
        });
      }
    };

    return (
      <View style={styles.swipeableContainer}>
        <Animated.View style={[
          styles.deleteButtonContainer,
          { opacity: deleteOpacity }
        ]}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </Animated.View>
        
        <GestureDetector gesture={Gesture.Simultaneous(panGesture, tapGesture)}>
          <Animated.View
            style={[
              styles.setRow,
              { transform: [{ translateX }] }
            ]}
          >
            <View style={styles.setRowContent}>
              {/* Set number */}
              <View style={styles.setNumberContainer}>
                <Text style={styles.setText}>{setIndex + 1}</Text>
              </View>
              
              {/* Previous data */}
              <View style={styles.previousDataContainer}>
                <Text style={styles.previousDataText}>{formatPreviousData()}</Text>
              </View>
              
              {/* Input areas */}
              <TextInput
                ref={weightInputRef}
                style={styles.setInputCompact}
                value={localWeight}
                placeholder={weightPlaceholder}
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                onChangeText={handleWeightChange}
                onFocus={handleWeightFocus}
                onBlur={handleWeightBlur}
                onEndEditing={handleWeightEndEditing}
                selectTextOnFocus={true}
              />
              <TextInput
                ref={repsInputRef}
                style={styles.setInputCompact}
                value={localReps}
                placeholder={repsPlaceholder}
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                onChangeText={handleRepsChange}
                onFocus={handleRepsFocus}
                onBlur={handleRepsBlur}
                onEndEditing={handleRepsEndEditing}
                selectTextOnFocus={true}
              />
              
              {/* Checkbox */}
              <TouchableOpacity
                style={[
                  styles.checkboxButtonCompact,
                  set.completed ? styles.checkedBox : styles.uncheckedBox,
                ]}
                onPress={() => onToggleSetCompletion(exercise.id, set.id)}
              >
                {set.completed && (
                  <Text style={styles.checkboxText}>✓</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    );
  }, (prevProps, nextProps) => {
    // Only re-render if essential props change - ignore weight/reps changes as they're handled locally
    const shouldNotRerender = (
      prevProps.set.id === nextProps.set.id &&
      prevProps.set.completed === nextProps.set.completed &&
      prevProps.exercise.id === nextProps.exercise.id &&
      prevProps.exercise.name === nextProps.exercise.name &&
      prevProps.setIndex === nextProps.setIndex &&
      JSON.stringify(prevProps.previousData) === JSON.stringify(nextProps.previousData)
    );
    
    return shouldNotRerender;
  });

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onMinimize}
      supportedOrientations={['portrait']}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Active Workout Header */}
          <View style={styles.activeWorkoutHeader}>
            <TouchableOpacity
              style={styles.minimizeButton}
              onPress={onMinimize}
            >
              <Text style={styles.minimizeButtonText}>−</Text>
            </TouchableOpacity>
            
            <Text style={styles.activeWorkoutTitle}>Active Workout</Text>
            
            <TouchableOpacity
              style={styles.finishButton}
              onPress={onFinish}
            >
              <Text style={styles.finishButtonText}>Finish</Text>
            </TouchableOpacity>
          </View>
          
          {/* Workout Stats */}
          {WorkoutStatsDisplay}
          
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={true}
            bounces={true}
            scrollEventThrottle={16}
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            automaticallyAdjustContentInsets={false}
          >
            <View style={styles.content}>
              {/* Current Exercises */}
              {exercises.map(exercise => (
                <View key={exercise.id} style={styles.workoutCard}>
                  <Text style={styles.exerciseName}>
                    {exercise.name} - {exercise.muscleGroup}
                  </Text>
                  
                  {/* Degree Selector - Only for exercises with degree */}
                  {typeof exercise.degree === 'number' && (
                    <View style={styles.exerciseOptionsSection}>
                      <Text style={styles.exerciseOptionsLabel}>Degree</Text>
                      <TouchableOpacity
                        style={styles.exerciseDegreeSelector}
                        onPress={() => {
                          setSelectedExerciseId(exercise.id);
                          setShowDegreeSelector(true);
                        }}
                      >
                        <Text style={styles.exerciseDegreeSelectorText}>{exercise.degree}°</Text>
                        <Text style={styles.exerciseDegreeSelectorArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Exercise Notes */}
                  <View style={styles.exerciseOptionsSection}>
                    <Text style={styles.exerciseOptionsLabel}>Notes (optional)</Text>
                    <TextInput
                      style={styles.exerciseNotesInput}
                      placeholder="Add exercise notes..."
                      placeholderTextColor={theme.textMuted}
                      value={exercise.notes || ''}
                      onChangeText={(notes) => onUpdateExerciseNotes(exercise.id, notes)}
                      multiline={true}
                      numberOfLines={1}
                    />
                  </View>
                  
                  <View style={styles.setsHeader}>
                    <Text style={styles.setHeaderTextSet}>Set</Text>
                    <Text style={styles.setHeaderTextPrevious}>Previous</Text>
                    <Text style={styles.setHeaderTextInput}>{getWeightLabel().replace(' (lbs)', '').replace(' (kg)', '')}</Text>
                    <Text style={styles.setHeaderTextReps}>Reps</Text>
                    <Text style={styles.setHeaderTextCheckbox}>Done</Text>
                  </View>
                  
                  {exercise.sets.map((set, index) => (
                    <SwipeableSetRow
                      key={set.id}
                      exercise={exercise}
                      set={set}
                      setIndex={index}
                      previousData={previousSetData[exercise.id]}
                    />
                  ))}
                  
                  <TouchableOpacity
                    style={styles.addSetButton}
                    onPress={() => onAddSet(exercise.id)}
                  >
                    <Text style={styles.addSetButtonText}>+ Add Set</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              {/* Add Exercise Button */}
              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={onAddExercise}
              >
                <Text style={styles.addExerciseButtonText}>+ Add Exercise</Text>
              </TouchableOpacity>
              
              {/* Discard Workout Button */}
              <TouchableOpacity
                style={styles.discardButton}
                onPress={onDiscard}
              >
                <Text style={styles.discardButtonText}>Discard Workout</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        
        {/* Degree Selector Modal */}
        <Modal
          visible={showDegreeSelector}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDegreeSelector(false)}
        >
          <View style={styles.degreeModalOverlay}>
            <View style={styles.degreeModalContent}>
              <Text style={styles.degreeModalTitle}>Select Degree</Text>
              <View style={styles.degreeOptionsContainer}>
                {[0, 15, 30, 45, 60, 75, 90].map((degree) => (
                  <TouchableOpacity
                    key={degree}
                    style={[
                      styles.degreeOption,
                      selectedExerciseId && 
                      exercises.find(e => e.id === selectedExerciseId)?.degree === degree && 
                      styles.degreeOptionSelected
                    ]}
                    onPress={() => {
                      if (selectedExerciseId) {
                        onUpdateExerciseDegree(selectedExerciseId, degree);
                      }
                      setShowDegreeSelector(false);
                    }}
                  >
                    <Text style={[
                      styles.degreeOptionText,
                      selectedExerciseId && 
                      exercises.find(e => e.id === selectedExerciseId)?.degree === degree && 
                      styles.degreeOptionTextSelected
                    ]}>
                      {degree}°
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.degreeModalCancel}
                onPress={() => setShowDegreeSelector(false)}
              >
                <Text style={styles.degreeModalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 16,
    minHeight: '100%',
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
    fontSize: 12,
  },
  setHeaderTextSet: {
    fontWeight: '600',
    color: theme.textSecondary,
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
  },
  setHeaderTextPrevious: {
    fontWeight: '600',
    color: theme.textSecondary,
    flex: 1.2,
    textAlign: 'center',
    fontSize: 12,
    paddingLeft: 0,
    paddingRight: 8,
  },
  setHeaderTextInput: {
    fontWeight: '600',
    color: theme.textSecondary,
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    marginLeft: 6,
    marginRight: 2,
  },
  setHeaderTextReps: {
    fontWeight: '600',
    color: theme.textSecondary,
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    marginLeft: 4,
    marginRight: 4,
  },
  setHeaderTextCheckbox: {
    fontWeight: '600',
    color: theme.textSecondary,
    width: 32,
    textAlign: 'center',
    fontSize: 12,
    marginHorizontal: 6,
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
  setInputCompact: {
    flex: 1,
    textAlign: 'center',
    color: theme.text,
    backgroundColor: theme.inputBackground,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginHorizontal: 2,
    fontSize: 13,
  },
  checkboxButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    borderWidth: 2,
  },
  checkboxButtonCompact: {
    width: 20,
    height: 20,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    borderWidth: 2,
  },
  checkedBox: {
    backgroundColor: theme.success,
    borderColor: theme.success,
  },
  uncheckedBox: {
    backgroundColor: 'transparent',
    borderColor: theme.border,
  },
  checkboxText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  addSetButton: {
    backgroundColor: theme.cardBackground,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.primary,
    borderStyle: 'dashed',
  },
  addSetButtonText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  removeSetButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.error,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeSetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
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
  addExerciseButtonText: {
    color: theme.primary,
    fontWeight: 'bold',
    fontSize: 16,
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
  swipeableContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.error || '#FF3B30',
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  setRowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: theme.cardBackground,
  },
  setNumberContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previousDataContainer: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 0,
    paddingRight: 8,
  },
  previousDataText: {
    fontSize: 11,
    color: theme.textSecondary,
    textAlign: 'center',
    //fontStyle: 'italic',
  },
  swipeHandle: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  degreeText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  degreeButton: {
    backgroundColor: theme.primary,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
    minWidth: 40,
    alignItems: 'center',
  },
  degreeButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  degreeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  degreeModalContent: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  degreeModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  degreeOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  degreeOption: {
    backgroundColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  degreeOptionSelected: {
    backgroundColor: theme.primary,
  },
  degreeOptionText: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  degreeOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  degreeModalCancel: {
    backgroundColor: theme.border,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  degreeModalCancelText: {
    color: theme.textSecondary,
    fontWeight: '600',
  },
  exerciseOptionsSection: {
    marginTop: 8,
    marginBottom: 12,
  },
  exerciseOptionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  exerciseDegreeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.inputBorder,
    backgroundColor: theme.inputBackground,
    borderRadius: 6,
    padding: 8,
    minHeight: 36,
  },
  exerciseDegreeSelectorText: {
    fontSize: 13,
    color: theme.text,
    fontWeight: '600',
  },
  exerciseDegreeSelectorArrow: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  exerciseNotesInput: {
    borderWidth: 1,
    borderColor: theme.inputBorder,
    backgroundColor: theme.inputBackground,
    borderRadius: 6,
    padding: 8,
    fontSize: 13,
    color: theme.text,
    minHeight: 36,
    textAlignVertical: 'top',
  },
});