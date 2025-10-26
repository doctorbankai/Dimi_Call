// File Handlers for Electron IPC

import { ipcMain, shell } from 'electron';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Storage directory
const STORAGE_DIR = 'C:\\DimiCall';

/**
 * Ensure the storage directory exists
 */
async function ensureStorageDirectory(): Promise<void> {
  try {
    await fs.access(STORAGE_DIR);
  } catch {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
    console.log(`✅ Created storage directory: ${STORAGE_DIR}`);
  }
}

/**
 * Generate a stable ID from file path
 */
function generateFileId(filePath: string): string {
  // Use a hash of the file path to generate a stable ID
  return crypto.createHash('md5').update(filePath).digest('hex');
}

/**
 * Get file stats and convert to FileNode
 */
async function getFileNode(filePath: string): Promise<any> {
  const stats = await fs.stat(filePath);
  const name = path.basename(filePath);
  const extension = path.extname(filePath);
  
  return {
    id: generateFileId(filePath),
    name,
    path: filePath,
    type: stats.isDirectory() ? 'folder' : 'file',
    size: stats.size,
    mimeType: getMimeType(extension),
    extension,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
    tags: [],
    attachments: {
      contacts: [],
      calls: [],
    },
  };
}

/**
 * Get MIME type from extension
 */
function getMimeType(extension: string): string {
  const ext = extension.toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.csv': 'text/csv',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.zip': 'application/zip',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Validate path is within storage directory
 */
function isValidPath(targetPath: string): boolean {
  const normalized = path.normalize(targetPath).replace(/\//g, '\\');
  const storageNormalized = path.normalize(STORAGE_DIR).replace(/\//g, '\\');
  return normalized.startsWith(storageNormalized) || normalized === storageNormalized;
}

/**
 * Register all file IPC handlers
 */
export function registerFileHandlers(): void {
  // Ensure storage directory exists on startup
  ensureStorageDirectory().catch(console.error);

  /**
   * List directory contents
   */
  ipcMain.handle('file:list-directory', async (_event, targetPath: string) => {
    try {
      console.log(`📂 [FILE] Listing directory: ${targetPath}`);
      
      if (!isValidPath(targetPath)) {
        return {
          success: false,
          error: {
            type: 'PERMISSION_DENIED',
            message: 'Access denied: Path is outside storage directory',
            path: targetPath,
          },
        };
      }

      const entries = await fs.readdir(targetPath, { withFileTypes: true });
      const files = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = path.join(targetPath, entry.name);
          return getFileNode(fullPath);
        })
      );

      console.log(`✅ [FILE] Listed ${files.length} items`);
      return { success: true, files };
    } catch (error: any) {
      console.error(`❌ [FILE] Error listing directory:`, error);
      
      if (error.code === 'ENOENT') {
        return {
          success: false,
          error: {
            type: 'FILE_NOT_FOUND',
            message: 'Directory not found',
            path: targetPath,
          },
        };
      }
      
      return {
        success: false,
        error: {
          type: 'OPERATION_FAILED',
          message: error.message || 'Failed to list directory',
          path: targetPath,
        },
      };
    }
  });

  /**
   * Create folder
   */
  ipcMain.handle('file:create-folder', async (_event, targetPath: string, name: string) => {
    try {
      console.log(`📁 [FILE] Creating folder: ${name} in ${targetPath}`);
      
      if (!isValidPath(targetPath)) {
        return {
          success: false,
          error: {
            type: 'PERMISSION_DENIED',
            message: 'Access denied: Path is outside storage directory',
            path: targetPath,
          },
        };
      }

      // Sanitize folder name
      const sanitizedName = name.replace(/[<>:"/\\|?*]/g, '_');
      const folderPath = path.join(targetPath, sanitizedName);

      // Check if folder already exists
      try {
        await fs.access(folderPath);
        return {
          success: false,
          error: {
            type: 'ALREADY_EXISTS',
            message: 'A folder with this name already exists',
            path: folderPath,
          },
        };
      } catch {
        // Folder doesn't exist, proceed with creation
      }

      await fs.mkdir(folderPath, { recursive: true });
      const folder = await getFileNode(folderPath);

      console.log(`✅ [FILE] Created folder: ${folderPath}`);
      return { success: true, folder };
    } catch (error: any) {
      console.error(`❌ [FILE] Error creating folder:`, error);
      return {
        success: false,
        error: {
          type: 'OPERATION_FAILED',
          message: error.message || 'Failed to create folder',
          path: targetPath,
        },
      };
    }
  });

  /**
   * Delete item (file or folder)
   */
  ipcMain.handle('file:delete-item', async (_event, targetPath: string) => {
    try {
      console.log(`🗑️ [FILE] Deleting item: ${targetPath}`);
      
      if (!isValidPath(targetPath)) {
        return {
          success: false,
          error: {
            type: 'PERMISSION_DENIED',
            message: 'Access denied: Path is outside storage directory',
            path: targetPath,
          },
        };
      }

      const stats = await fs.stat(targetPath);
      
      if (stats.isDirectory()) {
        await fs.rm(targetPath, { recursive: true, force: true });
      } else {
        await fs.unlink(targetPath);
      }

      console.log(`✅ [FILE] Deleted item: ${targetPath}`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ [FILE] Error deleting item:`, error);
      
      if (error.code === 'ENOENT') {
        return {
          success: false,
          error: {
            type: 'FILE_NOT_FOUND',
            message: 'File or folder not found',
            path: targetPath,
          },
        };
      }
      
      return {
        success: false,
        error: {
          type: 'OPERATION_FAILED',
          message: error.message || 'Failed to delete item',
          path: targetPath,
        },
      };
    }
  });

  /**
   * Rename item
   */
  ipcMain.handle('file:rename-item', async (_event, targetPath: string, newName: string) => {
    try {
      console.log(`✏️ [FILE] Renaming item: ${targetPath} to ${newName}`);
      
      if (!isValidPath(targetPath)) {
        return {
          success: false,
          error: {
            type: 'PERMISSION_DENIED',
            message: 'Access denied: Path is outside storage directory',
            path: targetPath,
          },
        };
      }

      // Sanitize new name
      const sanitizedName = newName.replace(/[<>:"/\\|?*]/g, '_');
      const directory = path.dirname(targetPath);
      const newPath = path.join(directory, sanitizedName);

      // Check if target already exists
      try {
        await fs.access(newPath);
        return {
          success: false,
          error: {
            type: 'ALREADY_EXISTS',
            message: 'An item with this name already exists',
            path: newPath,
          },
        };
      } catch {
        // Target doesn't exist, proceed with rename
      }

      await fs.rename(targetPath, newPath);

      console.log(`✅ [FILE] Renamed item to: ${newPath}`);
      return { success: true, newPath };
    } catch (error: any) {
      console.error(`❌ [FILE] Error renaming item:`, error);
      
      if (error.code === 'ENOENT') {
        return {
          success: false,
          error: {
            type: 'FILE_NOT_FOUND',
            message: 'File or folder not found',
            path: targetPath,
          },
        };
      }
      
      return {
        success: false,
        error: {
          type: 'OPERATION_FAILED',
          message: error.message || 'Failed to rename item',
          path: targetPath,
        },
      };
    }
  });

  /**
   * Copy item
   */
  ipcMain.handle('file:copy-item', async (_event, source: string, destination: string) => {
    try {
      console.log(`📋 [FILE] Copying item: ${source} to ${destination}`);
      
      if (!isValidPath(source) || !isValidPath(destination)) {
        return {
          success: false,
          error: {
            type: 'PERMISSION_DENIED',
            message: 'Access denied: Path is outside storage directory',
          },
        };
      }

      const stats = await fs.stat(source);
      const sourceName = path.basename(source);
      const targetPath = path.join(destination, sourceName);

      if (stats.isDirectory()) {
        await fs.cp(source, targetPath, { recursive: true });
      } else {
        await fs.copyFile(source, targetPath);
      }

      console.log(`✅ [FILE] Copied item to: ${targetPath}`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ [FILE] Error copying item:`, error);
      return {
        success: false,
        error: {
          type: 'OPERATION_FAILED',
          message: error.message || 'Failed to copy item',
        },
      };
    }
  });

  /**
   * Move item
   */
  ipcMain.handle('file:move-item', async (_event, source: string, destination: string) => {
    try {
      console.log(`🚚 [FILE] Moving item: ${source} to ${destination}`);
      
      if (!isValidPath(source) || !isValidPath(destination)) {
        return {
          success: false,
          error: {
            type: 'PERMISSION_DENIED',
            message: 'Access denied: Path is outside storage directory',
          },
        };
      }

      const sourceName = path.basename(source);
      const targetPath = path.join(destination, sourceName);

      await fs.rename(source, targetPath);

      console.log(`✅ [FILE] Moved item to: ${targetPath}`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ [FILE] Error moving item:`, error);
      return {
        success: false,
        error: {
          type: 'OPERATION_FAILED',
          message: error.message || 'Failed to move item',
        },
      };
    }
  });

  /**
   * Upload files
   */
  ipcMain.handle('file:upload-files', async (_event, files: Array<{ name: string; data: Uint8Array | Buffer; path: string }>, destination: string) => {
    try {
      console.log(`📤 [FILE] Uploading ${files.length} files to: ${destination}`);
      
      if (!isValidPath(destination)) {
        return {
          success: false,
          error: {
            type: 'PERMISSION_DENIED',
            message: 'Access denied: Path is outside storage directory',
          },
        };
      }

      const uploadedFiles = [];

      for (const file of files) {
        const targetPath = path.join(destination, file.name);
        await fs.writeFile(targetPath, file.data);
        const fileNode = await getFileNode(targetPath);
        uploadedFiles.push(fileNode);
      }

      console.log(`✅ [FILE] Uploaded ${uploadedFiles.length} files`);
      return { success: true, uploadedFiles };
    } catch (error: any) {
      console.error(`❌ [FILE] Error uploading files:`, error);
      return {
        success: false,
        error: {
          type: 'OPERATION_FAILED',
          message: error.message || 'Failed to upload files',
        },
      };
    }
  });

  /**
   * Open location in file explorer
   */
  ipcMain.handle('file:open-location', async (_event, targetPath: string) => {
    try {
      console.log(`🔍 [FILE] Opening location: ${targetPath}`);
      
      // Ensure directory exists
      if (!fsSync.existsSync(targetPath)) {
        await fs.mkdir(targetPath, { recursive: true });
        console.log(`✅ [FILE] Created directory: ${targetPath}`);
      }

      await shell.openPath(targetPath);
      console.log(`✅ [FILE] Opened location: ${targetPath}`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ [FILE] Error opening location:`, error);
      return {
        success: false,
        error: error.message || 'Failed to open location',
      };
    }
  });

  /**
   * Get file info
   */
  ipcMain.handle('file:get-file-info', async (_event, targetPath: string) => {
    try {
      console.log(`ℹ️ [FILE] Getting file info: ${targetPath}`);
      
      if (!isValidPath(targetPath)) {
        return {
          success: false,
          error: {
            type: 'PERMISSION_DENIED',
            message: 'Access denied: Path is outside storage directory',
            path: targetPath,
          },
        };
      }

      const file = await getFileNode(targetPath);

      console.log(`✅ [FILE] Got file info for: ${targetPath}`);
      return { success: true, file };
    } catch (error: any) {
      console.error(`❌ [FILE] Error getting file info:`, error);
      
      if (error.code === 'ENOENT') {
        return {
          success: false,
          error: {
            type: 'FILE_NOT_FOUND',
            message: 'File or folder not found',
            path: targetPath,
          },
        };
      }
      
      return {
        success: false,
        error: {
          type: 'OPERATION_FAILED',
          message: error.message || 'Failed to get file info',
          path: targetPath,
        },
      };
    }
  });

  /**
   * Get file by ID (searches through storage directory)
   * Since IDs are now hash-based, we need to search recursively
   */
  ipcMain.handle('file:get-file-by-id', async (_event, fileId: string) => {
    try {
      console.log(`🔍 [FILE] Searching for file with ID: ${fileId}`);
      
      // Recursive function to search for file by ID
      async function searchForFile(dir: string): Promise<any | null> {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            try {
              // Generate ID for this path and check if it matches
              const pathId = generateFileId(fullPath);
              
              if (pathId === fileId) {
                // Found it! Get the full file node
                const fileNode = await getFileNode(fullPath);
                return fileNode;
              }
              
              // If it's a directory, search recursively
              if (entry.isDirectory()) {
                const found = await searchForFile(fullPath);
                if (found) return found;
              }
            } catch (err) {
              // Skip files we can't access
              continue;
            }
          }
          
          return null;
        } catch (error) {
          console.error(`Error searching directory ${dir}:`, error);
          return null;
        }
      }
      
      const file = await searchForFile(STORAGE_DIR);
      
      if (file) {
        console.log(`✅ [FILE] Found file: ${file.name}`);
        return { success: true, file };
      } else {
        console.log(`⚠️ [FILE] File not found with ID: ${fileId}`);
        return {
          success: false,
          error: {
            type: 'FILE_NOT_FOUND',
            message: 'File not found',
          },
        };
      }
    } catch (error: any) {
      console.error(`❌ [FILE] Error searching for file:`, error);
      return {
        success: false,
        error: {
          type: 'OPERATION_FAILED',
          message: error.message || 'Failed to search for file',
        },
      };
    }
  });

  console.log('✅ [FILE] File handlers registered');
}

  /**
   * Open file with default application
   */
  ipcMain.handle('file:open-file', async (_event, filePath: string) => {
    try {
      console.log(`🚀 [FILE] Opening file: ${filePath}`);
      
      if (!isValidPath(filePath)) {
        return {
          success: false,
          error: 'Access denied: Path is outside storage directory',
        };
      }

      await shell.openPath(filePath);
      console.log(`✅ [FILE] Opened file: ${filePath}`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ [FILE] Error opening file:`, error);
      return {
        success: false,
        error: error.message || 'Failed to open file',
      };
    }
  });

  /**
   * Show file in folder/explorer
   */
  ipcMain.handle('file:show-in-folder', async (_event, filePath: string) => {
    try {
      console.log(`📂 [FILE] Showing in folder: ${filePath}`);
      
      if (!isValidPath(filePath)) {
        return {
          success: false,
          error: 'Access denied: Path is outside storage directory',
        };
      }

      shell.showItemInFolder(filePath);
      console.log(`✅ [FILE] Showed in folder: ${filePath}`);
      return { success: true };
    } catch (error: any) {
      console.error(`❌ [FILE] Error showing in folder:`, error);
      return {
        success: false,
        error: error.message || 'Failed to show in folder',
      };
    }
  });
