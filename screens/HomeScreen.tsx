import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function HomeScreen(): React.JSX.Element {
  const { theme } = useTheme();
  
  // Mock data - would be replaced with actual data from a backend/state management
  const [nutritionData] = useState({
    calories: {
      consumed: 1450,
      goal: 2000
    },
    macros: {
      carbs: {
        consumed: 120,
        goal: 200,
        unit: 'g'
      },
      protein: {
        consumed: 75,
        goal: 120,
        unit: 'g'
      },
      fat: {
        consumed: 45,
        goal: 65,
        unit: 'g'
      }
    }
  });

  const styles = createStyles(theme);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.header}>Daily Overview</Text>
        
        {/* Calories Section */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Calories</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${(nutritionData.calories.consumed / nutritionData.calories.goal) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {nutritionData.calories.consumed} / {nutritionData.calories.goal} kcal
          </Text>
        </View>
        
        {/* Macros Section */}
        <Text style={styles.sectionHeader}>Macronutrients</Text>
        
        {/* Carbs */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Carbohydrates</Text>
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                styles.carbsBar,
                { width: `${(nutritionData.macros.carbs.consumed / nutritionData.macros.carbs.goal) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {nutritionData.macros.carbs.consumed} / {nutritionData.macros.carbs.goal} {nutritionData.macros.carbs.unit}
          </Text>
        </View>
        
        {/* Protein */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Protein</Text>
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                styles.proteinBar,
                { width: `${(nutritionData.macros.protein.consumed / nutritionData.macros.protein.goal) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {nutritionData.macros.protein.consumed} / {nutritionData.macros.protein.goal} {nutritionData.macros.protein.unit}
          </Text>
        </View>
        
        {/* Fat */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fat</Text>
          <View style={styles.progressContainer}>
            <View 
              style={[
                styles.progressBar, 
                styles.fatBar,
                { width: `${(nutritionData.macros.fat.consumed / nutritionData.macros.fat.goal) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {nutritionData.macros.fat.consumed} / {nutritionData.macros.fat.goal} {nutritionData.macros.fat.unit}
          </Text>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 16,
    color: theme.text,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: theme.text,
  },
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
    elevation: 3,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: theme.text,
  },
  progressContainer: {
    height: 14,
    backgroundColor: theme.border,
    borderRadius: 7,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.success,
    borderRadius: 7,
  },
  carbsBar: {
    backgroundColor: theme.primary,
  },
  proteinBar: {
    backgroundColor: '#EA4335',
  },
  fatBar: {
    backgroundColor: theme.warning,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
    color: theme.textSecondary,
  },
});
