import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { dataSyncService } from '../services/DataSyncService';
import { DatabaseExercise } from './useActiveWorkout';

export const useWorkoutData = () => {
  const [exerciseLibrary, setExerciseLibrary] = useState<DatabaseExercise[]>([]);
  const [exerciseScreenVisible, setExerciseScreenVisible] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [bottomSheetOptions, setBottomSheetOptions] = useState<any[]>([]);
  const [bottomSheetTitle, setBottomSheetTitle] = useState<string | undefined>(undefined);

  // Fetch exercises from database
  const fetchExercises = useCallback(async () => {
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
      setExerciseLibrary(data as DatabaseExercise[]);
      console.log('Successfully fetched exercises:', data?.length || 0);
    }
  }, []);

  // Initialize data on mount
  useEffect(() => {
    fetchExercises();
    
    // Log sync status every 5 seconds for debugging
    const syncStatusInterval = setInterval(() => {
      const status = dataSyncService.getSyncStatus();
      if (status.queueLength > 0) {
        console.log('📊 DataSync Status:', status);
      }
    }, 5000);

    // Add global debugging functions
    if (__DEV__) {
      // @ts-ignore
      global.syncStatus = () => {
        const status = dataSyncService.getSyncStatus();
        console.log('📊 Current Sync Status:', JSON.stringify(status, null, 2));
        return status;
      };
      // @ts-ignore
      global.forceSync = () => {
        console.log('🔄 Forcing sync manually...');
        dataSyncService.forceSyncNow();
      };
      // @ts-ignore
      global.clearSync = () => {
        dataSyncService.clearSyncQueue();
      };
      console.log('🔧 Debug functions available: syncStatus(), forceSync(), clearSync()');
    }

    return () => clearInterval(syncStatusInterval);
  }, [fetchExercises]);

  // Handle background press
  const handleBackgroundPress = useCallback(() => {
    setBottomSheetVisible(false);
  }, []);

  // Show bottom sheet options
  const showBottomSheetOptions = useCallback((options: any[], title?: string) => {
    setBottomSheetOptions(options);
    setBottomSheetTitle(title);
    setBottomSheetVisible(true);
  }, []);

  // Hide bottom sheet
  const hideBottomSheet = useCallback(() => {
    setBottomSheetVisible(false);
  }, []);

  return {
    // State
    exerciseLibrary,
    exerciseScreenVisible,
    bottomSheetVisible,
    bottomSheetOptions,
    bottomSheetTitle,

    // Actions
    fetchExercises,
    handleBackgroundPress,
    showBottomSheetOptions,
    hideBottomSheet,

    // Setters
    setExerciseScreenVisible,
    setBottomSheetVisible,
  };
};