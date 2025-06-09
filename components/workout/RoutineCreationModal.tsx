import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  SafeAreaView
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: any[];
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
  onAddExercise
}: RoutineCreationModalProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onCancel}
    >
      <SafeAreaView style={styles.safeArea}>
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
                  onPress={() => onFolderSelect(undefined)}
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
                    onPress={() => onFolderSelect(folder.id)}
                  >
                    <Text style={styles.folderOptionText}>{folder.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Current Exercises */}
              {exercises.map(exercise => (
                <View key={exercise.id} style={styles.routineExerciseCard}>
                  <Text style={styles.exerciseName}>
                    {exercise.name} - {exercise.muscleGroup}
                  </Text>
                </View>
              ))}
              
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
});