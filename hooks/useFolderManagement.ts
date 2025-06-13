import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { dataSyncService } from '../services/DataSyncService';

export type Folder = {
  id: string;
  name: string;
  isDefault?: boolean;
  isUserOwned?: boolean;
};

export const useFolderManagement = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderCreationVisible, setFolderCreationVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [folderRenameVisible, setFolderRenameVisible] = useState(false);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState('');
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [folderDeleteConfirmVisible, setFolderDeleteConfirmVisible] = useState(false);
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

  // Fetch folders from database
  const fetchFolders = useCallback(async () => {
    try {
      const user = await supabase.auth.getUser();
      const userId = user.data.user?.id;

      // Fetch both default folders and user-created folders
      const { data: foldersData, error: foldersError } = await supabase
        .schema('fitness')
        .from('workout_routine_folders')
        .select('id, name, description, is_default, created_by')
        .or(`is_default.eq.true,created_by.eq.${userId}`)
        .order('name');

      if (foldersError) {
        console.error('Error fetching folders:', foldersError);
        return;
      }

      if (!foldersData) {
        console.log('No folders found');
        return;
      }

      // Convert database folders to app format
      const convertedFolders: Folder[] = foldersData.map((dbFolder: any) => ({
        id: dbFolder.id,
        name: dbFolder.name,
        isDefault: dbFolder.is_default,
        isUserOwned: dbFolder.created_by === userId
      }));

      setFolders(convertedFolders);
      console.log('Successfully fetched folders:', convertedFolders.length);
    } catch (error) {
      console.error('Unexpected error fetching folders:', error);
    }
  }, []);

  // Create new folder
  const createFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    
    // OPTIMISTIC UPDATE: Create folder with temporary ID
    const tempId = dataSyncService.generateTempId();
    const newFolder: Folder = {
      id: tempId,
      name: newFolderName.trim(),
      isDefault: false,
      isUserOwned: true
    };
    
    // Immediately update UI
    setFolders(prev => [...prev, newFolder]);
    console.log('Optimistically created folder with temp ID:', tempId);
    
    // Queue for background sync
    try {
      const syncTempId = dataSyncService.createFolderOptimistic({
        name: newFolderName.trim(),
        description: 'User created folder',
        tempId: tempId
      });
      console.log('📁 Folder queued for sync:', newFolderName.trim(), 'with temp ID:', syncTempId);
    } catch (error) {
      console.error('❌ Failed to queue folder creation:', error);
      // Rollback optimistic update
      setFolders(prevFolders => prevFolders.filter(f => f.id !== tempId));
      alert('Failed to create folder. Please try again.');
      return;
    }
    
    setFolderCreationVisible(false);
    setNewFolderName('');
  }, [newFolderName]);

  // Toggle folder collapse
  const toggleFolderCollapse = useCallback((folderId: string) => {
    const newCollapsed = new Set(collapsedFolders);
    if (newCollapsed.has(folderId)) {
      newCollapsed.delete(folderId);
    } else {
      newCollapsed.add(folderId);
    }
    setCollapsedFolders(newCollapsed);
  }, [collapsedFolders]);

  // Start renaming folder
  const startRenamingFolder = useCallback((folderId: string, currentName: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // Prevent renaming default folders
    if (isDefaultFolder(folder)) {
      console.log('Cannot rename default folders');
      alert('Default folders cannot be renamed.');
      return;
    }
    
    console.log('📝 Starting folder rename for:', folderId, 'current name:', currentName);
    
    // Use custom modal for folder renaming
    setRenamingFolderId(folderId);
    setRenameFolderName(currentName);
    setFolderRenameVisible(true);
  }, [folders]);

  // Rename folder
  const renameFolderOptimistic = useCallback((folderId: string, newName: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // OPTIMISTIC UPDATE: Update folder name immediately in UI
    const oldName = folder.name;
    
    // Immediately update local state
    setFolders(prevFolders => prevFolders.map(f =>
      f.id === folderId
        ? { ...f, name: newName }
        : f
    ));
    console.log('Optimistically renamed folder from', oldName, 'to', newName);

    // Queue for background sync (only if it's not a temp ID)
    if (!folderId.startsWith('temp_')) {
      console.log('🔄 Queuing folder rename for database sync:', folderId, 'new name:', newName);
      try {
        dataSyncService.updateFolderOptimistic({
          id: folderId,
          name: newName,
          description: 'User created folder'
        });
        console.log('📝 Folder rename queued for sync:', folderId);
        
        // Log sync status for debugging
        setTimeout(() => {
          const status = dataSyncService.getSyncStatus();
          console.log('📊 Sync status after folder rename queue:', status);
        }, 100);
      } catch (error) {
        console.error('❌ Failed to queue folder rename:', error);
        // Rollback optimistic update
        setFolders(prevFolders => prevFolders.map(f =>
          f.id === folderId
            ? { ...f, name: oldName }
            : f
        ));
        alert('Failed to rename folder. Please try again.');
      }
    } else {
      console.log('⏭️ Skipping database update for temporary folder:', folderId);
    }
  }, [folders]);

  // Rename folder from modal
  const renameFolderFromModal = useCallback(() => {
    if (!renameFolderName.trim() || !renamingFolderId) return;
    
    console.log('📝 User entered new folder name:', renameFolderName.trim());
    renameFolderOptimistic(renamingFolderId, renameFolderName.trim());
    
    setFolderRenameVisible(false);
    setRenamingFolderId(null);
    setRenameFolderName('');
  }, [renameFolderName, renamingFolderId, renameFolderOptimistic]);

  // Cancel folder rename
  const cancelFolderRename = useCallback(() => {
    setFolderRenameVisible(false);
    setRenamingFolderId(null);
    setRenameFolderName('');
  }, []);

  // Delete folder
  const deleteFolder = useCallback(async (folderId: string, routinesInFolder: any[]) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    if (isDefaultFolder(folder)) {
      // Cannot delete default folders
      console.log('Cannot delete default folders');
      return;
    }

    // Check if folder has routines - show confirmation modal if it does
    if (routinesInFolder.length > 0) {
      setDeletingFolderId(folderId);
      setFolderDeleteConfirmVisible(true);
      return;
    }

    // If folder is empty, delete immediately
    await performFolderDeletion(folderId, routinesInFolder);
  }, [folders]);

  // Perform folder deletion
  const performFolderDeletion = useCallback(async (folderId: string, routinesInFolder: any[]) => {
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return;

    // OPTIMISTIC UPDATE: Delete folder and all routines immediately from UI
    try {
      console.log('Starting optimistic deletion for folder:', folderId);
      
      // Store folder data for potential rollback
      const folderToDelete = { ...folder };
      
      // Immediately update local state - delete folder
      setFolders(prevFolders => prevFolders.filter(f => f.id !== folderId));
      console.log('Optimistically removed folder and', routinesInFolder.length, 'routines from UI');

      // Queue for background deletion (only if it's not a temp ID)
      if (!folderId.startsWith('temp_')) {
        console.log('🔄 Queuing folder deletion for database sync:', folderId);
        try {
          dataSyncService.deleteFolderOptimistic(folderId);
          console.log('🗑️ Folder queued for deletion:', folderId);
          
          // Also queue deletion for all routines in the folder
          routinesInFolder.forEach(routine => {
            if (!routine.id.startsWith('temp_')) {
              dataSyncService.deleteRoutineOptimistic(routine.id);
              console.log('🗑️ Routine queued for deletion:', routine.id);
            }
          });
          
          // Log sync status for debugging
          setTimeout(() => {
            const status = dataSyncService.getSyncStatus();
            console.log('📊 Sync status after folder deletion queue:', status);
          }, 100);
        } catch (error) {
          console.error('❌ Failed to queue folder deletion:', error);
          // Rollback optimistic update
          setFolders(prevFolders => [...prevFolders, folderToDelete]);
          throw new Error('Failed to delete folder. Please try again.');
        }
      } else {
        console.log('⏭️ Skipping database deletion for temporary folder:', folderId);
      }
      
    } catch (error) {
      console.error('Error in optimistic folder deletion:', error);
      alert('Failed to delete folder. Please try again.');
    }
  }, [folders]);

  // Utility function to check if a folder is a default folder
  const isDefaultFolder = useCallback((folder: Folder) => {
    return folder.isDefault === true;
  }, []);

  // Show folder options
  const showFolderOptions = useCallback((folder: Folder, onShowOptions: (options: any[], title: string) => void) => {
    const isMyRoutines = folder.name === 'My Routines';
    const options: Array<{text: string; onPress: () => Promise<void>; isDelete?: boolean}> = [];
    
    // Add rename option for non-My Routines folders
    if (!isMyRoutines) {
      options.push({
        text: 'Rename Folder',
        onPress: async () => startRenamingFolder(folder.id, folder.name)
      });
    }
    
    // Add delete option for non-My Routines folders  
    if (!isMyRoutines) {
      options.push({
        text: 'Delete Folder',
        onPress: async () => {
          // This will be handled by the parent component passing routines
          await deleteFolder(folder.id, []);
        },
        isDelete: true
      });
    }
    
    // Add new routine option
    options.push({
      text: 'Add New Routine',
      onPress: async () => {
        // This will be handled by the parent component
      }
    });
    
    onShowOptions(options, folder.name);
  }, [startRenamingFolder, deleteFolder]);

  return {
    // State
    folders,
    folderCreationVisible,
    newFolderName,
    folderRenameVisible,
    renamingFolderId,
    renameFolderName,
    collapsedFolders,
    folderDeleteConfirmVisible,
    deletingFolderId,

    // Actions
    fetchFolders,
    createFolder,
    toggleFolderCollapse,
    startRenamingFolder,
    renameFolderOptimistic,
    renameFolderFromModal,
    cancelFolderRename,
    deleteFolder,
    performFolderDeletion,
    isDefaultFolder,
    showFolderOptions,

    // Setters
    setFolders,
    setFolderCreationVisible,
    setNewFolderName,
    setFolderRenameVisible,
    setRenamingFolderId,
    setRenameFolderName,
    setFolderDeleteConfirmVisible,
    setDeletingFolderId,
  };
};