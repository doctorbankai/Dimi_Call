// File Manager Service - Placeholder for file system operations

import { 
  FileNode, 
  FileError, 
  FileErrorType,
  ListDirectoryResponse,
  CreateFolderResponse,
  DeleteItemResponse,
  RenameItemResponse,
  CopyItemResponse,
  MoveItemResponse,
  UploadFilesResponse,
  GetFileInfoResponse
} from '@/types/fileManager';

/**
 * List all files and folders in a directory
 */
export async function listDirectory(path: string): Promise<ListDirectoryResponse> {
  try {
    if (!window.electronAPI?.listDirectory) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.listDirectory(path);
  } catch (error) {
    return {
      success: false,
      error: {
        type: FileErrorType.OPERATION_FAILED,
        message: error instanceof Error ? error.message : 'Failed to list directory',
        path,
      },
    };
  }
}

/**
 * Create a new folder
 */
export async function createFolder(path: string, name: string): Promise<CreateFolderResponse> {
  try {
    if (!window.electronAPI?.createFolder) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.createFolder(path, name);
  } catch (error) {
    return {
      success: false,
      error: {
        type: FileErrorType.OPERATION_FAILED,
        message: error instanceof Error ? error.message : 'Failed to create folder',
        path,
      },
    };
  }
}

/**
 * Delete a file or folder
 */
export async function deleteItem(path: string): Promise<DeleteItemResponse> {
  try {
    if (!window.electronAPI?.deleteItem) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.deleteItem(path);
  } catch (error) {
    return {
      success: false,
      error: {
        type: FileErrorType.OPERATION_FAILED,
        message: error instanceof Error ? error.message : 'Failed to delete item',
        path,
      },
    };
  }
}

/**
 * Rename a file or folder
 */
export async function renameItem(path: string, newName: string): Promise<RenameItemResponse> {
  try {
    if (!window.electronAPI?.renameItem) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.renameItem(path, newName);
  } catch (error) {
    return {
      success: false,
      error: {
        type: FileErrorType.OPERATION_FAILED,
        message: error instanceof Error ? error.message : 'Failed to rename item',
        path,
      },
    };
  }
}

/**
 * Copy a file or folder
 */
export async function copyItem(source: string, destination: string): Promise<CopyItemResponse> {
  try {
    if (!window.electronAPI?.copyItem) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.copyItem(source, destination);
  } catch (error) {
    return {
      success: false,
      error: {
        type: FileErrorType.OPERATION_FAILED,
        message: error instanceof Error ? error.message : 'Failed to copy item',
      },
    };
  }
}

/**
 * Move a file or folder
 */
export async function moveItem(source: string, destination: string): Promise<MoveItemResponse> {
  try {
    if (!window.electronAPI?.moveItem) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.moveItem(source, destination);
  } catch (error) {
    return {
      success: false,
      error: {
        type: FileErrorType.OPERATION_FAILED,
        message: error instanceof Error ? error.message : 'Failed to move item',
      },
    };
  }
}

/**
 * Upload files to a destination folder
 */
export async function uploadFiles(
  files: Array<{ name: string; data: Uint8Array | Buffer; path: string }>,
  destination: string
): Promise<UploadFilesResponse> {
  try {
    if (!window.electronAPI?.uploadFiles) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.uploadFiles(files, destination);
  } catch (error) {
    return {
      success: false,
      error: {
        type: FileErrorType.OPERATION_FAILED,
        message: error instanceof Error ? error.message : 'Failed to upload files',
      },
    };
  }
}

/**
 * Get file information
 */
export async function getFileInfo(path: string): Promise<GetFileInfoResponse> {
  try {
    if (!window.electronAPI?.getFileInfo) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.getFileInfo(path);
  } catch (error) {
    return {
      success: false,
      error: {
        type: FileErrorType.OPERATION_FAILED,
        message: error instanceof Error ? error.message : 'Failed to get file info',
        path,
      },
    };
  }
}

/**
 * Open the storage location in file explorer
 */
export async function openStorageLocation(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!window.electronAPI?.openLocation) {
      throw new Error('Electron API not available');
    }
    return await window.electronAPI.openLocation('C:\\DimiCall');
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to open storage location',
    };
  }
}

/**
 * Ensure the storage directory exists
 */
export async function ensureStorageDirectory(): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await listDirectory('C:\\DimiCall');
    if (!result.success && result.error?.type === FileErrorType.NOT_FOUND) {
      // Directory doesn't exist, create it
      const createResult = await createFolder('C:\\', 'DimiCall');
      return {
        success: createResult.success,
        error: createResult.error?.message,
      };
    }
    return { success: result.success, error: result.error?.message };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ensure storage directory',
    };
  }
}

/**
 * Get the appropriate icon for a file extension
 */
export function getFileIcon(extension: string): string {
  const ext = extension.toLowerCase();
  
  // Images
  if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico'].includes(ext)) {
    return 'Image';
  }
  
  // Documents
  if (['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'].includes(ext)) {
    return 'FileText';
  }
  
  // Spreadsheets
  if (['.xls', '.xlsx', '.csv', '.ods'].includes(ext)) {
    return 'FileSpreadsheet';
  }
  
  // Videos
  if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'].includes(ext)) {
    return 'Video';
  }
  
  // Audio
  if (['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'].includes(ext)) {
    return 'Music';
  }
  
  // Archives
  if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(ext)) {
    return 'Archive';
  }
  
  // Code
  if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css', '.json', '.xml'].includes(ext)) {
    return 'Code';
  }
  
  // Default
  return 'File';
}

/**
 * Generate a thumbnail for an image file
 */
export async function generateThumbnail(path: string): Promise<string | null> {
  // TODO: Implement thumbnail generation
  // For now, return null and use the file path directly for images
  return null;
}

/**
 * Sanitize a filename by removing invalid characters
 */
export function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_');
}

/**
 * Validate if a path is within the DimiCall storage directory
 */
export function isValidPath(path: string): boolean {
  const normalized = path.replace(/\//g, '\\');
  return normalized.startsWith('C:\\DimiCall\\') || normalized === 'C:\\DimiCall';
}

/**
 * Check if a file is potentially dangerous
 */
export function isDangerousFile(filename: string): boolean {
  const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.ps1', '.vbs', '.msi', '.scr'];
  return DANGEROUS_EXTENSIONS.some(ext => filename.toLowerCase().endsWith(ext));
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get MIME type from file extension
 */
export function getMimeType(extension: string): string {
  const ext = extension.toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon',
    
    // Documents
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain',
    '.rtf': 'application/rtf',
    '.odt': 'application/vnd.oasis.opendocument.text',
    
    // Spreadsheets
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv',
    '.ods': 'application/vnd.oasis.opendocument.spreadsheet',
    
    // Videos
    '.mp4': 'video/mp4',
    '.avi': 'video/x-msvideo',
    '.mov': 'video/quicktime',
    '.wmv': 'video/x-ms-wmv',
    '.flv': 'video/x-flv',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
    
    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.flac': 'audio/flac',
    '.aac': 'audio/aac',
    
    // Archives
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
    '.bz2': 'application/x-bzip2',
    
    // Code
    '.js': 'text/javascript',
    '.ts': 'text/typescript',
    '.jsx': 'text/jsx',
    '.tsx': 'text/tsx',
    '.py': 'text/x-python',
    '.java': 'text/x-java',
    '.cpp': 'text/x-c++src',
    '.c': 'text/x-csrc',
    '.html': 'text/html',
    '.css': 'text/css',
    '.json': 'application/json',
    '.xml': 'application/xml',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

/**
 * Get file by ID from the file system
 * This searches through the storage directory to find a file by its ID
 */
export async function getFileById(fileId: string): Promise<FileNode | null> {
  try {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.getFileById) {
      // Fallback: try to get from localStorage cache if available
      const cached = localStorage.getItem(`file-cache-${fileId}`);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    }
    
    const result = await electronAPI.getFileById(fileId);
    if (result.success && result.file) {
      // Cache the file info
      localStorage.setItem(`file-cache-${fileId}`, JSON.stringify(result.file));
      return result.file;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting file by ID:', error);
    return null;
  }
}

/**
 * Generate a folder name for a contact
 * Format: "Prenom Nom - +33XXXXXXXXX" (human-readable)
 * The folder name includes the name for readability, but matching is done by phone number only
 */
export function generateContactFolderName(contact: {
  prenom?: string;
  nom?: string;
  telephone: string;
}): string {
  const prenom = contact.prenom?.trim() || '';
  const nom = contact.nom?.trim() || '';
  const telephone = contact.telephone?.trim() || '';
  
  console.log(`[generateContactFolderName] Input:`, { prenom, nom, telephone });
  
  // Build human-readable folder name
  let folderName = '';
  if (prenom || nom) {
    const parts = [prenom, nom].filter(Boolean);
    folderName = parts.join(' ') + ' - ' + telephone;
  } else {
    folderName = telephone;
  }
  
  // Sanitize the folder name (remove invalid characters for file systems)
  const sanitized = sanitizeFilename(folderName);
  console.log(`[generateContactFolderName] Output:`, sanitized);
  return sanitized;
}

/**
 * Create a folder for a contact if it doesn't exist
 * Returns the folder path
 */
export async function ensureContactFolder(contact: {
  id: string;
  prenom?: string;
  nom?: string;
  telephone: string;
}): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const folderName = generateContactFolderName(contact);
    const folderPath = `C:\\DimiCall\\${folderName}`;
    
    console.log(`[FileManager] Vérification dossier: ${folderPath}`);
    
    // Check if folder already exists
    const checkResult = await listDirectory(folderPath);
    if (checkResult.success) {
      // Folder already exists
      console.log(`[FileManager] Dossier existe déjà: ${folderPath}`);
      return { success: true, path: folderPath };
    }
    
    console.log(`[FileManager] Création du dossier: ${folderPath}`);
    
    // Create the folder
    const createResult = await createFolder('C:\\DimiCall', folderName);
    
    // If creation succeeded OR folder already exists, it's a success
    if (createResult.success) {
      console.log(`[FileManager] Dossier créé avec succès: ${folderPath}`);
      return { success: true, path: folderPath };
    } else if (createResult.error?.type === 'ALREADY_EXISTS') {
      // Folder was created between our check and create attempt
      console.log(`[FileManager] Dossier existe déjà (race condition): ${folderPath}`);
      return { success: true, path: folderPath };
    }
    
    console.error(`[FileManager] Échec création dossier:`, createResult.error);
    return {
      success: false,
      error: createResult.error?.message || 'Failed to create contact folder',
    };
  } catch (error) {
    console.error(`[FileManager] Exception lors de ensureContactFolder:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to ensure contact folder',
    };
  }
}

/**
 * Create folders for multiple contacts in batch
 * This is more efficient than creating them one by one
 */
export async function ensureContactFolders(contacts: Array<{
  id: string;
  prenom?: string;
  nom?: string;
  telephone: string;
}>): Promise<{ success: boolean; created: number; errors: number }> {
  console.log(`[FileManager] ensureContactFolders appelé avec ${contacts.length} contacts`);
  let created = 0;
  let errors = 0;
  
  // Process contacts in parallel (but limit concurrency to avoid overwhelming the system)
  const BATCH_SIZE = 10;
  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    const batch = contacts.slice(i, i + BATCH_SIZE);
    console.log(`[FileManager] Traitement batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(contacts.length / BATCH_SIZE)} (${batch.length} contacts)`);
    
    const results = await Promise.all(
      batch.map(contact => ensureContactFolder(contact))
    );
    
    results.forEach((result, index) => {
      if (result.success) {
        created++;
        console.log(`[FileManager] ✅ Dossier créé/vérifié: ${result.path}`);
      } else {
        errors++;
        console.error(`[FileManager] ❌ Erreur pour ${batch[index].telephone}:`, result.error);
      }
    });
  }
  
  console.log(`[FileManager] Résultat final: ${created} créés, ${errors} erreurs`);
  return {
    success: errors === 0,
    created,
    errors,
  };
}
