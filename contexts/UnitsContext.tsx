import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabaseClient';

interface UnitsContextType {
  useMetricUnits: boolean;
  setUseMetricUnits: (useMetric: boolean) => void;
  getWeightUnit: () => string;
  getWeightLabel: () => string;
  getVolumeLabel: () => string;
  convertWeight: (weight: number, toMetric?: boolean) => number;
  formatWeight: (weight: number) => string;
  normalizeWeightForStorage: (weight: number) => number;
  convertStoredWeightForDisplay: (storedWeight: number) => number;
  loading: boolean;
}

const UnitsContext = createContext<UnitsContextType | undefined>(undefined);

export const useUnits = () => {
  const context = useContext(UnitsContext);
  if (context === undefined) {
    throw new Error('useUnits must be used within a UnitsProvider');
  }
  return context;
};

interface UnitsProviderProps {
  children: ReactNode;
}

export const UnitsProvider: React.FC<UnitsProviderProps> = ({ children }) => {
  const [useMetricUnits, setUseMetricUnits] = useState(false); // Default to Imperial
  const [loading, setLoading] = useState(true);

  // Load user preferences from database
  const loadUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('weight_units')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading user preferences:', error);
        setLoading(false);
        return;
      }

      if (profile) {
        setUseMetricUnits(profile.weight_units === 'kg');
      } else {
        // Create default profile for new users
        await createDefaultUserProfile(user.id);
      }
    } catch (error) {
      console.error('Error in loadUserPreferences:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create default user profile
  const createDefaultUserProfile = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          weight_units: 'lbs' // Default to Imperial
        });

      if (error) {
        console.error('Error creating user profile:', error);
      }
    } catch (error) {
      console.error('Error in createDefaultUserProfile:', error);
    }
  };

  // Save user preference to database
  const saveUserPreference = async (useMetric: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          weight_units: useMetric ? 'kg' : 'lbs',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error saving user preference:', error);
        return;
      }

      setUseMetricUnits(useMetric);
    } catch (error) {
      console.error('Error in saveUserPreference:', error);
    }
  };

  // Load preferences on mount and auth changes
  useEffect(() => {
    loadUserPreferences();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        loadUserPreferences();
      } else if (event === 'SIGNED_OUT') {
        setUseMetricUnits(false); // Reset to default
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getWeightUnit = () => {
    return useMetricUnits ? 'kg' : 'lbs';
  };

  const getWeightLabel = () => {
    return useMetricUnits ? 'Weight (kg)' : 'Weight (lbs)';
  };

  const getVolumeLabel = () => {
    return useMetricUnits ? 'Volume (kg)' : 'Volume (lbs)';
  };

  // Convert weight between units
  // Default storage is in lbs, convert to kg when needed
  const convertWeight = (weight: number, toMetric?: boolean): number => {
    const shouldConvertToMetric = toMetric !== undefined ? toMetric : useMetricUnits;
    
    if (shouldConvertToMetric) {
      // Convert lbs to kg
      return Math.round(weight * 0.453592 * 10) / 10; // Round to 1 decimal place
    } else {
      // Convert kg to lbs (if input was in kg)
      return Math.round(weight * 2.20462 * 10) / 10; // Round to 1 decimal place
    }
  };

  // Format weight for display with appropriate unit
  const formatWeight = (weight: number): string => {
    if (weight === 0) return 'BW'; // Bodyweight
    
    const displayWeight = useMetricUnits ? convertWeight(weight, true) : weight;
    const unit = getWeightUnit();
    
    return `${displayWeight} ${unit}`;
  };

  // Normalize user input weight to lbs for database storage
  // If user enters weight in kg, convert to lbs before saving
  const normalizeWeightForStorage = (userInputWeight: number): number => {
    if (useMetricUnits) {
      // User entered kg, convert to lbs for storage
      return Math.round(userInputWeight * 2.20462 * 100) / 100; // Round to 2 decimal places
    } else {
      // User entered lbs, store as-is
      return userInputWeight;
    }
  };

  // Convert stored weight (always in lbs) to user's preferred unit for display
  const convertStoredWeightForDisplay = (storedWeight: number): number => {
    if (useMetricUnits) {
      // Convert stored lbs to kg for display
      return Math.round(storedWeight * 0.453592 * 100) / 100; // Round to 2 decimal places
    } else {
      // Display lbs as-is
      return storedWeight;
    }
  };

  const value: UnitsContextType = {
    useMetricUnits,
    setUseMetricUnits: saveUserPreference,
    getWeightUnit,
    getWeightLabel,
    getVolumeLabel,
    convertWeight,
    formatWeight,
    normalizeWeightForStorage,
    convertStoredWeightForDisplay,
    loading,
  };

  return (
    <UnitsContext.Provider value={value}>
      {children}
    </UnitsContext.Provider>
  );
};