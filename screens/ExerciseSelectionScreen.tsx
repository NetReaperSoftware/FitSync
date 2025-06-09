import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
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

  const styles = createStyles(theme);

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
      
      {/* Future sorting/filter buttons will go here */}
      <View style={styles.filterSection}>
        <Text style={styles.filterPlaceholder}>
          {exercises.length} exercises available
        </Text>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExercise}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={true}
      />
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
    filterSection: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.inputBorder,
    },
    filterPlaceholder: {
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
  });