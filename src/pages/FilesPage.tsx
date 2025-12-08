// Files Manager Page - Complete Implementation with Tree and Preview

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FileNode, ViewMode, FileFilterType } from '@/types/fileManager';
import {
  listDirectory,
  openStorageLocation,
  createFolder,
  deleteItem,
  renameItem,
  copyItem,
  moveItem,
  uploadFiles,
  formatFileSize,
} from '@/services/fileManagerService';
import { getTags } from '@/services/fileTagService';
import { attachToContact, attachToCall } from '@/services/fileAttachmentService';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Folder,
  File,
  Image,
  FileText,
  FileSpreadsheet,
  Video,
  Music,
  Archive,
  Code,
  Loader2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FileManagerToolbar } from '@/components/FileManagerToolbar';
import { FileContextMenu } from '@/components/FileContextMenu';
import { FileTree } from '@/components/FileTree';
import { FilePreview } from '@/components/FilePreview';
import { CreateFolderDialog } from '@/components/CreateFolderDialog';
import { RenameDialog } from '@/components/RenameDialog';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { TagDialog } from '@/components/TagDialog';
import { AttachmentDialog } from '@/components/AttachmentDialog';
import { Contact } from '@/types';
import { localDbService } from '@/services/localDbService';
import type { StatusEventRecord } from '@/types/statusEvent';

const STORAGE_DIR = 'C:\\DimiCall';

interface FilesPageProps {
  contacts?: Contact[];
}

// Helper function to normalize phone numbers
const normalizePhoneNumber = (phone: string): string => {
  return phone.replace(/[\s\-\.]/g, '');
};

// Transform events to contacts (same logic as AnnuairePage)
const transformEventsToContacts = (events: StatusEventRecord[]): Contact[] => {
  // Group by phone number to avoid duplicates
  const grouped = new Map<string, StatusEventRecord[]>();
  
  for (const event of events) {
    const telephone = event.telephone?.trim();
    if (!telephone) continue;
    
    const normalizedPhone = normalizePhoneNumber(telephone);
    
    if (!grouped.has(normalizedPhone)) {
      grouped.set(normalizedPhone, []);
    }
    grouped.get(normalizedPhone)!.push(event);
  }

  return Array.from(grouped.values())
    .map((group) => {
      // Sort events by timestamp (most recent first)
      const sorted = group.sort((a, b) => {
        const aTime = new Date(a.applied_at || 0).getTime();
        const bTime = new Date(b.applied_at || 0).getTime();
        return bTime - aTime;
      });

      const latest = sorted[0];
      const prenom = latest.prenom?.trim() || '';
      const nom = latest.nom?.trim() || '';
      const telephone = latest.telephone?.trim() || '';
      const email = latest.email?.trim() || latest.mail?.trim() || '';

      // Generate stable contact ID based on phone number
      const contactId = `contact-${normalizePhoneNumber(telephone)}`;

      return {
        id: contactId,
        prenom,
        nom,
        telephone,
        email,
        statut: latest.new_status || '',
        commentaire: latest.commentaire || '',
        numeroLigne: 0,
      } as Contact;
    })
    .filter((contact): contact is Contact => !!contact.telephone)
    .sort((a, b) => {
      const nameA = `${a.prenom} ${a.nom}`.trim();
      const nameB = `${b.prenom} ${b.nom}`.trim();
      return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
    });
};

export const FilesPage: React.FC<FilesPageProps> = ({ contacts: propContacts = [] }) => {
  const [contactsFromDb, setContactsFromDb] = useState<Contact[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(STORAGE_DIR);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  
  // Load contacts from database (same as AnnuairePage)
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const events = await localDbService.getAll();
        const transformed = transformEventsToContacts(events);
        setContactsFromDb(transformed);
      } catch (error) {
        console.error('Error loading contacts from database:', error);
      }
    };
    
    loadContacts();
  }, []);
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('dimicall-files-view-mode');
      return (saved as ViewMode) || 'grid';
    } catch {
      return 'grid';
    }
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FileFilterType>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [clipboard, setClipboard] = useState<{ items: FileNode[]; operation: 'copy' | 'cut' } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([STORAGE_DIR]));
  const [showPreview, setShowPreview] = useState(true);

  // Dialog states
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);
  const [attachmentType, setAttachmentType] = useState<'contact' | 'call'>('contact');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist view mode
  useEffect(() => {
    try {
      localStorage.setItem('dimicall-files-view-mode', viewMode);
    } catch {}
  }, [viewMode]);

  // Load directory contents
  const loadDirectory = useCallback(async (path: string) => {
    setIsLoading(true);
    try {
      const result = await listDirectory(path);

      if (result.success && result.files) {
        const filesWithTags = result.files.map(file => ({
          ...file,
          tags: getTags(file.id),
        }));
        setFiles(filesWithTags);
        setCurrentPath(path);
      } else {
        toast.error(result.error?.message || 'Failed to load directory');
      }
    } catch (error) {
      console.error('Error loading directory:', error);
      toast.error('Failed to load directory');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDirectory(STORAGE_DIR);
  }, [loadDirectory]);

  // Navigate to folder
  const navigateToFolder = (folder: FileNode) => {
    if (folder.type === 'folder') {
      loadDirectory(folder.path);
    }
  };

  // Toggle folder expansion in tree
  const handleToggleExpand = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Open storage location
  const handleOpenLocation = async () => {
    const result = await openStorageLocation();
    if (result.success) {
      toast.success('Opened storage location');
    } else {
      toast.error(result.error || 'Failed to open location');
    }
  };

  // Create folder
  const handleCreateFolder = async (name: string) => {
    const result = await createFolder(currentPath, name);
    if (result.success) {
      toast.success(`Created folder "${name}"`);
      loadDirectory(currentPath);
    } else {
      toast.error(result.error?.message || 'Failed to create folder');
    }
  };

  // Rename file/folder
  const handleRename = async (newName: string) => {
    if (!selectedFile) return;

    const result = await renameItem(selectedFile.path, newName);
    if (result.success) {
      toast.success(`Renamed to "${newName}"`);
      loadDirectory(currentPath);
      setSelectedFile(null);
    } else {
      toast.error(result.error?.message || 'Failed to rename');
    }
  };

  // Delete file/folder
  const handleDelete = async () => {
    if (!selectedFile) return;

    const result = await deleteItem(selectedFile.path);
    if (result.success) {
      toast.success(`Deleted "${selectedFile.name}"`);
      loadDirectory(currentPath);
      setSelectedFile(null);
    } else {
      toast.error(result.error?.message || 'Failed to delete');
    }
  };

  // Copy file/folder
  const handleCopy = (file: FileNode) => {
    setClipboard({ items: [file], operation: 'copy' });
    toast.success('Copied to clipboard');
  };

  // Cut file/folder
  const handleCut = (file: FileNode) => {
    setClipboard({ items: [file], operation: 'cut' });
    toast.success('Cut to clipboard');
  };

  // Paste file/folder
  const handlePaste = async () => {
    if (!clipboard) return;

    const file = clipboard.items[0];
    const operation = clipboard.operation === 'copy' ? copyItem : moveItem;

    const result = await operation(file.path, currentPath);
    if (result.success) {
      toast.success(`${clipboard.operation === 'copy' ? 'Copied' : 'Moved'} "${file.name}"`);
      setClipboard(null);
      loadDirectory(currentPath);
    } else {
      toast.error(result.error?.message || `Failed to ${clipboard.operation}`);
    }
  };

  // Upload files
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const filePromises = Array.from(selectedFiles).map(file => {
      return new Promise<{ name: string; data: any; path: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          resolve({
            name: file.name,
            data: new Uint8Array(arrayBuffer),
            path: file.name,
          });
        };
        reader.readAsArrayBuffer(file);
      });
    });

    const files = await Promise.all(filePromises);

    const result = await uploadFiles(files as any, currentPath);
    if (result.success) {
      toast.success(`Uploaded ${files.length} file(s)`);
      loadDirectory(currentPath);
    } else {
      toast.error(result.error?.message || 'Failed to upload files');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset dragging state when drag ends anywhere
  useEffect(() => {
    const handleDragEnd = () => {
      setIsDragging(false);
      dragCounterRef.current = 0;
    };

    document.addEventListener('dragend', handleDragEnd);
    return () => {
      document.removeEventListener('dragend', handleDragEnd);
    };
  }, []);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;

    const filePromises = Array.from(droppedFiles).map(file => {
      return new Promise<{ name: string; data: any; path: string }>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          resolve({
            name: file.name,
            data: new Uint8Array(arrayBuffer),
            path: file.name,
          });
        };
        reader.readAsArrayBuffer(file);
      });
    });

    const files = await Promise.all(filePromises);

    const result = await uploadFiles(files as any, currentPath);
    if (result.success) {
      toast.success(`Uploaded ${files.length} file(s)`);
      loadDirectory(currentPath);
    } else {
      toast.error(result.error?.message || 'Failed to upload files');
    }
  };

  // Attachment handlers
  const handleAttachToContact = (file: FileNode) => {
    setSelectedFile(file);
    setAttachmentType('contact');
    setIsAttachmentDialogOpen(true);
  };

  const handleAttachToCall = (file: FileNode) => {
    setSelectedFile(file);
    setAttachmentType('call');
    setIsAttachmentDialogOpen(true);
  };

  const handleAttachment = (targetId: string) => {
    if (!selectedFile) return;

    if (attachmentType === 'contact') {
      attachToContact(selectedFile.id, targetId);
      toast.success('Attached to contact');
    } else {
      attachToCall(selectedFile.id, targetId);
      toast.success('Attached to call');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedFile) {
        if (e.key === 'F2') {
          e.preventDefault();
          setIsRenameOpen(true);
        } else if (e.key === 'Delete') {
          e.preventDefault();
          setIsDeleteOpen(true);
        } else if (e.ctrlKey && e.key === 'c') {
          e.preventDefault();
          handleCopy(selectedFile);
        } else if (e.ctrlKey && e.key === 'x') {
          e.preventDefault();
          handleCut(selectedFile);
        }
      }

      if (e.ctrlKey && e.key === 'v' && clipboard) {
        e.preventDefault();
        handlePaste();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, clipboard]);

  // Filter files
  const filteredFiles = files.filter(file => {
    if (searchTerm && !file.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    if (filterType !== 'all') {
      const ext = file.extension.toLowerCase();
      switch (filterType) {
        case 'documents':
          return ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'].includes(ext);
        case 'images':
          return ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'].includes(ext);
        case 'videos':
          return ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'].includes(ext);
        case 'audio':
          return ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'].includes(ext);
        case 'archives':
          return ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(ext);
        default:
          return true;
      }
    }

    return true;
  });

  // Render file icon
  const renderFileIcon = (file: FileNode, size: 'sm' | 'md' = 'md') => {
    const iconSize = size === 'sm' ? 'h-5 w-5' : 'h-7 w-7';
    
    if (file.type === 'folder') {
      return <Folder className={cn(iconSize, "text-blue-500")} />;
    }

    const ext = file.extension.toLowerCase();

    if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'].includes(ext)) {
      return <Image className={cn(iconSize, "text-green-500")} />;
    }
    if (['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'].includes(ext)) {
      return <FileText className={cn(iconSize, "text-red-500")} />;
    }
    if (['.xls', '.xlsx', '.csv', '.ods'].includes(ext)) {
      return <FileSpreadsheet className={cn(iconSize, "text-emerald-500")} />;
    }
    if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'].includes(ext)) {
      return <Video className={cn(iconSize, "text-purple-500")} />;
    }
    if (['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'].includes(ext)) {
      return <Music className={cn(iconSize, "text-pink-500")} />;
    }
    if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(ext)) {
      return <Archive className={cn(iconSize, "text-orange-500")} />;
    }
    if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css', '.json', '.xml'].includes(ext)) {
      return <Code className={cn(iconSize, "text-cyan-500")} />;
    }

    return <File className={cn(iconSize, "text-muted-foreground")} />;
  };

  // Render file item
  const renderFileItem = (file: FileNode) => {
    const isSelected = selectedFile?.id === file.id;

    return (
      <FileContextMenu
        key={file.id}
        file={file}
        onOpen={() => navigateToFolder(file)}
        onRename={() => {
          setSelectedFile(file);
          setIsRenameOpen(true);
        }}
        onCopy={() => handleCopy(file)}
        onDelete={() => {
          setSelectedFile(file);
          setIsDeleteOpen(true);
        }}
      >
        <div
          className={cn(
            "cursor-pointer rounded-lg transition-all duration-200 group",
            viewMode === 'grid' && "flex flex-col items-center p-4 hover:bg-accent/50 hover:shadow-md border border-transparent hover:border-border",
            viewMode === 'list' && "flex items-center gap-3 p-3 rounded-md hover:bg-accent/50",
            viewMode === 'details' && "flex items-center gap-3 p-3 rounded-md hover:bg-accent/50",
            isSelected && "bg-accent border-border shadow-sm"
          )}
          onClick={() => setSelectedFile(file)}
          onDoubleClick={() => navigateToFolder(file)}
        >
          {viewMode === 'grid' ? (
            <>
              <div className={cn(
                "flex items-center justify-center w-16 h-16 rounded-xl mb-3 transition-transform group-hover:scale-105",
                isSelected ? "bg-primary/10" : "bg-muted/50"
              )}>
                {renderFileIcon(file, 'md')}
              </div>
              <div className="flex flex-col items-center w-full min-w-0">
                <span className="text-sm font-medium truncate w-full text-center">
                  {file.name}
                </span>
                {file.type === 'file' && (
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(file.size)}
                  </span>
                )}
                {file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 justify-center">
                    {file.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                    {file.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        +{file.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 transition-transform group-hover:scale-105",
                isSelected ? "bg-primary/10" : "bg-muted/50"
              )}>
                {renderFileIcon(file, 'sm')}
              </div>
              <div className={cn(
                "flex flex-col flex-1 min-w-0",
                viewMode === 'list' && "gap-1",
                viewMode === 'details' && "gap-0.5"
              )}>
                <span className="text-sm font-medium truncate">
                  {file.name}
                </span>
                {viewMode === 'list' && file.type === 'file' && (
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} • {new Date(file.modifiedAt).toLocaleDateString('fr-FR')}
                  </span>
                )}
                {file.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {file.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                    {file.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        +{file.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              {viewMode === 'details' && (
                <>
                  <span className="text-xs text-muted-foreground w-20 text-right">
                    {file.type === 'folder' ? 'Dossier' : file.extension}
                  </span>
                  <span className="text-xs text-muted-foreground w-24 text-right">
                    {file.type === 'file' ? formatFileSize(file.size) : '-'}
                  </span>
                  <span className="text-xs text-muted-foreground w-32 text-right">
                    {new Date(file.modifiedAt).toLocaleDateString('fr-FR')}
                  </span>
                </>
              )}
            </>
          )}
        </div>
      </FileContextMenu>
    );
  };

  // State for folder regeneration
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Smart folder regeneration: only create missing folders
  const handleRegenerateContactFolders = async () => {
    setIsRegenerating(true);
    try {
      console.log('🔄 [FilesPage] Starting smart folder regeneration...');
      
      // 1. Get all existing folders in DimiCall
      const dimiCallResult = await listDirectory(STORAGE_DIR);
      if (!dimiCallResult.success || !dimiCallResult.files) {
        toast.error('Impossible de lire le dossier DimiCall');
        return;
      }

      const existingFolders = new Set(
        dimiCallResult.files
          .filter(f => f.type === 'folder')
          .map(f => f.name.toLowerCase())
      );

      console.log(`📂 [FilesPage] Found ${existingFolders.size} existing folders`);

      // 2. Get all contacts from database
      const contacts = contactsFromDb.filter(c => c.telephone && (c.prenom || c.nom));
      console.log(`👥 [FilesPage] Found ${contacts.length} contacts with phone numbers`);

      // 3. Check which folders are missing
      const foldersToCreate: { name: string; contact: Contact }[] = [];
      
      for (const contact of contacts) {
        const folderName = `${contact.prenom || ''} ${contact.nom || ''}`.trim() + ` - ${contact.telephone}`;
        const normalizedName = folderName.toLowerCase();
        
        // Check if folder already exists (case-insensitive)
        if (!existingFolders.has(normalizedName)) {
          foldersToCreate.push({ name: folderName, contact });
        }
      }

      console.log(`✨ [FilesPage] Need to create ${foldersToCreate.length} missing folders`);

      if (foldersToCreate.length === 0) {
        toast.success('Tous les dossiers existent déjà !');
        return;
      }

      // 4. Create missing folders
      let created = 0;
      let failed = 0;

      for (const { name, contact } of foldersToCreate) {
        const result = await createFolder(STORAGE_DIR, name);
        if (result.success) {
          created++;
          console.log(`✅ [FilesPage] Created folder: ${name}`);
        } else {
          failed++;
          console.error(`❌ [FilesPage] Failed to create folder: ${name}`, result.error);
        }
      }

      // 5. Reload directory to show new folders
      await loadDirectory(currentPath);

      // 6. Show result
      if (failed === 0) {
        toast.success(`✅ ${created} dossier${created > 1 ? 's créés' : ' créé'} avec succès !`);
      } else {
        toast.warning(`⚠️ ${created} dossier${created > 1 ? 's créés' : ' créé'}, ${failed} échec${failed > 1 ? 's' : ''}`);
      }

    } catch (error) {
      console.error('❌ [FilesPage] Error regenerating folders:', error);
      toast.error('Erreur lors de la régénération des dossiers');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="flex h-full flex-col w-full overflow-hidden bg-white dark:bg-background text-foreground transition-colors">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Header aligné avec Appels */}
      <div className="bg-card border-b border-border/80">
        <div
          className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-2 sm:px-4 md:px-6 pt-2 pb-2 min-w-0"
          role="toolbar"
          aria-label="En-tête Fichiers"
        >
          <div className="flex flex-col gap-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">
              Gestionnaire de Fichiers
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerateContactFolders}
              disabled={isRegenerating || contactsFromDb.length === 0}
              title="Créer automatiquement les dossiers manquants pour tous les contacts"
              className="h-8 px-3 sm:px-4 gap-2 shadow-none bg-white dark:bg-card border-border/70"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Folder className="h-4 w-4" />
                  Régénérer dossiers
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-hidden">
        <FileManagerToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          filterType={filterType}
          onFilterChange={setFilterType}
          onOpenLocation={handleOpenLocation}
          onCreateFolder={() => setIsCreateFolderOpen(true)}
          onUploadFiles={handleUploadClick}
        />

        <div className="flex-1 px-6 pb-6 overflow-hidden relative bg-white dark:bg-background transition-colors">
          <ResizablePanelGroup direction="horizontal" className="h-full gap-2">
            {/* File Tree */}
            <ResizablePanel defaultSize={24} minSize={18} maxSize={32} className="min-w-0">
              <FileTree
                rootPath={STORAGE_DIR}
                currentPath={currentPath}
                onNavigate={loadDirectory}
                expandedFolders={expandedFolders}
                onToggleExpand={handleToggleExpand}
              />
            </ResizablePanel>

            <ResizableHandle
              withHandle
              className="group w-3 rounded-md bg-transparent hover:bg-primary/5 transition-colors after:bg-border after:opacity-70 hover:after:bg-primary/50 hover:after:opacity-100 focus-visible:after:opacity-100"
            />

            {/* Content View */}
            <ResizablePanel defaultSize={showPreview ? 50 : 76} minSize={40} className="min-w-0 flex flex-col relative">
              <ScrollArea
                className="flex-1 min-h-0"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="h-full flex flex-col min-h-0">
                  {isLoading ? (
                    <div className="flex items-center justify-center flex-1 min-h-[400px]">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Chargement...</p>
                      </div>
                    </div>
                  ) : filteredFiles.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-6 min-h-0">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="rounded-full bg-muted/70 p-6 mb-4">
                          <Folder className="h-12 w-12 text-primary/60" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Aucun fichier trouvé
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          {searchTerm
                            ? `Aucun résultat pour "${searchTerm}"`
                            : 'Zone de dépôt active sur toute la surface. Glissez-déposez vos fichiers ici ou utilisez le bouton « Téléverser ».'
                          }
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "p-6",
                        viewMode === 'grid' && "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4",
                        viewMode === 'list' && "space-y-1",
                        viewMode === 'details' && "space-y-1"
                      )}
                    >
                      {filteredFiles.map(renderFileItem)}
                    </div>
                  )}
                </div>
              </ScrollArea>
              {/* Modern Dropzone Overlay - Only on content panel */}
              {isDragging && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/5 backdrop-blur-sm border-2 border-dashed border-primary/50 rounded-lg pointer-events-none">
                  <div className="text-center space-y-3">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30">
                      <Upload className="h-8 w-8 text-primary animate-bounce" />
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-foreground">Déposez vos fichiers ici</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pour les ajouter à <span className="font-mono text-xs">{currentPath}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </ResizablePanel>

            {/* Preview Panel */}
            {showPreview && selectedFile && (
              <>
                <ResizableHandle
                  withHandle
                  className="group w-3 rounded-md bg-transparent hover:bg-primary/5 transition-colors after:bg-border after:opacity-70 hover:after:bg-primary/50 hover:after:opacity-100 focus-visible:after:opacity-100"
                />
                <ResizablePanel defaultSize={26} minSize={20} maxSize={40} className="min-w-0">
                  <FilePreview
                    file={selectedFile}
                    onClose={() => setShowPreview(false)}
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>

      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        onConfirm={handleCreateFolder}
      />

      <RenameDialog
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        file={selectedFile}
        onConfirm={handleRename}
      />

      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        file={selectedFile}
        onConfirm={handleDelete}
      />

      <TagDialog
        open={isTagDialogOpen}
        onOpenChange={setIsTagDialogOpen}
        file={selectedFile}
        onTagsChanged={() => loadDirectory(currentPath)}
      />

      <AttachmentDialog
        open={isAttachmentDialogOpen}
        onOpenChange={setIsAttachmentDialogOpen}
        file={selectedFile}
        type={attachmentType}
        contacts={contactsFromDb}
        onAttach={handleAttachment}
      />
      </div>
    </div>
  );
};
