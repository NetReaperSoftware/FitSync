import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  SafeAreaView,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
  Keyboard
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
  onUpdateSet: (exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) => void;
  onAddSet: (exerciseId: string) => void;
  onRemoveSet: (exerciseId: string, setId: string) => void;
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
  onRemoveSet
}: ActiveWorkoutModalProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [swipedRows, setSwipedRows] = useState<Set<string>>(new Set());

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
          <Text style={styles.statLabel}>Volume (lbs)</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.completedSets}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
      </View>
    );
  }, [workoutStartTime, totalPausedDuration, getWorkoutStats]);

  const handleBackgroundPress = () => {
    // Clear all swiped rows
    setSwipedRows(new Set());
    
    // Dismiss keyboard when tapping outside
    Keyboard.dismiss();
  };

  // SwipeableSetRow Component for Active Workout - Completely isolated from timer updates
  const SwipeableSetRow = React.memo(({ exercise, set, setIndex }: {
    exercise: Exercise;
    set: ExerciseSet;
    setIndex: number;
  }) => {
    const translateX = React.useRef(new Animated.Value(0)).current;
    const deleteOpacity = React.useRef(new Animated.Value(0)).current;
    const rowId = `${exercise.id}-${setIndex}`;
    const isSwipedOpen = swipedRows.has(rowId);

    // Completely local state for TextInput values - no automatic syncing
    const [localWeight, setLocalWeight] = useState(set.weight?.toString() || '0');
    const [localReps, setLocalReps] = useState(set.reps?.toString() || '0');
    
    // Track the last known external values to detect real changes
    const lastExternalWeight = React.useRef(set.weight);
    const lastExternalReps = React.useRef(set.reps);

    // Only sync when external values actually change (not from our own updates)
    React.useEffect(() => {
      if (set.weight !== lastExternalWeight.current) {
        setLocalWeight(set.weight?.toString() || '0');
        lastExternalWeight.current = set.weight;
      }
    }, [set.weight]);

    React.useEffect(() => {
      if (set.reps !== lastExternalReps.current) {
        setLocalReps(set.reps?.toString() || '0');
        lastExternalReps.current = set.reps;
      }
    }, [set.reps]);

    // Handle syncing local state back to parent on blur
    const handleWeightBlur = React.useCallback(() => {
      const numericWeight = parseFloat(localWeight) || 0;
      lastExternalWeight.current = numericWeight;
      onUpdateSet(exercise.id, set.id, 'weight', numericWeight);
    }, [localWeight, exercise.id, set.id, onUpdateSet]);

    const handleRepsBlur = React.useCallback(() => {
      const numericReps = parseInt(localReps) || 0;
      lastExternalReps.current = numericReps;
      onUpdateSet(exercise.id, set.id, 'reps', numericReps);
    }, [localReps, exercise.id, set.id, onUpdateSet]);

    // Refs for focus management
    const weightInputRef = React.useRef<TextInput>(null);
    const repsInputRef = React.useRef<TextInput>(null);


    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => false, // Don't capture initial touch
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes that are clearly intended for swiping
        // And only if the touch is not on a TextInput area
        const isHorizontalSwipe = Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 15;
        
        if (!isHorizontalSwipe) return false;
        
        // Get the touch position relative to the row
        const { locationX } = evt.nativeEvent;
        
        // Approximate TextInput areas (weight and reps inputs are in the middle portion)
        // Set number is ~25% width, weight input ~25% width, reps input ~25% width, checkbox ~25% width
        const rowWidth = 300; // Approximate row width
        const setNumberEnd = rowWidth * 0.25;
        const weightInputStart = setNumberEnd;
        const weightInputEnd = rowWidth * 0.5;
        const repsInputStart = weightInputEnd;
        const repsInputEnd = rowWidth * 0.75;
        
        // Don't start pan gesture if touch is in TextInput areas
        const isTouchInTextInput = (locationX >= weightInputStart && locationX <= weightInputEnd) ||
                                  (locationX >= repsInputStart && locationX <= repsInputEnd);
        
        return !isTouchInTextInput;
      },
      onPanResponderGrant: () => {
        // Show delete button when swipe starts
        Animated.timing(deleteOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) { // Only allow left swipe
          translateX.setValue(Math.max(gestureState.dx, -80));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -40) {
          // Swipe left - show delete button
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
          }).start();
          setSwipedRows(prev => new Set([...prev, rowId]));
          // Keep delete button visible
          Animated.timing(deleteOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        } else {
          // Snap back and hide delete button
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
      },
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
        
        <Animated.View
          style={[
            styles.setRow,
            { transform: [{ translateX }] }
          ]}
        >
          <View style={styles.setRowContent} {...panResponder.panHandlers}>
            <TouchableWithoutFeedback onPress={handleTap}>
              <View style={styles.setNumberContainer}>
                <Text style={styles.setText}>{setIndex + 1}</Text>
              </View>
            </TouchableWithoutFeedback>
            <TextInput
              ref={weightInputRef}
              style={styles.setInput}
              value={localWeight}
              placeholder="0"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              onChangeText={setLocalWeight}
              onBlur={handleWeightBlur}
              selectTextOnFocus={true}
            />
            <TextInput
              ref={repsInputRef}
              style={styles.setInput}
              value={localReps}
              placeholder="0"
              placeholderTextColor={theme.textMuted}
              keyboardType="numeric"
              onChangeText={setLocalReps}
              onBlur={handleRepsBlur}
              selectTextOnFocus={true}
            />
            <TouchableOpacity
              style={[
                styles.checkboxButton,
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
      </View>
    );
  }, (prevProps, nextProps) => {
    // Only re-render if essential props change - ignore weight/reps changes as they're handled locally
    const shouldNotRerender = (
      prevProps.set.id === nextProps.set.id &&
      prevProps.set.completed === nextProps.set.completed &&
      prevProps.exercise.id === nextProps.exercise.id &&
      prevProps.exercise.name === nextProps.exercise.name &&
      prevProps.setIndex === nextProps.setIndex
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
        <TouchableWithoutFeedback onPress={handleBackgroundPress}>
          <View style={styles.container}>
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
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.content}>
              {/* Current Exercises */}
              {exercises.map(exercise => (
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
                    <SwipeableSetRow
                      key={`${exercise.id}-${set.id}-${index}`}
                      exercise={exercise}
                      set={set}
                      setIndex={index}
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
          </View>
        </TouchableWithoutFeedback>
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
  content: {
    padding: 16,
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
  checkboxButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
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
    fontSize: 14,
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
});