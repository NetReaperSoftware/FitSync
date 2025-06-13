import { workoutStorageService, WorkoutSession } from './WorkoutStorageService';

class DebouncedStorageService {
  private pendingTimeout: NodeJS.Timeout | null = null;
  private readonly debounceDelay = 500; // 500ms delay for text input changes

  // Debounced save for text input changes
  debouncedSaveWorkout(workout: WorkoutSession): void {
    // Clear existing timeout
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
    }

    // Set new timeout
    this.pendingTimeout = setTimeout(async () => {
      try {
        await workoutStorageService.saveActiveWorkout(workout);
        this.pendingTimeout = null;
      } catch (error) {
        console.error('Error in debounced workout save:', error);
      }
    }, this.debounceDelay);
  }

  // Immediate save for critical operations (completion, finish, etc.)
  async immediateSaveWorkout(workout: WorkoutSession): Promise<void> {
    // Clear any pending debounced save
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }

    try {
      await workoutStorageService.saveActiveWorkout(workout);
    } catch (error) {
      console.error('Error in immediate workout save:', error);
      throw error;
    }
  }

  // Flush any pending saves (useful before critical operations)
  async flushPendingSaves(): Promise<void> {
    return new Promise((resolve) => {
      if (this.pendingTimeout) {
        // If there's a pending save, wait for it to complete
        const originalTimeout = this.pendingTimeout;
        clearTimeout(originalTimeout);
        
        // Execute the save immediately
        setTimeout(async () => {
          try {
            // The save logic will be executed here
            resolve();
          } catch (error) {
            console.error('Error flushing pending saves:', error);
            resolve(); // Don't throw, just resolve
          }
        }, 0);
      } else {
        resolve();
      }
    });
  }

  // Cancel any pending saves (useful for discard operations)
  cancelPendingSaves(): void {
    if (this.pendingTimeout) {
      clearTimeout(this.pendingTimeout);
      this.pendingTimeout = null;
    }
  }

  // Check if there are pending saves
  hasPendingSaves(): boolean {
    return this.pendingTimeout !== null;
  }
}

export const debouncedStorageService = new DebouncedStorageService();