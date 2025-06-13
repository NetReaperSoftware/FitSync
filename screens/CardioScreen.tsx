import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function CardioScreen(): React.JSX.Element {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('today');
  
  // Mock data - would be replaced with actual data from backend
  const [cardioData] = useState({
    today: {
      steps: 8245,
      stepGoal: 10000,
      distance: 6.2,
      activeMinutes: 45,
      caloriesBurned: 320,
      heartRate: {
        current: 72,
        resting: 68,
        max: 185
      },
      activities: [
        {
          name: 'Morning Walk',
          duration: 25,
          calories: 120,
          time: '8:00 AM'
        },
        {
          name: 'Treadmill Run',
          duration: 20,
          calories: 200,
          time: '6:30 PM'
        }
      ]
    },
    week: {
      totalSteps: 58000,
      totalDistance: 42.5,
      totalActiveMinutes: 315,
      totalCaloriesBurned: 2240,
      dailyAverages: {
        steps: 8285,
        distance: 6.1,
        activeMinutes: 45,
        calories: 320
      }
    }
  });

  const stepProgress = (cardioData.today.steps / cardioData.today.stepGoal) * 100;
  const styles = createStyles(theme);
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.header}>Cardio Tracker</Text>
          
          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'today' && styles.activeTab]}
              onPress={() => setActiveTab('today')}
            >
              <Text style={[styles.tabText, activeTab === 'today' && styles.activeTabText]}>
                Today
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'week' && styles.activeTab]}
              onPress={() => setActiveTab('week')}
            >
              <Text style={[styles.tabText, activeTab === 'week' && styles.activeTabText]}>
                This Week
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'today' ? (
            <>
              {/* Steps Progress */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Daily Steps</Text>
                <View style={styles.stepsContainer}>
                  <Text style={styles.stepsValue}>{cardioData.today.steps.toLocaleString()}</Text>
                  <Text style={styles.stepsGoal}>of {cardioData.today.stepGoal.toLocaleString()}</Text>
                </View>
                <View style={styles.progressContainer}>
                  <View 
                    style={[styles.progressBar, { width: `${Math.min(stepProgress, 100)}%` }]} 
                  />
                </View>
                <Text style={styles.progressText}>{Math.round(stepProgress)}% of daily goal</Text>
              </View>

              {/* Cardio Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{cardioData.today.distance}</Text>
                  <Text style={styles.statLabel}>km walked</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{cardioData.today.activeMinutes}</Text>
                  <Text style={styles.statLabel}>active minutes</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{cardioData.today.caloriesBurned}</Text>
                  <Text style={styles.statLabel}>calories burned</Text>
                </View>
              </View>

              {/* Heart Rate */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Heart Rate</Text>
                <View style={styles.heartRateContainer}>
                  <View style={styles.heartRateItem}>
                    <Text style={styles.heartRateValue}>{cardioData.today.heartRate.current}</Text>
                    <Text style={styles.heartRateLabel}>Current (bpm)</Text>
                  </View>
                  <View style={styles.heartRateItem}>
                    <Text style={styles.heartRateValue}>{cardioData.today.heartRate.resting}</Text>
                    <Text style={styles.heartRateLabel}>Resting (bpm)</Text>
                  </View>
                  <View style={styles.heartRateItem}>
                    <Text style={styles.heartRateValue}>{cardioData.today.heartRate.max}</Text>
                    <Text style={styles.heartRateLabel}>Max (bpm)</Text>
                  </View>
                </View>
              </View>

              {/* Today's Activities */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Today's Activities</Text>
                {cardioData.today.activities.length > 0 ? (
                  cardioData.today.activities.map((activity, index) => (
                    <View key={index} style={styles.activityItem}>
                      <View style={styles.activityHeader}>
                        <Text style={styles.activityName}>{activity.name}</Text>
                        <Text style={styles.activityTime}>{activity.time}</Text>
                      </View>
                      <View style={styles.activityDetails}>
                        <Text style={styles.activityDetail}>{activity.duration} min</Text>
                        <Text style={styles.activityDetail}>{activity.calories} cal</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noActivities}>No cardio activities logged today</Text>
                )}
              </View>
            </>
          ) : (
            <>
              {/* Weekly Summary */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Weekly Summary</Text>
                <View style={styles.weeklyStatsContainer}>
                  <View style={styles.weeklyStatItem}>
                    <Text style={styles.weeklyStatValue}>{cardioData.week.totalSteps.toLocaleString()}</Text>
                    <Text style={styles.weeklyStatLabel}>Total Steps</Text>
                  </View>
                  <View style={styles.weeklyStatItem}>
                    <Text style={styles.weeklyStatValue}>{cardioData.week.totalDistance}</Text>
                    <Text style={styles.weeklyStatLabel}>Total Distance (km)</Text>
                  </View>
                </View>
                <View style={styles.weeklyStatsContainer}>
                  <View style={styles.weeklyStatItem}>
                    <Text style={styles.weeklyStatValue}>{cardioData.week.totalActiveMinutes}</Text>
                    <Text style={styles.weeklyStatLabel}>Active Minutes</Text>
                  </View>
                  <View style={styles.weeklyStatItem}>
                    <Text style={styles.weeklyStatValue}>{cardioData.week.totalCaloriesBurned}</Text>
                    <Text style={styles.weeklyStatLabel}>Calories Burned</Text>
                  </View>
                </View>
              </View>

              {/* Daily Averages */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Daily Averages</Text>
                <View style={styles.averagesContainer}>
                  <View style={styles.averageItem}>
                    <Text style={styles.averageValue}>{cardioData.week.dailyAverages.steps.toLocaleString()}</Text>
                    <Text style={styles.averageLabel}>steps/day</Text>
                  </View>
                  <View style={styles.averageItem}>
                    <Text style={styles.averageValue}>{cardioData.week.dailyAverages.distance}</Text>
                    <Text style={styles.averageLabel}>km/day</Text>
                  </View>
                  <View style={styles.averageItem}>
                    <Text style={styles.averageValue}>{cardioData.week.dailyAverages.activeMinutes}</Text>
                    <Text style={styles.averageLabel}>active min/day</Text>
                  </View>
                  <View style={styles.averageItem}>
                    <Text style={styles.averageValue}>{cardioData.week.dailyAverages.calories}</Text>
                    <Text style={styles.averageLabel}>cal/day</Text>
                  </View>
                </View>
              </View>
            </>
          )}
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.cardBackground,
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: theme.primary,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textSecondary,
  },
  activeTabText: {
    color: 'white',
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
  stepsContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stepsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.primary,
  },
  stepsGoal: {
    fontSize: 16,
    color: theme.textSecondary,
    marginTop: 4,
  },
  progressContainer: {
    height: 8,
    backgroundColor: theme.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statBox: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    flex: 0.31,
    alignItems: 'center',
    elevation: 3,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: theme.borderLight,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  heartRateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heartRateItem: {
    flex: 1,
    alignItems: 'center',
  },
  heartRateValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.error,
    marginBottom: 4,
  },
  heartRateLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  activityItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.borderLight,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
  },
  activityTime: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  activityDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  activityDetail: {
    fontSize: 14,
    color: theme.textSecondary,
  },
  noActivities: {
    fontSize: 14,
    color: theme.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  weeklyStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weeklyStatItem: {
    flex: 0.48,
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.border,
    borderRadius: 8,
  },
  weeklyStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 4,
  },
  weeklyStatLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  averagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  averageItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: theme.border,
    borderRadius: 8,
  },
  averageValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.primary,
    marginBottom: 4,
  },
  averageLabel: {
    fontSize: 11,
    color: theme.textSecondary,
    textAlign: 'center',
  },
});