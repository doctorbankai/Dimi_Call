
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Folder,
  FolderPlus,
  Link as LinkIcon,
  Loader2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  Trash2,
  Unlink,
  MoreVertical,
  RefreshCw,
  Upload,
  Plus,
  Pencil,
  FolderOpen,
  ChevronRight,
  Home,
  ArrowLeft,
  File,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ContactFilesProps {
  contactId: string;
  contact: {
    prenom: string;
    nom: string;
    telephone: string;
  };
}

interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size?: number;
  modifiedAt?: Date;
  extension?: string;
}

export const ContactFiles: React.FC<ContactFilesProps> = ({ contactId, contact }) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [isManuallyLinked, setIsManuallyLinked] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Dialogs
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteFileDialogOpen, setIsDeleteFileDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);

  // Selected item for operations
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [newName, setNewName] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastCheckedId = useRef<string>('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Navigation history for breadcrumb
  const [pathHistory, setPathHistory] = useState<string[]>([]);

  const loadDirectory = useCallback(async (targetPath: string, isRoot = false) => {
    setLoading(true);
    try {
      // @ts-ignore
      const result = await window.electronAPI.listDirectory(targetPath);
      if (result && result.success) {
        setCurrentPath(targetPath);
        if (isRoot) {
          setRootPath(targetPath);
          setPathHistory([targetPath]);
        }
        // Sort: folders first, then files
        const sortedFiles = (result.files || []).sort((a: FileItem, b: FileItem) => {
          if (a.type === 'folder' && b.type !== 'folder') return -1;
          if (a.type !== 'folder' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name);
        });
        setFiles(sortedFiles);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error loading directory:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkFolder = useCallback(async (force = false) => {
    // Normalisation du numéro de téléphone - supprimer tous les caractères non numériques sauf +
    const safePhone = contact.telephone?.replace(/[^\d+]/g, '') || '';
    const checkId = `${contactId}-${contact.nom}-${contact.prenom}-${safePhone}`;

    if (!force && lastCheckedId.current === checkId) {
      return;
    }

    lastCheckedId.current = checkId;
    setLoading(true);
    console.log('[ContactFiles] Checking folder for:', { contactId, nom: contact.nom, prenom: contact.prenom, phone: contact.telephone, safePhone });

    try {
      // Priorité 1 : Vérifier la clé basée sur le numéro de téléphone (stable entre les vues)
      let linkedPath = null;
      if (safePhone) {
        linkedPath = localStorage.getItem(`contact_folder_phone_${safePhone}`);
        console.log('[ContactFiles] Phone key lookup:', `contact_folder_phone_${safePhone}`, '=', linkedPath);
      }

      // Priorité 2 : Fallback sur l'ID (pour compatibilité existante)
      if (!linkedPath) {
        linkedPath = localStorage.getItem(`contact_folder_${contactId}`);
        console.log('[ContactFiles] ID key lookup:', `contact_folder_${contactId}`, '=', linkedPath);
        // Si trouvé avec l'ID mais qu'on a un téléphone, on migre vers la nouvelle clé
        if (linkedPath && safePhone) {
          localStorage.setItem(`contact_folder_phone_${safePhone}`, linkedPath);
          console.log('[ContactFiles] Migrated to phone key');
        }
      }

      if (linkedPath) {
        console.log('[ContactFiles] Trying linked path:', linkedPath);
        const success = await loadDirectory(linkedPath, true);
        if (success) {
          setIsManuallyLinked(true);
          return;
        }
        // Si le chemin ne marche plus, on nettoie
        if (safePhone) localStorage.removeItem(`contact_folder_phone_${safePhone}`);
        localStorage.removeItem(`contact_folder_${contactId}`);
      }

      // Priorité 3 : Essayer les chemins par défaut avec les deux ordres de noms
      const defaultRoot = localStorage.getItem('dimicall_root_path') || 'C:\\DimiCall';
      const phoneForPath = contact.telephone?.replace(/[<>:"/\\|?*]/g, '') || '';

      // Ordre 1 : Nom Prénom
      const safeName1 = `${contact.nom || ''} ${contact.prenom || ''} - ${phoneForPath}`.trim();
      const defaultPath1 = `${defaultRoot}\\${safeName1}`;

      // Ordre 2 : Prénom Nom
      const safeName2 = `${contact.prenom || ''} ${contact.nom || ''} - ${phoneForPath}`.trim();
      const defaultPath2 = `${defaultRoot}\\${safeName2}`;

      console.log('[ContactFiles] Trying default path 1 (Nom Prénom):', defaultPath1);
      let success = await loadDirectory(defaultPath1, true);
      if (success) {
        setIsManuallyLinked(false);
        // Auto-save avec la clé téléphone pour synchronisation
        if (safePhone) {
          localStorage.setItem(`contact_folder_phone_${safePhone}`, defaultPath1);
          console.log('[ContactFiles] Auto-saved phone key for path 1');
        }
        return;
      }

      console.log('[ContactFiles] Trying default path 2 (Prénom Nom):', defaultPath2);
      success = await loadDirectory(defaultPath2, true);
      if (success) {
        setIsManuallyLinked(false);
        // Auto-save avec la clé téléphone pour synchronisation
        if (safePhone) {
          localStorage.setItem(`contact_folder_phone_${safePhone}`, defaultPath2);
          console.log('[ContactFiles] Auto-saved phone key for path 2');
        }
        return;
      }

      // Aucun dossier trouvé
      console.log('[ContactFiles] No folder found');
      setCurrentPath(null);
      setRootPath(null);
      setFiles([]);
      setIsManuallyLinked(false);
    } catch (err) {
      console.error("Error checking folder:", err);
      setCurrentPath(null);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [contactId, contact.nom, contact.prenom, contact.telephone, loadDirectory]);

  useEffect(() => {
    checkFolder();
  }, [checkFolder]);

  // Navigate into a subfolder
  const handleNavigateInto = async (folder: FileItem) => {
    if (folder.type !== 'folder') return;
    setPathHistory(prev => [...prev, folder.path]);
    await loadDirectory(folder.path);
  };

  // Navigate back
  const handleNavigateBack = async () => {
    if (pathHistory.length <= 1) return;
    const newHistory = [...pathHistory];
    newHistory.pop();
    const previousPath = newHistory[newHistory.length - 1];
    setPathHistory(newHistory);
    await loadDirectory(previousPath);
  };

  // Navigate to specific path in breadcrumb
  const handleNavigateTo = async (index: number) => {
    if (index >= pathHistory.length - 1) return;
    const newHistory = pathHistory.slice(0, index + 1);
    setPathHistory(newHistory);
    await loadDirectory(newHistory[newHistory.length - 1]);
  };

  // File import
  const handleImportFiles = async (fileList: FileList | File[]) => {
    if (!currentPath || fileList.length === 0) return;

    setUploading(true);
    try {
      const filesToUpload: { name: string; data: Uint8Array; path: string }[] = [];

      for (const file of Array.from(fileList)) {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        filesToUpload.push({
          name: file.name,
          data: uint8Array,
          path: file.name
        });
      }

      // @ts-ignore
      const result = await window.electronAPI.uploadFiles(filesToUpload, currentPath);

      if (result && result.success) {
        toast.success(`${filesToUpload.length} fichier(s) importé(s)`);
        await loadDirectory(currentPath);
      } else {
        toast.error(`Erreur d'importation: ${result?.error?.message || 'Inconnue'}`);
      }
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Erreur lors de l'importation");
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImportFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleClickImport = () => fileInputRef.current?.click();

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleImportFiles(e.dataTransfer.files);
    }
  };

  // Folder operations
  const handleCreateFolder = async () => {
    try {
      // @ts-ignore
      const pickResult = await window.electronAPI.pickFolder();
      if (!pickResult.success || !pickResult.path) return;

      setLoading(true);
      const parentPath = pickResult.path;
      const safeName = `${contact.nom || ''} ${contact.prenom || ''} - ${contact.telephone || ''}`
        .replace(/[<>:"/\\|?*]/g, '').trim();

      // @ts-ignore
      const result = await window.electronAPI.createFolder(parentPath, safeName);

      if (result?.success) {
        toast.success(`Dossier créé : ${safeName}`);
        const newPath = `${parentPath}\\${safeName}`;
        localStorage.setItem(`contact_folder_${contactId}`, newPath);
        // Sauvegarder aussi avec la clé téléphone pour la synchro
        const safePhone = contact.telephone?.replace(/\s/g, '');
        if (safePhone) {
          localStorage.setItem(`contact_folder_phone_${safePhone}`, newPath);
        }
        setIsManuallyLinked(true);
        lastCheckedId.current = '';
        await checkFolder(true);
      } else {
        toast.error(`Erreur: ${result?.error?.message || result?.error || 'Inconnue'}`);
      }
    } catch (err) {
      toast.error("Erreur inattendue");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkFolder = async () => {
    try {
      // @ts-ignore
      const result = await window.electronAPI.pickFolder();
      if (result.success && result.path) {
        localStorage.setItem(`contact_folder_${contactId}`, result.path);
        const safePhone = contact.telephone?.replace(/\s/g, '');
        if (safePhone) {
          localStorage.setItem(`contact_folder_phone_${safePhone}`, result.path);
        }
        lastCheckedId.current = '';
        setIsManuallyLinked(true);
        await checkFolder(true);
        toast.success("Dossier lié");
      }
    } catch (err) {
      toast.error("Erreur de sélection");
    }
  };

  const handleUnlinkFolder = async () => {
    localStorage.removeItem(`contact_folder_${contactId}`);
    const safePhone = contact.telephone?.replace(/\s/g, '');
    if (safePhone) {
      localStorage.removeItem(`contact_folder_phone_${safePhone}`);
    }
    toast.success("Dossier délié");
    lastCheckedId.current = '';
    setCurrentPath(null);
    setRootPath(null);
    setFiles([]);
    setIsManuallyLinked(false);
    await checkFolder(true);
  };

  const handleDeleteRootFolder = async () => {
    if (!rootPath) return;
    setLoading(true);
    try {
      // @ts-ignore
      const result = await window.electronAPI.deleteItem(rootPath);
      if (result.success) {
        toast.success("Dossier supprimé");
        localStorage.removeItem(`contact_folder_${contactId}`);
        const safePhone = contact.telephone?.replace(/\s/g, '');
        if (safePhone) {
          localStorage.removeItem(`contact_folder_phone_${safePhone}`);
        }
        setCurrentPath(null);
        setRootPath(null);
        setFiles([]);
        setIsDeleteDialogOpen(false);
        setIsManuallyLinked(false);
        lastCheckedId.current = '';
        await checkFolder(true);
      } else {
        toast.error(`Erreur: ${result.error?.message || 'Inconnue'}`);
      }
    } catch (err) {
      toast.error("Erreur de suppression");
    } finally {
      setLoading(false);
    }
  };

  // File operations
  const handleOpenFile = async (file: FileItem) => {
    // @ts-ignore
    await window.electronAPI.openLocation(file.path);
  };

  const handleDeleteFile = async () => {
    if (!selectedFile || !currentPath) return;
    setLoading(true);
    try {
      // @ts-ignore
      const result = await window.electronAPI.deleteItem(selectedFile.path);
      if (result.success) {
        toast.success(`"${selectedFile.name}" supprimé`);
        setIsDeleteFileDialogOpen(false);
        setSelectedFile(null);
        await loadDirectory(currentPath);
      } else {
        toast.error(`Erreur: ${result.error?.message || 'Inconnue'}`);
      }
    } catch (err) {
      toast.error("Erreur de suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleRenameFile = async () => {
    if (!selectedFile || !currentPath || !newName.trim()) return;
    setLoading(true);
    try {
      // @ts-ignore
      const result = await window.electronAPI.renameItem(selectedFile.path, newName.trim());
      if (result.success) {
        toast.success(`Renommé en "${newName.trim()}"`);
        setIsRenameDialogOpen(false);
        setSelectedFile(null);
        setNewName('');
        await loadDirectory(currentPath);
      } else {
        toast.error(`Erreur: ${result.error?.message || 'Inconnue'}`);
      }
    } catch (err) {
      toast.error("Erreur de renommage");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewFolder = async () => {
    if (!currentPath || !newFolderName.trim()) return;
    setLoading(true);
    try {
      // @ts-ignore
      const result = await window.electronAPI.createFolder(currentPath, newFolderName.trim());
      if (result?.success) {
        toast.success(`Dossier "${newFolderName.trim()}" créé`);
        setIsNewFolderDialogOpen(false);
        setNewFolderName('');
        await loadDirectory(currentPath);
      } else {
        toast.error(`Erreur: ${result?.error?.message || 'Inconnue'}`);
      }
    } catch (err) {
      toast.error("Erreur de création");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (currentPath) {
      await loadDirectory(currentPath);
      toast.success("Actualisé");
    }
  };

  const handleOpenInExplorer = async () => {
    if (currentPath) {
      // @ts-ignore
      await window.electronAPI.openLocation(currentPath);
    }
  };

  // Open rename dialog
  const openRenameDialog = (file: FileItem) => {
    setSelectedFile(file);
    setNewName(file.name);
    setIsRenameDialogOpen(true);
    setTimeout(() => renameInputRef.current?.select(), 100);
  };

  // Open delete dialog
  const openDeleteDialog = (file: FileItem) => {
    setSelectedFile(file);
    setIsDeleteFileDialogOpen(true);
  };

  // Check if file is an image for preview
  const isImageFile = (file: FileItem) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '');
  };

  const openPreview = (file: FileItem) => {
    setSelectedFile(file);
    setIsPreviewOpen(true);
  };

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') return <Folder className="w-5 h-5 text-yellow-500" />;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (['pdf'].includes(ext || '')) return <FileText className="w-5 h-5 text-red-500" />;
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatSize = (size?: number) => {
    if (!size) return '';
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get relative path for breadcrumb display
  const getBreadcrumbParts = () => {
    if (!rootPath || pathHistory.length === 0) return [];
    return pathHistory.map((p, i) => ({
      path: p,
      name: i === 0 ? 'Racine' : p.split('\\').pop() || p,
      isLast: i === pathHistory.length - 1
    }));
  };

  // Hidden file input
  const FileInput = (
    <input
      ref={fileInputRef}
      type="file"
      multiple
      className="hidden"
      onChange={handleFileInputChange}
    />
  );

  if (loading && !currentPath) {
    return (
      <div className="flex flex-col items-center justify-center py-10 h-full">
        {FileInput}
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  // No folder state
  if (!currentPath) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 h-full space-y-4">
        {FileInput}
        <div className="bg-muted rounded-full p-4 mb-2">
          <Folder className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Aucun dossier associé</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
            Créez ou liez un dossier pour ce contact.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs mt-4">
          <Button onClick={handleCreateFolder} className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-2 h-4 w-4" />}
            Nouveau dossier...
          </Button>
          <Separator className="my-1" />
          <Button variant="outline" onClick={handleLinkFolder} className="w-full" disabled={loading}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Lier un dossier existant
          </Button>
        </div>
      </div>
    );
  }

  // Main file manager view
  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-background rounded-md border">
        {FileInput}

        {/* Toolbar */}
        <div className="p-2 border-b flex items-center gap-1 bg-muted/30 flex-wrap">
          {/* Navigation */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleNavigateBack}
                disabled={pathHistory.length <= 1}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Retour</TooltipContent>
          </Tooltip>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
            {getBreadcrumbParts().map((part, idx) => (
              <React.Fragment key={part.path}>
                {idx > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
                <button
                  className={`text-xs px-1.5 py-0.5 rounded hover:bg-accent truncate max-w-[100px] ${part.isLast ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                  onClick={() => handleNavigateTo(idx)}
                  disabled={part.isLast}
                  title={part.path}
                >
                  {idx === 0 ? <Home className="h-3 w-3 inline" /> : part.name}
                </button>
              </React.Fragment>
            ))}
            {isManuallyLinked && (
              <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded shrink-0 ml-1">
                Lié
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsNewFolderDialogOpen(true)}>
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Nouveau dossier</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClickImport} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Importer des fichiers</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleRefresh} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Actualiser</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleOpenInExplorer}>
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ouvrir dans l'explorateur</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleLinkFolder}>
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Changer le dossier lié
                </DropdownMenuItem>
                {isManuallyLinked && (
                  <DropdownMenuItem onClick={handleUnlinkFolder}>
                    <Unlink className="mr-2 h-4 w-4" />
                    Délier le dossier
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer le dossier racine
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* File list */}
        <div
          className={`flex-1 overflow-hidden transition-colors ${isDragOver ? 'bg-primary/10 ring-2 ring-inset ring-primary ring-dashed' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <ScrollArea className="h-full">
            {files.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-12 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors m-2"
                onClick={handleClickImport}
              >
                <div className={`rounded-full p-4 mb-3 ${isDragOver ? 'bg-primary/20' : 'bg-muted'}`}>
                  <Upload className={`h-8 w-8 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <p className="text-sm font-medium">
                  {isDragOver ? 'Déposez ici' : 'Dossier vide'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Glissez-déposez ou cliquez pour importer
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1 p-2">
                {files.map((file, idx) => (
                  <ContextMenu key={idx}>
                    <ContextMenuTrigger>
                      <div
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors group"
                        onDoubleClick={() => file.type === 'folder' ? handleNavigateInto(file) : handleOpenFile(file)}
                      >
                        {getFileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {file.type === 'folder' ? 'Dossier' : formatSize(file.size)}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => file.type === 'folder' ? handleNavigateInto(file) : handleOpenFile(file)}>
                              <FolderOpen className="mr-2 h-4 w-4" />
                              Ouvrir
                            </DropdownMenuItem>
                            {isImageFile(file) && (
                              <DropdownMenuItem onClick={() => openPreview(file)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Aperçu
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => openRenameDialog(file)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Renommer
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => openDeleteDialog(file)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => file.type === 'folder' ? handleNavigateInto(file) : handleOpenFile(file)}>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Ouvrir
                      </ContextMenuItem>
                      {isImageFile(file) && (
                        <ContextMenuItem onClick={() => openPreview(file)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Aperçu
                        </ContextMenuItem>
                      )}
                      <ContextMenuItem onClick={() => openRenameDialog(file)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Renommer
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem className="text-destructive" onClick={() => openDeleteDialog(file)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-2 border-t bg-muted/10 text-xs text-center text-muted-foreground">
          {files.length} élément(s) • Double-cliquez pour ouvrir
        </div>

        {/* Dialogs */}

        {/* Delete Root Folder */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le dossier racine ?</AlertDialogTitle>
              <AlertDialogDescription>
                Le dossier et tout son contenu seront supprimés définitivement.
                <code className="text-xs bg-muted px-2 py-1 rounded block mt-2 overflow-auto">{rootPath}</code>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteRootFolder}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete File */}
        <AlertDialog open={isDeleteFileDialogOpen} onOpenChange={setIsDeleteFileDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer "{selectedFile?.name}" ?</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedFile?.type === 'folder'
                  ? 'Ce dossier et tout son contenu seront supprimés.'
                  : 'Ce fichier sera supprimé définitivement.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteFile}>
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Rename Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Renommer</DialogTitle>
              <DialogDescription>Entrez le nouveau nom pour "{selectedFile?.name}"</DialogDescription>
            </DialogHeader>
            <Input
              ref={renameInputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nouveau nom"
              onKeyDown={(e) => e.key === 'Enter' && handleRenameFile()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleRenameFile} disabled={!newName.trim() || loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Renommer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Folder Dialog */}
        <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau dossier</DialogTitle>
              <DialogDescription>Entrez le nom du nouveau dossier</DialogDescription>
            </DialogHeader>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Nom du dossier"
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNewFolder()}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleCreateNewFolder} disabled={!newFolderName.trim() || loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Preview */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedFile?.name}</DialogTitle>
            </DialogHeader>
            {selectedFile && isImageFile(selectedFile) && (
              <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
                <img
                  src={`file://${selectedFile.path}`}
                  alt={selectedFile.name}
                  className="max-w-full max-h-[65vh] object-contain rounded"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};
