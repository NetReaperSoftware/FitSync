import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

export default function HomeScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('Last 30 days');
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Mock data - would be replaced with actual data from a backend/state management
  const [userData] = useState({
    goal: 'deficit', // 'surplus', 'deficit', 'maintenance'
    calories: {
      consumed: 1450,
      burned: 320,
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
    },
    activity: {
      steps: 8245,
      stepGoal: 10000
    },
    workouts: [
      {
        name: 'Upper Body Strength',
        duration: 45,
        musclesWorked: ['Chest', 'Shoulders', 'Triceps']
      }
    ]
  });

  const netCalories = userData.calories.consumed - userData.calories.burned;
  const calorieGoalText = userData.goal === 'deficit' ? 'Caloric Deficit' : 
                         userData.goal === 'surplus' ? 'Caloric Surplus' : 'Caloric Maintenance';
  const caloriesRemaining = userData.calories.goal - netCalories;

  const styles = createStyles(theme);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.headerContainer}>
            <Text style={styles.header}>Daily Overview</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity 
                style={styles.detailedReportButton}
                onPress={() => setShowDetailedReport(true)}
              >
                <Text style={styles.detailedReportButtonText}>Detailed Report</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => setShowProfileModal(true)}
              >
                <Ionicons name="person-circle" size={32} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
        
        {/* Goal Description Header */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{calorieGoalText}</Text>
          <Text style={styles.goalDescription}>
            Goal: {userData.calories.goal} kcal | Net: {netCalories} kcal
          </Text>
          <Text style={[styles.calorieStatus, caloriesRemaining > 0 ? styles.caloriesLeft : styles.caloriesOver]}>
            {caloriesRemaining > 0 
              ? `${caloriesRemaining} calories left to consume` 
              : `${Math.abs(caloriesRemaining)} calories to burn`}
          </Text>
        </View>
        
        {/* Macronutrient Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Macronutrients</Text>
          
          <View style={styles.macroRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <View style={styles.progressContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    styles.carbsBar,
                    { width: `${(userData.macros.carbs.consumed / userData.macros.carbs.goal) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.macroText}>
                {userData.macros.carbs.consumed}g / {userData.macros.carbs.goal}g
              </Text>
              <Text style={styles.macroRemaining}>
                {userData.macros.carbs.goal - userData.macros.carbs.consumed}g left
              </Text>
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Protein</Text>
              <View style={styles.progressContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    styles.proteinBar,
                    { width: `${(userData.macros.protein.consumed / userData.macros.protein.goal) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.macroText}>
                {userData.macros.protein.consumed}g / {userData.macros.protein.goal}g
              </Text>
              <Text style={styles.macroRemaining}>
                {userData.macros.protein.goal - userData.macros.protein.consumed}g left
              </Text>
            </View>

            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Fat</Text>
              <View style={styles.progressContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    styles.fatBar,
                    { width: `${(userData.macros.fat.consumed / userData.macros.fat.goal) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.macroText}>
                {userData.macros.fat.consumed}g / {userData.macros.fat.goal}g
              </Text>
              <Text style={styles.macroRemaining}>
                {userData.macros.fat.goal - userData.macros.fat.consumed}g left
              </Text>
            </View>
          </View>
        </View>

        {/* Activity Mini Boxes */}
        <View style={styles.miniBoxContainer}>
          <View style={styles.miniBox}>
            <Text style={styles.miniBoxTitle}>Steps</Text>
            <Text style={styles.miniBoxValue}>{userData.activity.steps.toLocaleString()}</Text>
            <Text style={styles.miniBoxSubtext}>of {userData.activity.stepGoal.toLocaleString()}</Text>
          </View>
          
          <View style={styles.miniBox}>
            <Text style={styles.miniBoxTitle}>Calories Burned</Text>
            <Text style={styles.miniBoxValue}>{userData.calories.burned}</Text>
            <Text style={styles.miniBoxSubtext}>kcal</Text>
          </View>
        </View>

        {/* Workout Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Workouts</Text>
          {userData.workouts.length > 0 ? (
            userData.workouts.map((workout, index) => (
              <View key={index} style={styles.workoutItem}>
                <Text style={styles.workoutName}>{workout.name}</Text>
                <Text style={styles.workoutDuration}>{workout.duration} minutes</Text>
                <Text style={styles.musclesWorked}>
                  Muscles: {workout.musclesWorked.join(', ')}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noWorkouts}>No workouts logged today</Text>
          )}
        </View>
      </View>
    </ScrollView>

    {/* Detailed Report Modal */}
    <Modal
      visible={showDetailedReport}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Detailed Report</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowDetailedReport(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.timePeriodSelector}>
          {['Last 7 days', 'Last 30 days', 'Last 90 days', 'All Time'].map((period) => (
            <TouchableOpacity
              key={period}
              style={[
                styles.timePeriodButton,
                selectedTimePeriod === period && styles.timePeriodButtonActive
              ]}
              onPress={() => setSelectedTimePeriod(period)}
            >
              <Text style={[
                styles.timePeriodButtonText,
                selectedTimePeriod === period && styles.timePeriodButtonTextActive
              ]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.reportContent}>
          {/* Weight Graph */}
          <View style={styles.reportCard}>
            <Text style={styles.reportCardTitle}>Weight Over Time</Text>
            <View style={styles.graphPlaceholder}>
              <Text style={styles.graphPlaceholderText}>📊 Weight Line Graph</Text>
              <Text style={styles.graphSubtext}>Current: 75kg | Goal: 70kg</Text>
            </View>
          </View>

          {/* Daily Steps Graph */}
          <View style={styles.reportCard}>
            <Text style={styles.reportCardTitle}>Daily Steps</Text>
            <View style={styles.graphPlaceholder}>
              <Text style={styles.graphPlaceholderText}>📊 Daily Steps Bar Graph</Text>
              <Text style={styles.graphSubtext}>Average: 8,245 steps/day</Text>
            </View>
          </View>

          {/* Exercise Duration Graph */}
          <View style={styles.reportCard}>
            <Text style={styles.reportCardTitle}>Daily Exercise Duration</Text>
            <View style={styles.graphPlaceholder}>
              <Text style={styles.graphPlaceholderText}>📊 Exercise Duration Bar Graph</Text>
              <Text style={styles.graphSubtext}>Average: 35 minutes/day</Text>
            </View>
          </View>

          {/* Caloric Goal vs Net Graph */}
          <View style={styles.reportCard}>
            <Text style={styles.reportCardTitle}>Caloric Goal vs Daily Net</Text>
            <View style={styles.graphPlaceholder}>
              <Text style={styles.graphPlaceholderText}>📊 Caloric Intake Line Graph</Text>
              <Text style={styles.graphSubtext}>Goal: 2000 kcal | Avg Net: 1850 kcal</Text>
            </View>
          </View>

          {/* Muscle Distribution Chart */}
          <View style={styles.reportCard}>
            <Text style={styles.reportCardTitle}>Muscle Group Distribution</Text>
            <View style={styles.graphPlaceholder}>
              <Text style={styles.graphPlaceholderText}>📊 Muscle Distribution Chart</Text>
              <View style={styles.muscleStats}>
                <Text style={styles.muscleStatItem}>🔥 Chest: 25%</Text>
                <Text style={styles.muscleStatItem}>💪 Arms: 20%</Text>
                <Text style={styles.muscleStatItem}>🦵 Legs: 30%</Text>
                <Text style={styles.muscleStatItem}>🏃 Back: 15%</Text>
                <Text style={styles.muscleStatItem}>⚡ Core: 10%</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>

    {/* Profile Modal */}
    <Modal
      visible={showProfileModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowProfileModal(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.profileContent}>
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              <Ionicons name="person-circle" size={80} color={theme.primary} />
            </View>
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profileEmail}>john.doe@example.com</Text>
          </View>

          <View style={styles.profileCard}>
            <Text style={styles.profileCardTitle}>Personal Information</Text>
            <View style={styles.profileInfoRow}>
              <Text style={styles.profileInfoLabel}>Age:</Text>
              <Text style={styles.profileInfoValue}>28 years</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Text style={styles.profileInfoLabel}>Height:</Text>
              <Text style={styles.profileInfoValue}>175 cm</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Text style={styles.profileInfoLabel}>Weight:</Text>
              <Text style={styles.profileInfoValue}>75 kg</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Text style={styles.profileInfoLabel}>Goal:</Text>
              <Text style={styles.profileInfoValue}>Weight Loss</Text>
            </View>
          </View>

          <View style={styles.profileCard}>
            <Text style={styles.profileCardTitle}>Fitness Goals</Text>
            <View style={styles.profileInfoRow}>
              <Text style={styles.profileInfoLabel}>Daily Calories:</Text>
              <Text style={styles.profileInfoValue}>2000 kcal</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Text style={styles.profileInfoLabel}>Daily Steps:</Text>
              <Text style={styles.profileInfoValue}>10,000 steps</Text>
            </View>
            <View style={styles.profileInfoRow}>
              <Text style={styles.profileInfoLabel}>Weekly Workouts:</Text>
              <Text style={styles.profileInfoValue}>5 sessions</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  goalDescription: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  calorieStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  caloriesLeft: {
    color: theme.success,
  },
  caloriesOver: {
    color: theme.error,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  macroText: {
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 2,
  },
  macroRemaining: {
    fontSize: 11,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  miniBoxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  miniBox: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    flex: 0.48,
    alignItems: 'center',
    elevation: 3,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  miniBoxTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 8,
  },
  miniBoxValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 4,
  },
  miniBoxSubtext: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  workoutItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 4,
  },
  workoutDuration: {
    fontSize: 14,
    color: theme.textSecondary,
    marginBottom: 4,
  },
  musclesWorked: {
    fontSize: 12,
    color: theme.textSecondary,
    fontStyle: 'italic',
  },
  noWorkouts: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButton: {
    padding: 4,
  },
  detailedReportButton: {
    backgroundColor: theme.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  detailedReportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: theme.textSecondary,
  },
  timePeriodSelector: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  timePeriodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  timePeriodButtonActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  timePeriodButtonText: {
    fontSize: 12,
    color: theme.text,
    fontWeight: '500',
  },
  timePeriodButtonTextActive: {
    color: 'white',
  },
  reportContent: {
    flex: 1,
    padding: 16,
  },
  reportCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  reportCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  graphPlaceholder: {
    height: 200,
    backgroundColor: theme.border,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  graphPlaceholderText: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  graphSubtext: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  muscleStats: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  muscleStatItem: {
    fontSize: 14,
    color: theme.text,
    marginVertical: 2,
  },
  profileContent: {
    flex: 1,
    padding: 16,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  profileCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  profileCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.text,
    marginBottom: 12,
  },
  profileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileInfoLabel: {
    fontSize: 16,
    color: theme.textSecondary,
  },
  profileInfoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.text,
  },
  editProfileButton: {
    backgroundColor: theme.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  editProfileButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
