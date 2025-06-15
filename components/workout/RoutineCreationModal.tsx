import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  TouchableWithoutFeedback,
  Animated
} from 'react-native';
import {
  ScrollView,
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import { useTheme } from '../../contexts/ThemeContext';
import { useUnits } from '../../contexts/UnitsContext';
import OptionsBottomSheet from './OptionsBottomSheet';

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: any[];
  notes?: string;
  degree?: number | null;
};

type Folder = {
  id: string;
  name: string;
};

interface RoutineCreationModalProps {
  visible: boolean;
  routineName: string;
  exercises: Exercise[];
  folders: Folder[];
  selectedFolder?: string;
  isEditing: boolean;
  onCancel: () => void;
  onSave: () => void;
  onRoutineNameChange: (name: string) => void;
  onFolderSelect: (folderId?: string) => void;
  onAddExercise: () => void;
  onUpdateExerciseSet: (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => void;
  onAddExerciseSet: (exerciseIndex: number) => void;
  onRemoveExerciseSet: (exerciseIndex: number, setIndex: number) => void;
  onRemoveExercise: (exerciseIndex: number) => void;
  onReplaceExercise: (exerciseIndex: number) => void;
  onReorderExercises: (fromIndex: number, toIndex: number) => void;
  onUpdateExerciseNotes: (exerciseIndex: number, notes: string) => void;
  onUpdateExerciseDegree: (exerciseIndex: number, degree: number) => void;
}

export default function RoutineCreationModal({
  visible,
  routineName,
  exercises,
  folders,
  selectedFolder,
  isEditing,
  onCancel,
  onSave,
  onRoutineNameChange,
  onFolderSelect,
  onAddExercise,
  onUpdateExerciseSet,
  onAddExerciseSet,
  onRemoveExerciseSet,
  onRemoveExercise,
  onReplaceExercise,
  onReorderExercises,
  onUpdateExerciseNotes,
  onUpdateExerciseDegree
}: RoutineCreationModalProps) {
  const { theme } = useTheme();
  const { getWeightLabel } = useUnits();
  const styles = createStyles(theme);
  const [reorderModeExercise, setReorderModeExercise] = useState<number | null>(null);
  const [swipedRows, setSwipedRows] = useState<Set<string>>(new Set());
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [bottomSheetOptions, setBottomSheetOptions] = useState<any[]>([]);
  const [bottomSheetTitle, setBottomSheetTitle] = useState<string | undefined>(undefined);
  const [showDegreeSelector, setShowDegreeSelector] = useState(false);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  
  // Global focus management to handle focus switching between rows
  const globalBlurTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleLongPress = (exerciseIndex: number) => {
    setReorderModeExercise(exerciseIndex);
    setBottomSheetVisible(false); // Close any open bottom sheet
  };

  const moveExercise = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= exercises.length) return;
    
    onReorderExercises(fromIndex, toIndex);
    setReorderModeExercise(toIndex); // Update the reorder mode to follow the moved exercise
  };

  const exitReorderMode = () => {
    setReorderModeExercise(null);
  };

  const handleBackgroundPress = () => {
    setReorderModeExercise(null);
    setBottomSheetVisible(false);
    // Clear all swiped rows
    setSwipedRows(new Set());
  };

  // Cleanup global timeout on unmount
  React.useEffect(() => {
    return () => {
      if (globalBlurTimeoutRef.current) {
        clearTimeout(globalBlurTimeoutRef.current);
      }
    };
  }, []);

  const showExerciseOptions = (exerciseIndex: number, exercise: Exercise) => {
    const options: Array<{text: string; onPress: () => Promise<void>; isDelete?: boolean}> = [
      {
        text: 'Replace Exercise',
        onPress: async () => {
          onReplaceExercise(exerciseIndex);
        }
      },
      {
        text: 'Remove Exercise',
        onPress: async () => {
          onRemoveExercise(exerciseIndex);
        },
        isDelete: true
      }
    ];
    
    setBottomSheetTitle(`${exercise.name} Options`);
    setBottomSheetOptions(options);
    setBottomSheetVisible(true);
  };

  // SwipeableSetRow Component
  const SwipeableSetRow = ({ exerciseIndex, setIndex, set, isLast }: {
    exerciseIndex: number;
    setIndex: number;
    set: any;
    isLast: boolean;
  }) => {
    const translateX = React.useRef(new Animated.Value(0)).current;
    const deleteOpacity = React.useRef(new Animated.Value(0)).current;
    const rowId = `${exerciseIndex}-${setIndex}`;
    const isSwipedOpen = swipedRows.has(rowId);
    
    // Local state for TextInputs to prevent focus loss
    const [localWeight, setLocalWeight] = useState(set.weight?.toString() || '0');
    const [localReps, setLocalReps] = useState(set.reps?.toString() || '0');
    
    
    // Update local state when set data changes (e.g., when editing different routine)
    React.useEffect(() => {
      setLocalWeight(set.weight?.toString() || '0');
      setLocalReps(set.reps?.toString() || '0');
    }, [set.weight, set.reps]);

    // Handle focus events using global focus management
    const handleWeightFocus = React.useCallback(() => {
      if (globalBlurTimeoutRef.current) {
        clearTimeout(globalBlurTimeoutRef.current);
        globalBlurTimeoutRef.current = null;
      }
    }, []);

    const handleRepsFocus = React.useCallback(() => {
      if (globalBlurTimeoutRef.current) {
        clearTimeout(globalBlurTimeoutRef.current);
        globalBlurTimeoutRef.current = null;
      }
    }, []);

    // Handle blur events with global timeout to detect input switching
    const handleWeightBlur = React.useCallback(() => {
      // Store current values for the timeout
      const currentWeight = localWeight;
      
      globalBlurTimeoutRef.current = setTimeout(() => {
        // If we reach here, no other input gained focus - user clicked away
        const weightValue = parseFloat(currentWeight) || 0;
        onUpdateExerciseSet(exerciseIndex, setIndex, 'weight', weightValue);
      }, 100);
    }, [localWeight, exerciseIndex, setIndex, onUpdateExerciseSet]);

    const handleRepsBlur = React.useCallback(() => {
      // Store current values for the timeout
      const currentReps = localReps;
      
      globalBlurTimeoutRef.current = setTimeout(() => {
        // If we reach here, no other input gained focus - user clicked away
        const repsValue = parseInt(currentReps) || 0;
        onUpdateExerciseSet(exerciseIndex, setIndex, 'reps', repsValue);
      }, 100);
    }, [localReps, exerciseIndex, setIndex, onUpdateExerciseSet]);

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
      onRemoveExerciseSet(exerciseIndex, setIndex);
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
      <View style={[styles.swipeableContainer, isLast && styles.lastTableRow]}>
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
              styles.tableRow,
              { transform: [{ translateX }] },
              isLast && styles.lastTableRow
            ]}
          >
            <View style={styles.setRowContent}>
              <Text style={styles.setNumber}>{setIndex + 1}</Text>
              <TextInput
                style={styles.tableInput}
                value={localWeight}
                onChangeText={setLocalWeight}
                onFocus={handleWeightFocus}
                onBlur={handleWeightBlur}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.textMuted}
              />
              <TextInput
                style={styles.tableInput}
                value={localReps}
                onChangeText={setLocalReps}
                onFocus={handleRepsFocus}
                onBlur={handleRepsBlur}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.safeArea}>
        <TouchableWithoutFeedback onPress={handleBackgroundPress}>
          <View style={styles.container}>
            {/* Routine Creation Header */}
            <View style={styles.routineCreationHeader}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.routineCreationTitle}>
              {isEditing ? 'Edit Routine' : 'New Routine'}
            </Text>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={onSave}
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
                onChangeText={onRoutineNameChange}
              />
              
              {/* Folder Selection */}
              <Text style={styles.inputLabel}>Folder</Text>
              <ScrollView 
                horizontal 
                style={styles.folderSelection}
                showsHorizontalScrollIndicator={false}
              >
                {folders.filter(folder => folder.name !== 'Default Routines').map(folder => (
                  <TouchableOpacity
                    key={folder.id}
                    style={[
                      styles.folderOption,
                      selectedFolder === folder.id && styles.selectedFolderOption
                    ]}
                    onPress={() => onFolderSelect(folder.id)}
                  >
                    <Text style={[
                      styles.folderOptionText,
                      selectedFolder === folder.id && styles.selectedFolderOptionText
                    ]}>{folder.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Current Exercises */}
              {exercises.map((exercise, exerciseIndex) => {
                const isInReorderMode = reorderModeExercise === exerciseIndex;
                const isCollapsed = isInReorderMode;
                
                return (
                  <View key={exercise.id} style={[
                    styles.routineExerciseCard,
                    isInReorderMode && styles.reorderModeCard
                  ]}>
                    <View style={styles.exerciseHeader}>
                      <TouchableOpacity
                        style={styles.exerciseNameContainer}
                        onLongPress={() => handleLongPress(exerciseIndex)}
                        delayLongPress={500}
                      >
                        <Text style={[
                          styles.exerciseName,
                          isInReorderMode && styles.reorderModeText
                        ]}>
                          {exercise.name} - {exercise.muscleGroup}
                        </Text>
                        {isInReorderMode && (
                          <Text style={styles.longPressHint}>
                            Reorder Mode - Tap arrows or tap here to finish
                          </Text>
                        )}
                      </TouchableOpacity>
                      
                      {isInReorderMode ? (
                        <View style={styles.reorderControls}>
                          <TouchableOpacity
                            style={[styles.reorderButton, exerciseIndex === 0 && styles.disabledButton]}
                            onPress={() => moveExercise(exerciseIndex, 'up')}
                            disabled={exerciseIndex === 0}
                          >
                            <Text style={[styles.reorderButtonText, exerciseIndex === 0 && styles.disabledButtonText]}>▲</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[styles.reorderButton, exerciseIndex === exercises.length - 1 && styles.disabledButton]}
                            onPress={() => moveExercise(exerciseIndex, 'down')}
                            disabled={exerciseIndex === exercises.length - 1}
                          >
                            <Text style={[styles.reorderButtonText, exerciseIndex === exercises.length - 1 && styles.disabledButtonText]}>▼</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={styles.finishReorderButton}
                            onPress={exitReorderMode}
                          >
                            <Text style={styles.finishReorderButtonText}>Done</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.exerciseOptionsButton}
                          onPress={() => showExerciseOptions(exerciseIndex, exercise)}
                        >
                          <Text style={styles.exerciseOptionsButtonText}>⋯</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  
                  {/* Degree Selector - Hidden when in reorder mode and only shown for exercises with degree */}
                  {!isCollapsed && typeof exercise.degree === 'number' && (
                    <View style={styles.degreeSection}>
                      <Text style={styles.degreeLabel}>Degree</Text>
                      <TouchableOpacity
                        style={styles.degreeSelector}
                        onPress={() => {
                          setSelectedExerciseIndex(exerciseIndex);
                          setShowDegreeSelector(true);
                        }}
                      >
                        <Text style={styles.degreeSelectorText}>{exercise.degree}°</Text>
                        <Text style={styles.degreeSelectorArrow}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Exercise Notes - Hidden when in reorder mode */}
                  {!isCollapsed && (
                    <View style={styles.notesSection}>
                      <Text style={styles.notesLabel}>Notes (optional)</Text>
                      <TextInput
                        style={styles.notesInput}
                        placeholder="Add exercise notes..."
                        placeholderTextColor={theme.textMuted}
                        value={exercise.notes || ''}
                        onChangeText={(notes) => onUpdateExerciseNotes(exerciseIndex, notes)}
                        multiline={true}
                        numberOfLines={1}
                      />
                    </View>
                  )}
                  
                  
                  {/* Exercise Sets Table - Hidden when in reorder mode */}
                  {!isCollapsed && (
                    <View style={styles.setsTableContainer}>
                      {/* Table Header */}
                      <View style={styles.tableHeader}>
                        <Text style={styles.tableHeaderText}>Set</Text>
                        <Text style={styles.tableHeaderText}>{getWeightLabel()}</Text>
                        <Text style={styles.tableHeaderText}>Reps</Text>
                      </View>
                      
                      {/* Table Rows */}
                      {exercise.sets.map((set, setIndex) => (
                        <SwipeableSetRow
                          key={set.id}
                          exerciseIndex={exerciseIndex}
                          setIndex={setIndex}
                          set={set}
                          isLast={setIndex === exercise.sets.length - 1}
                        />
                      ))}
                      
                      {/* Add Set Button */}
                      <TouchableOpacity
                        style={styles.addSetButtonCompact}
                        onPress={() => onAddExerciseSet(exerciseIndex)}
                      >
                        <Text style={styles.addSetButtonText}>+ Add Set</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
              
              {/* Add Exercise Button */}
              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={onAddExercise}
              >
                <Text style={styles.addButtonText}>+ Add Exercise</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          </View>
        </TouchableWithoutFeedback>
        
        <OptionsBottomSheet
          visible={bottomSheetVisible}
          title={bottomSheetTitle}
          options={bottomSheetOptions}
          onClose={() => setBottomSheetVisible(false)}
        />
        
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
                      selectedExerciseIndex !== null && 
                      exercises[selectedExerciseIndex]?.degree === degree && 
                      styles.degreeOptionSelected
                    ]}
                    onPress={() => {
                      if (selectedExerciseIndex !== null) {
                        onUpdateExerciseDegree(selectedExerciseIndex, degree);
                      }
                      setShowDegreeSelector(false);
                    }}
                  >
                    <Text style={[
                      styles.degreeOptionText,
                      selectedExerciseIndex !== null && 
                      exercises[selectedExerciseIndex]?.degree === degree && 
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
  content: {
    padding: 16,
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
  selectedFolderOptionText: {
    color: 'white',
  },
  routineExerciseCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
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
  addButtonText: {
    color: theme.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  setsTableContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.borderLight,
    borderRadius: 6,
    backgroundColor: theme.background,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: theme.surface,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  tableHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: theme.textSecondary,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  lastTableRow: {
    borderBottomWidth: 0,
  },
  setNumber: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    textAlign: 'center',
  },
  tableInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.inputBorder,
    backgroundColor: theme.inputBackground,
    borderRadius: 4,
    padding: 6,
    fontSize: 14,
    color: theme.text,
    textAlign: 'center',
    marginHorizontal: 2,
    minHeight: 32,
  },
  addSetButtonCompact: {
    backgroundColor: theme.surface,
    borderRadius: 0,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    padding: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.borderLight,
  },
  addSetButtonText: {
    color: theme.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseOptionsButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: theme.surface,
  },
  exerciseOptionsButtonText: {
    fontSize: 18,
    color: theme.textSecondary,
    fontWeight: 'bold',
  },
  exerciseNameContainer: {
    flex: 1,
  },
  longPressHint: {
    fontSize: 12,
    color: theme.textMuted,
    fontStyle: 'italic',
    marginTop: 4,
  },
  reorderModeCard: {
    borderColor: theme.primary,
    borderWidth: 2,
    backgroundColor: theme.surface,
  },
  reorderModeText: {
    color: theme.primary,
    fontWeight: 'bold',
  },
  reorderControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reorderButton: {
    backgroundColor: theme.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    alignItems: 'center',
    minWidth: 40,
  },
  disabledButton: {
    backgroundColor: theme.border,
  },
  reorderButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButtonText: {
    color: theme.textMuted,
  },
  finishReorderButton: {
    backgroundColor: theme.success || theme.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  finishReorderButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  notesSection: {
    marginTop: 8,
    marginBottom: 6,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  notesInput: {
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
    backgroundColor: theme.background,
  },
  degreeText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  degreeSection: {
    marginTop: 8,
    marginBottom: 6,
  },
  degreeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  degreeSelector: {
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
  degreeSelectorText: {
    fontSize: 13,
    color: theme.text,
    fontWeight: '600',
  },
  degreeSelectorArrow: {
    fontSize: 12,
    color: theme.textSecondary,
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
});