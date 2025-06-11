import React, { useState } from 'react';
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
  TouchableWithoutFeedback
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

  const getWorkoutStats = () => {
    const totalSets = exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
    const totalVolume = exercises.reduce((total, exercise) => 
      total + exercise.sets.reduce((setTotal, set) => setTotal + (set.weight * set.reps), 0), 0
    );
    const duration = workoutStartTime ? Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 60000) : 0;
    
    return { totalSets, totalVolume, duration };
  };

  const stats = getWorkoutStats();

  const handleBackgroundPress = () => {
    // Clear all swiped rows
    setSwipedRows(new Set());
  };

  // SwipeableSetRow Component for Active Workout
  const SwipeableSetRow = ({ exercise, set, setIndex }: {
    exercise: Exercise;
    set: ExerciseSet;
    setIndex: number;
  }) => {
    const translateX = React.useRef(new Animated.Value(0)).current;
    const deleteOpacity = React.useRef(new Animated.Value(0)).current;
    const rowId = `${exercise.id}-${setIndex}`;
    const isSwipedOpen = swipedRows.has(rowId);
    const [isSwiping, setIsSwiping] = useState(false);

    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        setIsSwiping(true);
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
        setIsSwiping(false);
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
          {...panResponder.panHandlers}
        >
          <TouchableWithoutFeedback onPress={handleTap}>
            <View style={styles.setRowContent}>
              <Text style={styles.setText}>{setIndex + 1}</Text>
              <TextInput
                style={styles.setInput}
                value={set.weight.toString()}
                placeholder="0"
                keyboardType="numeric"
                onChangeText={(text) => onUpdateSet(exercise.id, set.id, 'weight', parseFloat(text) || 0)}
              />
              <TextInput
                style={styles.setInput}
                value={set.reps.toString()}
                placeholder="0"
                keyboardType="numeric"
                onChangeText={(text) => onUpdateSet(exercise.id, set.id, 'reps', parseInt(text) || 0)}
              />
              <TouchableOpacity
                style={[
                  styles.completionButton,
                  set.completed ? styles.completedButton : styles.pendingButton,
                ]}
                onPress={() => onToggleSetCompletion(exercise.id, set.id)}
              >
                <Text style={styles.completionButtonText}>
                  {set.completed ? '✓' : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onMinimize}
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
                      key={set.id}
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
});