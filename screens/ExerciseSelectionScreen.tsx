import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../supabaseClient';

type DatabaseExercise = {
  id: string;
  name: string;
  category: string;
  muscle_group_primary: string;
  muscle_group_secondary: string;
  equipment: string;
  degree?: number;
};

interface ExerciseSelectionScreenProps {
  onSelectExercise: (exercise: DatabaseExercise) => void;
  onCancel: () => void;
}

export default function ExerciseSelectionScreen({
  onSelectExercise,
  onCancel,
}: ExerciseSelectionScreenProps) {
  const { theme } = useTheme();
  const [exercises, setExercises] = useState<DatabaseExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('All Equipment');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All Muscles');
  const [equipmentModalVisible, setEquipmentModalVisible] = useState(false);
  const [muscleModalVisible, setMuscleModalVisible] = useState(false);

  const equipmentOptions = ['All Equipment', 'None', 'Barbell', 'Dumbbell', 'Machine', 'Other'];
  
  // Get unique muscle groups from exercises
  const muscleGroupOptions = useMemo((): string[] => {
    const uniqueMuscles = new Set<string>();
    
    exercises.forEach(exercise => {
      // Split primary muscle group by comma and add each individual muscle
      if (exercise.muscle_group_primary) {
        exercise.muscle_group_primary.split(',').forEach(muscle => {
          const trimmedMuscle = muscle.trim();
          if (trimmedMuscle) {
            uniqueMuscles.add(trimmedMuscle);
          }
        });
      }
      
      // Split secondary muscle group by comma and add each individual muscle
      if (exercise.muscle_group_secondary) {
        exercise.muscle_group_secondary.split(',').forEach(muscle => {
          const trimmedMuscle = muscle.trim();
          if (trimmedMuscle) {
            uniqueMuscles.add(trimmedMuscle);
          }
        });
      }
    });
    
    // Sort alphabetically, then prepend "All Muscles" at the top
    const sortedMuscles = Array.from(uniqueMuscles).sort();
    return ['All Muscles', ...sortedMuscles];
  }, [exercises]);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    const { data, error } = await supabase
      .schema('fitness')
      .from('exercises')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching exercises:', error);
    } else {
      setExercises(data as DatabaseExercise[]);
    }

    setLoading(false);
  };

  // Filter exercises based on search and filters
  const filteredExercises = useMemo(() => {
    return exercises.filter(exercise => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscle_group_primary.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Equipment filter
      const matchesEquipment = selectedEquipment === 'All Equipment' || 
        exercise.equipment.toLowerCase() === selectedEquipment.toLowerCase();
      
      // Muscle group filter - check if selected muscle is included in either primary or secondary
      const matchesMuscleGroup = selectedMuscleGroup === 'All Muscles' ||
        (exercise.muscle_group_primary && exercise.muscle_group_primary.includes(selectedMuscleGroup)) ||
        (exercise.muscle_group_secondary && exercise.muscle_group_secondary.includes(selectedMuscleGroup));
      
      return matchesSearch && matchesEquipment && matchesMuscleGroup;
    });
  }, [exercises, searchQuery, selectedEquipment, selectedMuscleGroup]);

  const styles = createStyles(theme);

  const renderDropdownModal = (
    visible: boolean,
    options: string[],
    selectedValue: string,
    onSelect: (value: string) => void,
    onClose: () => void,
    title: string
  ) => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <FlatList
            data={options}
            keyExtractor={(item) => item}
            style={styles.modalList}
            showsVerticalScrollIndicator={true}
            renderItem={({ item }) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.modalOption,
                  selectedValue === item && styles.modalOptionSelected
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <Text 
                  style={[
                    styles.modalOptionText,
                    selectedValue === item && styles.modalOptionTextSelected
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity style={styles.modalCancel} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderExercise = ({ item }: { item: DatabaseExercise }) => (
    <TouchableOpacity 
      style={styles.exerciseCard}
      onPress={() => onSelectExercise(item)}
    >
      <Text style={styles.exerciseName}>{item.name}</Text>
      <Text style={styles.exerciseDetails}>
        {item.category} • {item.equipment}
      </Text>
      <Text style={styles.exerciseMuscles}>
        Primary: {item.muscle_group_primary}
        {item.muscle_group_secondary && (
          <>
            {'\n'}Secondary: {item.muscle_group_secondary}
          </>
        )}
        {item.degree && `\nDegree: ${item.degree}°`}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Exercise</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Exercise</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={theme.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setEquipmentModalVisible(true)}
        >
          <Text style={styles.filterButtonText}>{selectedEquipment}</Text>
          <Text style={styles.filterArrow}>▼</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setMuscleModalVisible(true)}
        >
          <Text style={styles.filterButtonText}>{selectedMuscleGroup}</Text>
          <Text style={styles.filterArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExercise}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={true}
      />

      {/* Dropdown Modals */}
      {renderDropdownModal(
        equipmentModalVisible,
        equipmentOptions,
        selectedEquipment,
        setSelectedEquipment,
        () => setEquipmentModalVisible(false),
        'Select Equipment'
      )}

      {renderDropdownModal(
        muscleModalVisible,
        muscleGroupOptions,
        selectedMuscleGroup,
        setSelectedMuscleGroup,
        () => setMuscleModalVisible(false),
        'Select Muscle Group'
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.inputBorder,
    },
    cancelButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.border,
      borderRadius: 8,
    },
    cancelButtonText: {
      color: theme.textSecondary,
      fontWeight: '600',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    headerSpacer: {
      width: 60, // Same width as cancel button to center title
    },
    searchContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
    },
    searchInput: {
      backgroundColor: theme.inputBackground,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.text,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 12,
    },
    filterButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.inputBackground,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    filterButtonText: {
      fontSize: 14,
      color: theme.text,
      flex: 1,
    },
    filterArrow: {
      fontSize: 12,
      color: theme.textSecondary,
      marginLeft: 8,
    },
    resultsContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    resultsText: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    list: {
      padding: 16,
    },
    exerciseCard: {
      backgroundColor: theme.cardBackground || theme.inputBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderWidth: 1,
      borderColor: theme.inputBorder,
    },
    exerciseName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    exerciseDetails: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 6,
    },
    exerciseMuscles: {
      fontSize: 13,
      color: theme.text,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 20,
      width: '80%',
      maxHeight: '70%',
      borderWidth: 1,
      borderColor: theme.borderLight,
      flexDirection: 'column',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 16,
      flexShrink: 0,
    },
    modalList: {
      flexGrow: 1,
      flexShrink: 1,
    },
    modalOption: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 4,
    },
    modalOptionSelected: {
      backgroundColor: theme.primary,
    },
    modalOptionText: {
      fontSize: 16,
      color: theme.text,
      flexShrink: 1,
    },
    modalOptionTextSelected: {
      color: 'white',
      fontWeight: '600',
    },
    modalCancel: {
      backgroundColor: theme.border,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginTop: 12,
      alignItems: 'center',
      flexShrink: 0,
    },
    modalCancelText: {
      color: theme.textSecondary,
      fontWeight: '600',
    },
  });