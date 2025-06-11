import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  sets: any[];
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

interface RoutinesListProps {
  routines: Routine[];
  folders: Folder[];
  collapsedFolders: Set<string>;
  folderOptionsVisible: string | null;
  routineOptionsVisible: string | null;
  onCreateFolder: () => void;
  onStartNewRoutine: () => void;
  onToggleFolderCollapse: (folderId: string) => void;
  onSetFolderOptionsVisible: (folderId: string | null) => void;
  onSetRoutineOptionsVisible: (routineId: string | null) => void;
  onStartRenamingFolder: (folderId: string, currentName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onStartRoutineFromTemplate: (routine: Routine) => void;
  onEditRoutine: (routine: Routine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onStartNewRoutineInFolder: (folderId: string) => void;
  onRenameRoutine: (routineId: string, currentName: string) => void;
}

export default function RoutinesList({
  routines,
  folders,
  collapsedFolders,
  folderOptionsVisible,
  routineOptionsVisible,
  onCreateFolder,
  onStartNewRoutine,
  onToggleFolderCollapse,
  onSetFolderOptionsVisible,
  onSetRoutineOptionsVisible,
  onStartRenamingFolder,
  onDeleteFolder,
  onStartRoutineFromTemplate,
  onEditRoutine,
  onDeleteRoutine,
  onStartNewRoutineInFolder,
  onRenameRoutine
}: RoutinesListProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.routinesSection}>
      <View style={styles.routinesSectionHeader}>
        <Text style={styles.sectionTitle}>Routines</Text>
        <TouchableOpacity 
          style={styles.createFolderButton}
          onPress={onCreateFolder}
        >
          <Text style={styles.createFolderButtonText}>+ Folder</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.newRoutineButton}
        onPress={onStartNewRoutine}
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
                onPress={() => onToggleFolderCollapse(folder.id)}
              >
                <Text style={styles.folderToggleIcon}>
                  {isCollapsed ? '▶' : '▼'}
                </Text>
                <Text style={styles.folderName}>{folder.name}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.optionsButton}
                onPress={() => onSetFolderOptionsVisible(
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
                  onPress={() => onStartRenamingFolder(folder.id, folder.name)}
                >
                  <Text style={styles.optionText}>Rename Folder</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => onDeleteFolder(folder.id)}
                >
                  <Text style={[styles.optionText, styles.deleteOptionText]}>Delete Folder</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => onStartNewRoutineInFolder(folder.id)}
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
                  onPress={() => onEditRoutine(routine)}
                >
                  <Text style={styles.routineName}>{routine.name}</Text>
                  <Text style={styles.routineExerciseCount}>
                    {routine.exercises.length} exercises
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.routineActions}>
                  <TouchableOpacity
                    style={styles.startRoutineButton}
                    onPress={() => onStartRoutineFromTemplate(routine)}
                  >
                    <Text style={styles.startRoutineButtonText}>Start Routine</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.routineOptionsButton}
                    onPress={() => onSetRoutineOptionsVisible(
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
                      onPress={() => onEditRoutine(routine)}
                    >
                      <Text style={styles.optionText}>Edit Routine</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.optionItem}
                      onPress={() => onRenameRoutine(routine.id, routine.name)}
                    >
                      <Text style={styles.optionText}>Rename Routine</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.optionItem}
                      onPress={() => onDeleteRoutine(routine.id)}
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
              onPress={() => onEditRoutine(routine)}
            >
              <Text style={styles.routineName}>{routine.name}</Text>
              <Text style={styles.routineExerciseCount}>
                {routine.exercises.length} exercises
              </Text>
            </TouchableOpacity>
            
            <View style={styles.routineActions}>
              <TouchableOpacity
                style={styles.startRoutineButton}
                onPress={() => onStartRoutineFromTemplate(routine)}
              >
                <Text style={styles.startRoutineButtonText}>Start Routine</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.routineOptionsButton}
                onPress={() => onSetRoutineOptionsVisible(
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
                  onPress={() => onEditRoutine(routine)}
                >
                  <Text style={styles.optionText}>Edit Routine</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => onRenameRoutine(routine.id, routine.name)}
                >
                  <Text style={styles.optionText}>Rename Routine</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => onDeleteRoutine(routine.id)}
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
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  routinesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 12,
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
  folderContainer: {
    marginBottom: 16,
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  folderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  folderToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  folderToggleIcon: {
    fontSize: 16,
    color: theme.textSecondary,
    marginRight: 8,
  },
  folderName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  optionsButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: theme.cardBackground,
  },
  optionsButtonText: {
    fontSize: 18,
    color: theme.textSecondary,
    fontWeight: 'bold',
  },
  optionsMenu: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.borderLight,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  optionItem: {
    padding: 12,
    borderRadius: 4,
  },
  optionText: {
    fontSize: 16,
    color: theme.text,
    fontWeight: '500',
  },
  deleteOptionText: {
    color: theme.error,
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
  routineMainContent: {
    flex: 1,
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
  routineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  startRoutineButton: {
    backgroundColor: theme.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  startRoutineButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  routineOptionsButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: theme.cardBackground,
  },
  routineOptionsMenu: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.borderLight,
    position: 'absolute',
    right: 0,
    top: 40,
    zIndex: 1000,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  standaloneRoutineItem: {
    backgroundColor: theme.background,
    borderRadius: 6,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
});