import { supabase } from '../supabaseClient';

// Types for sync operations
type SyncOperationType = 
  | 'CREATE_ROUTINE' 
  | 'UPDATE_ROUTINE' 
  | 'DELETE_ROUTINE'
  | 'CREATE_FOLDER'
  | 'UPDATE_FOLDER'
  | 'DELETE_FOLDER';

interface SyncOperation {
  id: string;
  type: SyncOperationType;
  data: any;
  retryCount: number;
  timestamp: Date;
  localId?: string; // For temporary IDs
}

interface SyncResult {
  success: boolean;
  error?: string;
  data?: any;
}

class DataSyncService {
  private syncQueue: SyncOperation[] = [];
  private isProcessing = false;
  private maxRetries = 3;

  // Generate temporary ID for optimistic updates
  generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Add operation to sync queue
  private queueSync(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>): void {
    const syncOp: SyncOperation = {
      ...operation,
      id: this.generateTempId(),
      timestamp: new Date(),
      retryCount: 0,
    };

    this.syncQueue.push(syncOp);
    console.log('Queued sync operation:', syncOp.type, syncOp.id, 'Data:', syncOp.data);

    // Start processing if not already running
    if (!this.isProcessing) {
      console.log('Starting sync queue processing immediately');
      // Use setTimeout to ensure this runs asynchronously and doesn't block
      setTimeout(() => this.processSyncQueue().catch(error => {
        console.error('Error in processSyncQueue:', error);
        this.isProcessing = false;
      }), 0);
    } else {
      console.log('Sync queue already processing, operation added to queue');
    }
  }

  // Process sync queue in background
  private async processSyncQueue(): Promise<void> {
    if (this.isProcessing || this.syncQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log('Starting sync queue processing, queue length:', this.syncQueue.length);

    while (this.syncQueue.length > 0) {
      const operation = this.syncQueue[0];
      
      try {
        console.log('Processing sync operation:', operation.type, operation.id);
        const result = await this.executeOperation(operation);
        
        if (result.success) {
          console.log('✅ Sync operation successful:', operation.type, operation.id);
          this.syncQueue.shift(); // Remove completed operation
        } else {
          console.error('❌ Sync operation failed:', operation.type, operation.id, result.error);
          await this.handleFailedOperation(operation, result.error);
        }
      } catch (error) {
        console.error('Unexpected error in sync operation:', operation.type, operation.id, error);
        await this.handleFailedOperation(operation, String(error));
      }

      // Add small delay between operations to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.isProcessing = false;
    console.log('Sync queue processing completed');
  }

  // Execute individual sync operation
  private async executeOperation(operation: SyncOperation): Promise<SyncResult> {
    try {
      // Verify authentication before each operation
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.error('No authenticated user found for operation:', operation.type);
        return { success: false, error: 'User not authenticated' };
      }
      
      console.log('🔐 User authenticated for operation:', operation.type, 'User ID:', user.data.user.id);

      switch (operation.type) {
        case 'CREATE_ROUTINE':
          return await this.syncCreateRoutine(operation.data);
        case 'UPDATE_ROUTINE':
          return await this.syncUpdateRoutine(operation.data);
        case 'DELETE_ROUTINE':
          return await this.syncDeleteRoutine(operation.data);
        case 'CREATE_FOLDER':
          return await this.syncCreateFolder(operation.data);
        case 'UPDATE_FOLDER':
          return await this.syncUpdateFolder(operation.data);
        case 'DELETE_FOLDER':
          return await this.syncDeleteFolder(operation.data);
        default:
          return { success: false, error: `Unknown operation type: ${operation.type}` };
      }
    } catch (error) {
      console.error('Exception in executeOperation:', error);
      return { success: false, error: String(error) };
    }
  }

  // Handle failed operations with retry logic
  private async handleFailedOperation(operation: SyncOperation, error?: string): Promise<void> {
    operation.retryCount++;
    
    if (operation.retryCount <= this.maxRetries) {
      console.log(`Retrying operation ${operation.type} (attempt ${operation.retryCount}/${this.maxRetries})`);
      // Keep operation in queue for retry
    } else {
      console.error(`Operation ${operation.type} failed after ${this.maxRetries} attempts:`, error);
      this.syncQueue.shift(); // Remove failed operation
      
      // Here we could trigger a UI notification about the failed operation
      // For now, we'll just log it
      console.error('Sync operation permanently failed:', {
        type: operation.type,
        error,
        data: operation.data
      });
    }
  }

  // Sync operations for routines
  private async syncCreateRoutine(routineData: any): Promise<SyncResult> {
    try {
      console.log('💾 Starting database creation for routine:', routineData.name, 'tempId:', routineData.tempId);
      
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.error('No authenticated user found');
        return { success: false, error: 'No authenticated user' };
      }

      // Check if folder ID is temporary - if so, try to find the real folder ID first
      if (routineData.folderId && routineData.folderId.startsWith('temp_')) {
        console.log('⏳ Folder ID is temporary, looking for real folder ID:', routineData.folderId);
        
        // Try to find if the folder has already been created in the database
        const { data: folderData } = await supabase
          .schema('fitness') 
          .from('workout_routine_folders')
          .select('id')
          .eq('created_by', user.data.user.id)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (folderData && folderData.length > 0) {
          console.log('Found recently created folder, using ID:', folderData[0].id);
          routineData.folderId = folderData[0].id;
        } else {
          console.log('No real folder found yet, skipping folder assignment');
          routineData.folderId = null; // Create routine without folder assignment for now
        }
      }

      console.log('Creating routine in database with data:', {
        name: routineData.name,
        description: routineData.description || 'User created routine',
        folder_id: routineData.folderId,
        user_id: user.data.user.id
      });

      const { data: newRoutineData, error: routineError } = await supabase
        .schema('fitness')
        .from('workout_routines')
        .insert({
          name: routineData.name,
          description: routineData.description || 'User created routine',
          is_default: false,
          created_by: user.data.user.id,
          folder_id: routineData.folderId
        })
        .select()
        .single();

      if (routineError) {
        console.error('Failed to create routine in database:', routineError);
        return { success: false, error: routineError.message };
      }

      console.log('✅ Created routine in database with ID:', newRoutineData.id);

      // Insert routine exercises if any
      if (routineData.exercises && routineData.exercises.length > 0) {
        console.log('Creating routine exercises for', routineData.exercises.length, 'exercises');
        const routineExercises: any[] = [];
        routineData.exercises.forEach((exercise: any, exerciseIndex: number) => {
          exercise.sets.forEach((set: any, setIndex: number) => {
            routineExercises.push({
              routine_id: newRoutineData.id,
              exercise_id: exercise.id,
              sets: 1,
              reps: set.reps || 0,
              weight_lbs: set.weight || 0,
              order_in_routine: exerciseIndex + 1,
              set_number: setIndex + 1
            });
          });
        });

        console.log('Inserting', routineExercises.length, 'routine exercises');
        const { error: exercisesError } = await supabase
          .schema('fitness')
          .from('workout_routine_exercises')
          .insert(routineExercises);

        if (exercisesError) {
          console.error('Failed to create routine exercises:', exercisesError);
          return { success: false, error: exercisesError.message };
        }
        
        console.log('✅ Created routine exercises successfully');
      }

      return { 
        success: true, 
        data: { 
          ...newRoutineData,
          tempId: routineData.tempId // Include temp ID for mapping
        }
      };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  private async syncUpdateRoutine(routineData: any): Promise<SyncResult> {
    try {
      console.log('📝 Starting database update for routine:', routineData.id, 'New name:', routineData.name);
      
      const { error: routineError } = await supabase
        .schema('fitness')
        .from('workout_routines')
        .update({
          name: routineData.name,
          folder_id: routineData.folderId
        })
        .eq('id', routineData.id);

      if (routineError) {
        console.error('Failed to update routine in database:', routineError);
        return { success: false, error: routineError.message };
      }

      console.log('✅ Successfully updated routine in database');
      return { success: true };
    } catch (error) {
      console.error('Unexpected error in syncUpdateRoutine:', error);
      return { success: false, error: String(error) };
    }
  }

  private async syncDeleteRoutine(routineData: any): Promise<SyncResult> {
    try {
      console.log('🗑️ Starting database deletion for routine:', routineData.id);
      
      // First delete routine exercises
      console.log('Deleting routine exercises for routine:', routineData.id);
      const { error: exercisesError, count: exercisesDeleted } = await supabase
        .schema('fitness')
        .from('workout_routine_exercises')
        .delete({ count: 'exact' })
        .eq('routine_id', routineData.id);

      if (exercisesError) {
        console.error('Failed to delete routine exercises:', exercisesError);
        return { success: false, error: exercisesError.message };
      }

      console.log(`Deleted ${exercisesDeleted} routine exercises`);

      // Then delete the routine
      console.log('Deleting routine:', routineData.id);
      const { error: routineError, count: routinesDeleted } = await supabase
        .schema('fitness')
        .from('workout_routines')
        .delete({ count: 'exact' })
        .eq('id', routineData.id);

      if (routineError) {
        console.error('Failed to delete routine:', routineError);
        return { success: false, error: routineError.message };
      }

      console.log(`Successfully deleted ${routinesDeleted} routine(s) from database`);
      return { success: true };
    } catch (error) {
      console.error('Unexpected error in syncDeleteRoutine:', error);
      return { success: false, error: String(error) };
    }
  }

  // Sync operations for folders
  private async syncCreateFolder(folderData: any): Promise<SyncResult> {
    try {
      console.log('📁 Starting database creation for folder:', folderData.name, 'tempId:', folderData.tempId);
      
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        console.error('No authenticated user found');
        return { success: false, error: 'No authenticated user' };
      }

      console.log('Creating folder in database with data:', {
        name: folderData.name,
        description: folderData.description || 'User created folder',
        user_id: user.data.user.id
      });

      const { data: newFolderData, error: folderError } = await supabase
        .schema('fitness')
        .from('workout_routine_folders')
        .insert({
          name: folderData.name,
          description: folderData.description || 'User created folder',
          is_default: false,
          created_by: user.data.user.id
        })
        .select()
        .single();

      if (folderError) {
        console.error('Failed to create folder in database:', folderError);
        return { success: false, error: folderError.message };
      }

      console.log('✅ Created folder in database with ID:', newFolderData.id);
      
      // Update any pending routine operations that reference this temporary folder ID
      this.updatePendingRoutineFolderIds(folderData.tempId, newFolderData.id);
      
      return { 
        success: true, 
        data: { 
          ...newFolderData,
          tempId: folderData.tempId // Include temp ID for mapping
        }
      };
    } catch (error) {
      console.error('Unexpected error in syncCreateFolder:', error);
      return { success: false, error: String(error) };
    }
  }

  private async syncUpdateFolder(folderData: any): Promise<SyncResult> {
    try {
      console.log('📝 Starting database update for folder:', folderData.id, 'New name:', folderData.name);
      
      const { error: folderError } = await supabase
        .schema('fitness')
        .from('workout_routine_folders')
        .update({
          name: folderData.name,
          description: folderData.description
        })
        .eq('id', folderData.id);

      if (folderError) {
        console.error('Failed to update folder in database:', folderError);
        return { success: false, error: folderError.message };
      }

      console.log('✅ Successfully updated folder in database');
      return { success: true };
    } catch (error) {
      console.error('Unexpected error in syncUpdateFolder:', error);
      return { success: false, error: String(error) };
    }
  }

  private async syncDeleteFolder(folderData: any): Promise<SyncResult> {
    try {
      console.log('🗑️ Starting database deletion for folder:', folderData.id);
      
      // First, check if folder exists and get info about it
      const { data: folderCheck, error: checkError } = await supabase
        .schema('fitness')
        .from('workout_routine_folders')
        .select('id, name, created_by')
        .eq('id', folderData.id)
        .single();
      
      if (checkError) {
        console.error('Error checking folder existence:', checkError);
        return { success: false, error: 'Folder not found in database.' };
      }
      
      if (!folderCheck) {
        console.error('Folder not found in database:', folderData.id);
        return { success: false, error: 'Folder not found in database.' };
      }
      
      // Verify user owns this folder
      const user = await supabase.auth.getUser();
      if (folderCheck.created_by !== user.data.user?.id) {
        console.error('User does not own this folder');
        return { success: false, error: 'You can only delete folders that you created.' };
      }
      
      console.log('Folder verification passed, proceeding with deletion');
      
      // Get all routines in this folder that need to be deleted
      const { data: routinesInFolder, error: routinesError } = await supabase
        .schema('fitness')
        .from('workout_routines')
        .select('id')
        .eq('folder_id', folderData.id);

      if (routinesError) {
        console.error('Failed to fetch routines in folder:', routinesError);
        return { success: false, error: routinesError.message };
      }
      
      console.log(`Found ${routinesInFolder?.length || 0} routines to delete with folder`);

      // Delete all routine exercises for routines in this folder
      if (routinesInFolder && routinesInFolder.length > 0) {
        const routineIds = routinesInFolder.map(r => r.id);
        
        console.log('Deleting routine exercises for routines in folder...');
        const { error: exercisesError } = await supabase
          .schema('fitness')
          .from('workout_routine_exercises')
          .delete()
          .in('routine_id', routineIds);

        if (exercisesError) {
          console.error('Failed to delete routine exercises:', exercisesError);
          return { success: false, error: exercisesError.message };
        }

        console.log('Successfully deleted routine exercises');

        // Delete all routines in this folder
        console.log('Deleting routines in folder...');
        const { error: deleteRoutinesError, count: routinesDeleted } = await supabase
          .schema('fitness')
          .from('workout_routines')
          .delete({ count: 'exact' })
          .eq('folder_id', folderData.id);

        if (deleteRoutinesError) {
          console.error('Failed to delete routines in folder:', deleteRoutinesError);
          return { success: false, error: deleteRoutinesError.message };
        }
        
        console.log(`Successfully deleted ${routinesDeleted} routine(s) from folder`);
      }

      // Finally, delete the folder
      console.log('Deleting folder:', folderData.id);
      const { error: folderError, count: foldersDeleted } = await supabase
        .schema('fitness')
        .from('workout_routine_folders')
        .delete({ count: 'exact' })
        .eq('id', folderData.id);

      if (folderError) {
        console.error('Failed to delete folder:', folderError);
        return { success: false, error: folderError.message };
      }

      console.log(`Successfully deleted ${foldersDeleted} folder(s) from database`);
      return { success: true };
    } catch (error) {
      console.error('Unexpected error in syncDeleteFolder:', error);
      return { success: false, error: String(error) };
    }
  }

  // Helper method to update folder IDs in pending routine operations
  private updatePendingRoutineFolderIds(tempFolderId: string, realFolderId: string): void {
    console.log('🔄 Updating pending routine operations from temp folder ID:', tempFolderId, 'to real ID:', realFolderId);
    
    let updatedCount = 0;
    this.syncQueue.forEach(operation => {
      if (operation.type === 'CREATE_ROUTINE' && operation.data.folderId === tempFolderId) {
        operation.data.folderId = realFolderId;
        updatedCount++;
        console.log('Updated routine operation folder ID:', operation.data.name);
      }
    });
    
    console.log(`✅ Updated ${updatedCount} pending routine operations with new folder ID`);
  }

  // Public methods for optimistic updates
  createRoutineOptimistic(routineData: any): string {
    const tempId = this.generateTempId();
    const dataWithTempId = { ...routineData, tempId };
    
    this.queueSync({
      type: 'CREATE_ROUTINE',
      data: dataWithTempId,
      localId: tempId
    });

    return tempId;
  }

  updateRoutineOptimistic(routineData: any): void {
    this.queueSync({
      type: 'UPDATE_ROUTINE',
      data: routineData
    });
  }

  deleteRoutineOptimistic(routineId: string): void {
    this.queueSync({
      type: 'DELETE_ROUTINE',
      data: { id: routineId }
    });
  }

  // Folder optimistic operations
  createFolderOptimistic(folderData: any): string {
    const tempId = this.generateTempId();
    const dataWithTempId = { ...folderData, tempId };
    
    this.queueSync({
      type: 'CREATE_FOLDER',
      data: dataWithTempId,
      localId: tempId
    });

    return tempId;
  }

  updateFolderOptimistic(folderData: any): void {
    this.queueSync({
      type: 'UPDATE_FOLDER',
      data: folderData
    });
  }

  deleteFolderOptimistic(folderId: string): void {
    this.queueSync({
      type: 'DELETE_FOLDER',
      data: { id: folderId }
    });
  }

  // Get current sync queue status
  getSyncStatus() {
    return {
      queueLength: this.syncQueue.length,
      isProcessing: this.isProcessing,
      pendingOperations: this.syncQueue.map(op => ({
        type: op.type,
        retryCount: op.retryCount,
        timestamp: op.timestamp,
        data: op.data
      }))
    };
  }

  // Manual sync trigger for debugging
  async forceSyncNow(): Promise<void> {
    console.log('🔄 Manual sync triggered, queue length:', this.syncQueue.length);
    if (this.syncQueue.length > 0 && !this.isProcessing) {
      await this.processSyncQueue();
    } else if (this.isProcessing) {
      console.log('Sync already in progress');
    } else {
      console.log('No operations in queue');
    }
  }

  // Clear sync queue (for debugging/recovery)
  clearSyncQueue(): void {
    console.log('🗑️ Clearing sync queue, removed', this.syncQueue.length, 'operations');
    this.syncQueue = [];
    this.isProcessing = false;
  }
}

// Export singleton instance
export const dataSyncService = new DataSyncService();
export default DataSyncService;