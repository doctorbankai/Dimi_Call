// File Manager Types

export interface FileNode {
  id: string;                    // UUID unique
  name: string;                  // Nom du fichier/dossier
  path: string;                  // Chemin complet (ex: "C:\DimiCall\Documents\file.pdf")
  type: 'file' | 'folder';
  size: number;                  // Taille en bytes
  mimeType: string;              // Type MIME (ex: "application/pdf")
  extension: string;             // Extension (ex: ".pdf")
  createdAt: Date;
  modifiedAt: Date;
  tags: string[];                // Tags associés
  thumbnail?: string;            // URL de la miniature (si applicable)
  attachments: {
    contacts: string[];          // IDs des contacts
    calls: string[];             // IDs des appels
  };
}

export interface FileSystemState {
  rootPath: string;              // "C:\DimiCall"
  currentPath: string;
  files: FileNode[];             // Fichiers du dossier actuel
  expandedFolders: Set<string>;  // Dossiers ouverts dans le tree
  cache: Map<string, FileNode[]>; // Cache des dossiers chargés
}

export interface FileOperation {
  type: 'create' | 'delete' | 'rename' | 'copy' | 'move' | 'upload';
  source?: string;
  destination?: string;
  items: FileNode[];
  timestamp: Date;
}

export enum FileErrorType {
  NOT_FOUND = 'FILE_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DISK_FULL = 'DISK_FULL',
  INVALID_NAME = 'INVALID_NAME',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  OPERATION_FAILED = 'OPERATION_FAILED',
}

export interface FileError {
  type: FileErrorType;
  message: string;
  path?: string;
  details?: any;
}

export type ViewMode = 'grid' | 'list' | 'details';

export type FileFilterType = 'all' | 'documents' | 'images' | 'videos' | 'audio' | 'archives';

// IPC Channel Names
export const FILE_IPC_CHANNELS = {
  LIST_DIRECTORY: 'file:list-directory',
  CREATE_FOLDER: 'file:create-folder',
  DELETE_ITEM: 'file:delete-item',
  RENAME_ITEM: 'file:rename-item',
  COPY_ITEM: 'file:copy-item',
  MOVE_ITEM: 'file:move-item',
  UPLOAD_FILES: 'file:upload-files',
  OPEN_LOCATION: 'file:open-location',
  GET_FILE_INFO: 'file:get-file-info',
} as const;

// IPC Request/Response Types
export interface ListDirectoryRequest {
  path: string;
}

export interface ListDirectoryResponse {
  success: boolean;
  files?: FileNode[];
  error?: FileError;
}

export interface CreateFolderRequest {
  path: string;
  name: string;
}

export interface CreateFolderResponse {
  success: boolean;
  folder?: FileNode;
  error?: FileError;
}

export interface DeleteItemRequest {
  path: string;
}

export interface DeleteItemResponse {
  success: boolean;
  error?: FileError;
}

export interface RenameItemRequest {
  path: string;
  newName: string;
}

export interface RenameItemResponse {
  success: boolean;
  newPath?: string;
  error?: FileError;
}

export interface CopyItemRequest {
  source: string;
  destination: string;
}

export interface CopyItemResponse {
  success: boolean;
  error?: FileError;
}

export interface MoveItemRequest {
  source: string;
  destination: string;
}

export interface MoveItemResponse {
  success: boolean;
  error?: FileError;
}

export interface UploadFilesRequest {
  files: Array<{ name: string; data: Uint8Array | Buffer; path: string }>;
  destination: string;
}

export interface UploadFilesResponse {
  success: boolean;
  uploadedFiles?: FileNode[];
  error?: FileError;
}

export interface GetFileInfoRequest {
  path: string;
}

export interface GetFileInfoResponse {
  success: boolean;
  file?: FileNode;
  error?: FileError;
}

// Extend ElectronAPI with file operations
declare global {
  interface Window {
    electronAPI: {
      // File operations
      listDirectory: (path: string) => Promise<ListDirectoryResponse>;
      createFolder: (path: string, name: string) => Promise<CreateFolderResponse>;
      deleteItem: (path: string) => Promise<DeleteItemResponse>;
      renameItem: (path: string, newName: string) => Promise<RenameItemResponse>;
      copyItem: (source: string, destination: string) => Promise<CopyItemResponse>;
      moveItem: (source: string, destination: string) => Promise<MoveItemResponse>;
      uploadFiles: (files: Array<{ name: string; data: Uint8Array | Buffer; path: string }>, destination: string) => Promise<UploadFilesResponse>;
      openLocation: (path: string) => Promise<{ success: boolean; error?: string }>;
      getFileInfo: (path: string) => Promise<GetFileInfoResponse>;
      showItemInFolder?: (path: string) => void;
      closeApp?: () => Promise<void>;
    };
  }
}
