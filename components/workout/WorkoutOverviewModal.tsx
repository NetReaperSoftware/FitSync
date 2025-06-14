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
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useUnits } from '../../contexts/UnitsContext';

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: {
    id: string;
    weight: number;
    reps: number;
    completed: boolean;
  }[];
};

interface WorkoutOverviewModalProps {
  visible: boolean;
  workoutName: string;
  exercises: Exercise[];
  workoutStartTime: Date | null;
  workoutEndTime: Date | null;
  totalPausedDuration: number;
  initialNotes?: string;
  onSave: (notes: string) => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export default function WorkoutOverviewModal({
  visible,
  workoutName,
  exercises,
  workoutStartTime,
  workoutEndTime,
  totalPausedDuration,
  initialNotes = '',
  onSave,
  onDiscard,
  onCancel
}: WorkoutOverviewModalProps) {
  const { theme } = useTheme();
  const { getVolumeLabel } = useUnits();
  const styles = createStyles(theme);
  const [notes, setNotes] = useState(initialNotes);

  // Calculate workout stats
  const getWorkoutStats = () => {
    const completedSets = exercises.reduce((total, exercise) => 
      total + exercise.sets.filter(set => set.completed).length, 0
    );
    const totalVolume = exercises.reduce((total, exercise) => 
      total + exercise.sets
        .filter(set => set.completed)
        .reduce((setTotal, set) => setTotal + (set.weight * set.reps), 0), 0
    );
    
    // Calculate duration excluding paused time
    const durationInMs = workoutStartTime && workoutEndTime ? 
      workoutEndTime.getTime() - workoutStartTime.getTime() - totalPausedDuration : 0;
    const durationInSeconds = Math.floor(durationInMs / 1000);
    
    return { completedSets, totalVolume, durationInSeconds };
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (seconds >= 3600) { // 1 hour or more
      return `${hours}h ${minutes}m`;
    } else if (seconds >= 60) { // 1 minute or more
      return `${minutes}m`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const stats = getWorkoutStats();

  const handleSave = () => {
    onSave(notes);
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onCancel}
      supportedOrientations={['portrait']}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Workout Complete</Text>
            
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.content}>
              {/* Workout Name */}
              <Text style={styles.workoutName}>{workoutName}</Text>
              
              {/* Date */}
              <Text style={styles.workoutDate}>{formatDate(workoutStartTime)}</Text>
              
              {/* Stats Cards */}
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{formatDuration(stats.durationInSeconds)}</Text>
                  <Text style={styles.statLabel}>Duration</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.totalVolume}</Text>
                  <Text style={styles.statLabel}>{getVolumeLabel()}</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{stats.completedSets}</Text>
                  <Text style={styles.statLabel}>Sets</Text>
                </View>
              </View>
              
              {/* Exercise Summary */}
              <View style={styles.exerciseSummaryContainer}>
                <Text style={styles.sectionTitle}>Exercises ({exercises.length})</Text>
                {exercises.map(exercise => {
                  const completedSets = exercise.sets.filter(set => set.completed).length;
                  const totalSets = exercise.sets.length;
                  
                  return (
                    <View key={exercise.id} style={styles.exerciseItem}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <Text style={styles.exerciseStats}>
                        {completedSets}/{totalSets} sets • {exercise.muscleGroup}
                      </Text>
                    </View>
                  );
                })}
              </View>
              
              {/* Notes Section */}
              <View style={styles.notesContainer}>
                <Text style={styles.sectionTitle}>Workout Notes</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="How did the workout feel? Any observations or goals for next time..."
                  placeholderTextColor={theme.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              
              {/* Discard Button */}
              <TouchableOpacity
                style={styles.discardButton}
                onPress={onDiscard}
              >
                <Text style={styles.discardButtonText}>Discard Workout</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: theme.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  workoutName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  workoutDate: {
    fontSize: 16,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  exerciseSummaryContainer: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 16,
  },
  exerciseItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 2,
  },
  exerciseStats: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  notesContainer: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: theme.inputBorder,
    backgroundColor: theme.inputBackground,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.text,
    minHeight: 100,
    textAlignVertical: 'top',
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
});