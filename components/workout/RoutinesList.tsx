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
  isDefault?: boolean;
  isUserOwned?: boolean;
};

type Folder = {
  id: string;
  name: string;
  isDefault?: boolean;
  isUserOwned?: boolean;
};

interface RoutinesListProps {
  routines: Routine[];
  folders: Folder[];
  collapsedFolders: Set<string>;
  onCreateFolder: () => void;
  onStartNewRoutine: () => void;
  onToggleFolderCollapse: (folderId: string) => void;
  onShowFolderOptions: (folder: Folder) => void;
  onShowRoutineOptions: (routine: Routine) => void;
  onStartRoutineFromTemplate: (routine: Routine) => void;
  onEditRoutine: (routine: Routine) => void;
}

export default function RoutinesList({
  routines,
  folders,
  collapsedFolders,
  onCreateFolder,
  onStartNewRoutine,
  onToggleFolderCollapse,
  onShowFolderOptions,
  onShowRoutineOptions,
  onStartRoutineFromTemplate,
  onEditRoutine
}: RoutinesListProps) {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Helper function to check if a folder is a default folder
  const isDefaultFolder = (folder: Folder) => {
    return folder.isDefault === true;
  };

  // Helper function to check if a routine is a default routine
  const isDefaultRoutine = (routine: Routine) => {
    return routine.isDefault === true;
  };

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
        const isDefault = isDefaultFolder(folder);
        
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
                <View style={styles.folderNameContainer}>
                  <Text style={styles.folderName}>{folder.name}</Text>
                  {isDefault && (
                    <Text style={styles.defaultLabel}>Default</Text>
                  )}
                </View>
              </TouchableOpacity>
              
              {/* Only show hamburger button for non-default folders */}
              {!isDefault && (
                <TouchableOpacity
                  style={styles.optionsButton}
                  onPress={() => onShowFolderOptions(folder)}
                >
                  <Text style={styles.optionsButtonText}>⋯</Text>
                </TouchableOpacity>
              )}
            </View>
            
            
            {/* Folder Contents */}
            {!isCollapsed && folderRoutines.map(routine => (
              <View key={routine.id} style={styles.routineItem}>
                <TouchableOpacity
                  style={styles.routineMainContent}
                  onPress={() => onEditRoutine(routine)}
                >
                  <View style={styles.routineNameContainer}>
                    <Text style={styles.routineName}>{routine.name}</Text>
                    {isDefaultRoutine(routine) && (
                      <Text style={styles.defaultLabel}>Default</Text>
                    )}
                  </View>
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
                  
                  {/* Only show hamburger button for user-owned routines */}
                  {!isDefaultRoutine(routine) && (
                    <TouchableOpacity
                      style={styles.routineOptionsButton}
                      onPress={() => onShowRoutineOptions(routine)}
                    >
                      <Text style={styles.optionsButtonText}>⋯</Text>
                    </TouchableOpacity>
                  )}
                </View>
                
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
              <View style={styles.routineNameContainer}>
                <Text style={styles.routineName}>{routine.name}</Text>
                {isDefaultRoutine(routine) && (
                  <Text style={styles.defaultLabel}>Default</Text>
                )}
              </View>
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
              
              {/* Only show hamburger button for non-default routines */}
              {!isDefaultRoutine(routine) && (
                <TouchableOpacity
                  style={styles.routineOptionsButton}
                  onPress={() => onShowRoutineOptions(routine)}
                >
                  <Text style={styles.optionsButtonText}>⋯</Text>
                </TouchableOpacity>
              )}
            </View>
            
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
  folderNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routineNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultLabel: {
    backgroundColor: theme.border,
    color: theme.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
    textTransform: 'uppercase',
  },
});