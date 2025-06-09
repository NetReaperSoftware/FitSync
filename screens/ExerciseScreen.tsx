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

type Exercise = {
  id: string;
  name: string;
  category: string;
  muscle_group_primary: string;
  muscle_group_secondary: string;
  equipment: string;
  degree?: number;
};

export default function ExercisesScreen() {
  const { theme } = useTheme();
  const [exercises, setExercises] = useState<Exercise[]>([]);
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
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
    } else {
      setExercises(data as Exercise[]);
      console.log('Successfully fetched exercises:', data?.length || 0);
    }

    setLoading(false);
  };

  const styles = createStyles(theme);

  const renderExercise = ({ item }: { item: Exercise }) => (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.details}>
        {item.category} • {item.equipment}
      </Text>
      <Text style={styles.muscles}>
        Primary: {item.muscle_group_primary}
        {'\n'}
        Secondary: {item.muscle_group_secondary}
        {item.degree ? `\nDegree: ${item.degree}°` : ''}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExercise}
        contentContainerStyle={styles.list}
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
    list: {
      padding: 16,
    },
    card: {
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
    name: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 4,
    },
    details: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    muscles: {
      fontSize: 13,
      marginTop: 6,
      color: theme.text,
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
