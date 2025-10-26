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

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
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
  const renderFileIcon = (file: FileNode) => {
    if (file.type === 'folder') {
      return <Folder className="h-8 w-8 text-blue-500" />;
    }

    const ext = file.extension.toLowerCase();

    if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'].includes(ext)) {
      return <Image className="h-8 w-8 text-green-500" />;
    }
    if (['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'].includes(ext)) {
      return <FileText className="h-8 w-8 text-red-500" />;
    }
    if (['.xls', '.xlsx', '.csv', '.ods'].includes(ext)) {
      return <FileSpreadsheet className="h-8 w-8 text-emerald-500" />;
    }
    if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'].includes(ext)) {
      return <Video className="h-8 w-8 text-purple-500" />;
    }
    if (['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'].includes(ext)) {
      return <Music className="h-8 w-8 text-pink-500" />;
    }
    if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(ext)) {
      return <Archive className="h-8 w-8 text-orange-500" />;
    }
    if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css', '.json', '.xml'].includes(ext)) {
      return <Code className="h-8 w-8 text-cyan-500" />;
    }

    return <File className="h-8 w-8 text-gray-500" />;
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
            "cursor-pointer rounded-lg transition-colors",
            viewMode === 'grid' && "flex flex-col items-center p-4 hover:bg-accent",
            viewMode === 'list' && "flex items-center gap-3 p-2 hover:bg-accent",
            viewMode === 'details' && "flex items-center gap-3 p-2 hover:bg-accent",
            isSelected && "bg-accent"
          )}
          onClick={() => setSelectedFile(file)}
          onDoubleClick={() => navigateToFolder(file)}
        >
          {renderFileIcon(file)}
          <div className={cn(
            "flex flex-col",
            viewMode === 'grid' && "mt-2 text-center w-full",
            viewMode === 'list' && "flex-1 min-w-0",
            viewMode === 'details' && "flex-1 min-w-0"
          )}>
            <span className="text-sm truncate">
              {file.name}
            </span>
            {file.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {file.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          {viewMode === 'details' && (
            <>
              <span className="text-xs text-muted-foreground w-24">
                {file.type === 'folder' ? 'Folder' : file.extension}
              </span>
              <span className="text-xs text-muted-foreground w-24">
                {file.type === 'file' ? formatFileSize(file.size) : '-'}
              </span>
              <span className="text-xs text-muted-foreground w-32">
                {new Date(file.modifiedAt).toLocaleDateString()}
              </span>
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
    <div className="flex h-full flex-col gap-4 w-full overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Navbar / Bandeau */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/70 px-6 py-3 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-semibold text-foreground">Gestionnaire de Fichiers</h1>
            <p className="text-sm text-muted-foreground">
              {files.length} élément{files.length > 1 ? 's' : ''} • {currentPath}
            </p>
          </div>
        </div>
        
        <Button
          variant="default"
          size="sm"
          onClick={handleRegenerateContactFolders}
          disabled={isRegenerating || contactsFromDb.length === 0}
          title="Créer automatiquement les dossiers manquants pour tous les contacts"
          className="h-9 bg-neutral-900 hover:bg-black text-white border-neutral-900 dark:bg-neutral-800 dark:hover:bg-neutral-900"
        >
          {isRegenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <Folder className="h-4 w-4 mr-2" />
              Régénérer dossiers
            </>
          )}
        </Button>
      </div>

      <div
        className="flex flex-col flex-1 overflow-hidden relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
      <FileManagerToolbar
        currentPath={currentPath}
        onNavigate={loadDirectory}
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

      <div className="flex-1 rounded-xl border bg-card/70 backdrop-blur-sm shadow-sm mx-4 mb-4 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* File Tree */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <FileTree
              rootPath={STORAGE_DIR}
              currentPath={currentPath}
              onNavigate={loadDirectory}
              expandedFolders={expandedFolders}
              onToggleExpand={handleToggleExpand}
            />
          </ResizablePanel>

          <ResizableHandle />

          {/* Content View */}
          <ResizablePanel defaultSize={showPreview ? 50 : 80} minSize={40}>
            <ScrollArea className="h-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Folder className="h-16 w-16 mb-4 opacity-50" />
                <p>No files found</p>
              </div>
            ) : (
              <div
                className={cn(
                  "p-4",
                  viewMode === 'grid' && "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4",
                  viewMode === 'list' && "space-y-1",
                  viewMode === 'details' && "space-y-1"
                )}
              >
                {filteredFiles.map(renderFileItem)}
              </div>
            )}
          </ScrollArea>
        </ResizablePanel>

          {/* Preview Panel */}
          {showPreview && selectedFile && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                <FilePreview
                  file={selectedFile}
                  onClose={() => setShowPreview(false)}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {isDragging && (
        <div className="absolute inset-0 bg-primary/10 border-4 border-dashed border-primary flex items-center justify-center z-50">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">Drop files here</p>
            <p className="text-muted-foreground">to upload to {currentPath}</p>
          </div>
        </div>
      )}

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
