import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';
// @ts-ignore
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

export default function HomeScreen(): React.JSX.Element {
  // Mock data - would be replaced with actual data from a backend/state management
  const [nutritionData, setNutritionData] = useState({
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#333',
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#333',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#444',
  },
  progressContainer: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
  carbsBar: {
    backgroundColor: '#4285F4', // Blue
  },
  proteinBar: {
    backgroundColor: '#EA4335', // Red
  },
  fatBar: {
    backgroundColor: '#FBBC05', // Yellow/Orange
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
    color: '#555',
  },
});
