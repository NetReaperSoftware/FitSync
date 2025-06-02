import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  SafeAreaView
} from 'react-native';

type FoodItem = {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  servingSize: string;
};

type MealEntry = {
  id: string;
  foodItem: FoodItem;
  servings: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  timestamp: Date;
};

export default function FoodTrackerScreen(): React.JSX.Element {
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [searchQuery, setSearchQuery] = useState('');
  const [todayEntries, setTodayEntries] = useState<MealEntry[]>([
    {
      id: '1',
      foodItem: {
        id: 'f1',
        name: 'Oatmeal with Berries',
        calories: 250,
        carbs: 40,
        protein: 8,
        fat: 5,
        servingSize: '1 bowl'
      },
      servings: 1,
      mealType: 'breakfast',
      timestamp: new Date()
    },
    {
      id: '2',
      foodItem: {
        id: 'f2',
        name: 'Chicken Salad',
        calories: 350,
        carbs: 10,
        protein: 35,
        fat: 18,
        servingSize: '1 bowl'
      },
      servings: 1,
      mealType: 'lunch',
      timestamp: new Date()
    }
  ]);

  // Mock search results - would be replaced with API call
  const [searchResults, setSearchResults] = useState<FoodItem[]>([
    {
      id: 'f3',
      name: 'Banana',
      calories: 105,
      carbs: 27,
      protein: 1.3,
      fat: 0.4,
      servingSize: '1 medium'
    },
    {
      id: 'f4',
      name: 'Greek Yogurt',
      calories: 130,
      carbs: 6,
      protein: 17,
      fat: 4,
      servingSize: '170g container'
    }
  ]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // In a real app, this would call an API to search for food items
  };

  const addFoodItem = (item: FoodItem) => {
    const newEntry: MealEntry = {
      id: Date.now().toString(),
      foodItem: item,
      servings: 1,
      mealType: mealType,
      timestamp: new Date()
    };
    
    setTodayEntries([...todayEntries, newEntry]);
    setSearchQuery('');
  };

  const removeFoodItem = (id: string) => {
    setTodayEntries(todayEntries.filter(entry => entry.id !== id));
  };

  const renderMealTypeButton = (type: 'breakfast' | 'lunch' | 'dinner' | 'snack', label: string) => (
    <TouchableOpacity
      style={[styles.mealTypeButton, mealType === type && styles.mealTypeButtonActive]}
      onPress={() => setMealType(type)}
    >
      <Text style={[styles.mealTypeButtonText, mealType === type && styles.mealTypeButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.content}>
          <Text style={styles.header}>Food Tracker</Text>
          
          {/* Meal Type Selection */}
          <View style={styles.mealTypeContainer}>
            {renderMealTypeButton('breakfast', 'Breakfast')}
            {renderMealTypeButton('lunch', 'Lunch')}
            {renderMealTypeButton('dinner', 'Dinner')}
            {renderMealTypeButton('snack', 'Snack')}
          </View>
          
          {/* Food Search */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a food..."
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
          
          {/* Search Results */}
          {searchQuery.length > 0 && (
            <View style={styles.searchResultsContainer}>
              {searchResults.map(item => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.searchResultItem}
                  onPress={() => addFoodItem(item)}
                >
                  <View>
                    <Text style={styles.foodItemName}>{item.name}</Text>
                    <Text style={styles.foodItemDetails}>
                      {item.calories} cal | {item.servingSize}
                    </Text>
                  </View>
                  <Text style={styles.addText}>+ Add</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Today's Entries */}
          <View style={styles.todayEntriesContainer}>
            <Text style={styles.sectionHeader}>Today's Log</Text>
            
            {/* Breakfast Section */}
            <View style={styles.mealSection}>
              <Text style={styles.mealSectionHeader}>Breakfast</Text>
              {todayEntries
                .filter(entry => entry.mealType === 'breakfast')
                .map(entry => (
                  <View key={entry.id} style={styles.foodLogItem}>
                    <View style={styles.foodLogItemDetails}>
                      <Text style={styles.foodLogItemName}>{entry.foodItem.name}</Text>
                      <Text style={styles.foodLogItemMacros}>
                        {entry.foodItem.calories} cal | C: {entry.foodItem.carbs}g | 
                        P: {entry.foodItem.protein}g | F: {entry.foodItem.fat}g
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFoodItem(entry.id)}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
            
            {/* Lunch Section */}
            <View style={styles.mealSection}>
              <Text style={styles.mealSectionHeader}>Lunch</Text>
              {todayEntries
                .filter(entry => entry.mealType === 'lunch')
                .map(entry => (
                  <View key={entry.id} style={styles.foodLogItem}>
                    <View style={styles.foodLogItemDetails}>
                      <Text style={styles.foodLogItemName}>{entry.foodItem.name}</Text>
                      <Text style={styles.foodLogItemMacros}>
                        {entry.foodItem.calories} cal | C: {entry.foodItem.carbs}g | 
                        P: {entry.foodItem.protein}g | F: {entry.foodItem.fat}g
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFoodItem(entry.id)}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
            
            {/* Dinner Section */}
            <View style={styles.mealSection}>
              <Text style={styles.mealSectionHeader}>Dinner</Text>
              {todayEntries
                .filter(entry => entry.mealType === 'dinner')
                .map(entry => (
                  <View key={entry.id} style={styles.foodLogItem}>
                    <View style={styles.foodLogItemDetails}>
                      <Text style={styles.foodLogItemName}>{entry.foodItem.name}</Text>
                      <Text style={styles.foodLogItemMacros}>
                        {entry.foodItem.calories} cal | C: {entry.foodItem.carbs}g | 
                        P: {entry.foodItem.protein}g | F: {entry.foodItem.fat}g
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFoodItem(entry.id)}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
            
            {/* Snacks Section */}
            <View style={styles.mealSection}>
              <Text style={styles.mealSectionHeader}>Snacks</Text>
              {todayEntries
                .filter(entry => entry.mealType === 'snack')
                .map(entry => (
                  <View key={entry.id} style={styles.foodLogItem}>
                    <View style={styles.foodLogItemDetails}>
                      <Text style={styles.foodLogItemName}>{entry.foodItem.name}</Text>
                      <Text style={styles.foodLogItemMacros}>
                        {entry.foodItem.calories} cal | C: {entry.foodItem.carbs}g | 
                        P: {entry.foodItem.protein}g | F: {entry.foodItem.fat}g
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeFoodItem(entry.id)}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#333',
    textAlign: 'center',
  },
  mealTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mealTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
  },
  mealTypeButtonActive: {
    backgroundColor: '#4285F4',
  },
  mealTypeButtonText: {
    color: '#555',
    fontWeight: '500',
  },
  mealTypeButtonTextActive: {
    color: 'white',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchResultsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  foodItemDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addText: {
    color: '#4285F4',
    fontWeight: '600',
  },
  todayEntriesContainer: {
    marginTop: 16,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  mealSection: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  mealSectionHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#444',
  },
  foodLogItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  foodLogItemDetails: {
    flex: 1,
  },
  foodLogItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  foodLogItemMacros: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  removeText: {
    color: '#EA4335',
    fontWeight: '500',
  },
});