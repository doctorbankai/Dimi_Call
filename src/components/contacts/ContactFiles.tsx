
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileIcon,
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
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  updatedAt?: Date;
}

export const ContactFiles: React.FC<ContactFilesProps> = ({ contactId, contact }) => {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [isManuallyLinked, setIsManuallyLinked] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Use a ref to track the last checked identifier to prevent loops
  const lastCheckedId = useRef<string>('');

  const checkFolder = useCallback(async (force = false) => {
    // Unique identifier for this check
    const checkId = `${contactId}-${contact.nom}-${contact.prenom}-${contact.telephone}`;

    // Skip if we already checked this ID and not forced
    if (!force && lastCheckedId.current === checkId) {
      return;
    }

    lastCheckedId.current = checkId;
    setLoading(true);

    try {
      // Check if there's a manually linked folder
      const linkedPath = localStorage.getItem(`contact_folder_${contactId}`);

      if (linkedPath) {
        // @ts-ignore
        const result = await window.electronAPI.listDirectory(linkedPath);
        if (result && result.success) {
          setCurrentPath(linkedPath);
          setFiles(result.files || []);
          setIsManuallyLinked(true);
          setLoading(false);
          return;
        }
        // Linked folder no longer exists, clean up
        localStorage.removeItem(`contact_folder_${contactId}`);
      }

      // No linked folder found or invalid, check default location
      const rootPath = localStorage.getItem('dimicall_root_path') || 'C:\\DimiCall';
      const safeName = `${contact.nom || ''} ${contact.prenom || ''} - ${contact.telephone || ''}`
        .replace(/[<>:"/\\|?*]/g, '')
        .trim();
      const defaultPath = `${rootPath}\\${safeName}`;

      // @ts-ignore
      const result = await window.electronAPI.listDirectory(defaultPath);

      if (result && result.success) {
        setCurrentPath(defaultPath);
        setFiles(result.files || []);
        setIsManuallyLinked(false);
      } else {
        // No folder found anywhere
        setCurrentPath(null);
        setFiles([]);
        setIsManuallyLinked(false);
      }
    } catch (err) {
      console.error("Error checking folder:", err);
      setCurrentPath(null);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [contactId, contact.nom, contact.prenom, contact.telephone]);

  // Effect to trigger check ONLY when contact identity changes
  useEffect(() => {
    checkFolder();
  }, [checkFolder]);

  const handleCreateFolder = async () => {
    try {
      // Let user pick a parent directory
      // @ts-ignore
      const pickResult = await window.electronAPI.pickFolder();
      if (!pickResult.success || !pickResult.path) {
        return; // User cancelled
      }

      setLoading(true);
      const parentPath = pickResult.path;
      const safeName = `${contact.nom || ''} ${contact.prenom || ''} - ${contact.telephone || ''}`
        .replace(/[<>:"/\\|?*]/g, '')
        .trim();

      // @ts-ignore
      const result = await window.electronAPI.createFolder(parentPath, safeName);

      if (result && result.success) {
        toast.success(`Dossier créé : ${safeName}`);
        const newPath = `${parentPath}\\${safeName}`;
        // Save as linked folder for this contact
        localStorage.setItem(`contact_folder_${contactId}`, newPath);
        setCurrentPath(newPath);
        setIsManuallyLinked(true);
        // Force refresh
        lastCheckedId.current = '';
        await checkFolder(true);
      } else {
        const errorMsg = result?.error?.message || result?.error || 'Erreur inconnue';
        toast.error(`Erreur création dossier: ${errorMsg}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur inattendue lors de la création");
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
        // Reset check guard and force refresh
        lastCheckedId.current = '';
        setIsManuallyLinked(true);
        await checkFolder(true);
        toast.success("Dossier lié avec succès");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la sélection du dossier");
    }
  };

  const handleUnlinkFolder = async () => {
    // Remove the manual link
    localStorage.removeItem(`contact_folder_${contactId}`);
    toast.success("Dossier délié — le lien a été supprimé");
    // Reset check guard to force re-evaluation
    lastCheckedId.current = '';
    setCurrentPath(null);
    setFiles([]);
    setIsManuallyLinked(false);
    // Re-check to see if the default folder exists
    await checkFolder(true);
  };

  const handleDeleteFolder = async () => {
    if (!currentPath) return;

    setLoading(true);
    try {
      // @ts-ignore
      const result = await window.electronAPI.deleteItem(currentPath);
      if (result.success) {
        toast.success("Dossier supprimé définitivement");
        // Also remove the link if it was custom linked
        localStorage.removeItem(`contact_folder_${contactId}`);
        setCurrentPath(null);
        setFiles([]);
        setIsDeleteDialogOpen(false);
        setIsManuallyLinked(false);
        // Refresh state
        lastCheckedId.current = '';
        await checkFolder(true);
      } else {
        const errorMsg = result.error?.message || result.error || 'Erreur inconnue';
        toast.error(`Erreur suppression: ${errorMsg}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la suppression");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    lastCheckedId.current = '';
    await checkFolder(true);
    toast.success("Liste actualisée");
  };

  const handleOpenFolder = async () => {
    if (currentPath) {
      // @ts-ignore
      await window.electronAPI.openLocation(currentPath);
    }
  };

  const handleOpenFile = async (file: FileItem) => {
    const fullPath = file.path;
    // @ts-ignore
    await window.electronAPI.openLocation(fullPath);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext || '')) return <ImageIcon className="w-5 h-5 text-purple-500" />;
    if (['pdf'].includes(ext || '')) return <FileText className="w-5 h-5 text-red-500" />;
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return <FileSpreadsheet className="w-5 h-5 text-green-500" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="w-5 h-5 text-blue-500" />;
    return <FileIcon className="w-5 h-5 text-gray-500" />;
  };

  if (loading && !currentPath) {
    return (
      <div className="flex flex-col items-center justify-center py-10 h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-sm text-muted-foreground">Recherche du dossier...</p>
      </div>
    );
  }

  // View: No folder associated or found
  if (!currentPath) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 h-full space-y-4">
        <div className="bg-muted rounded-full p-4 mb-2">
          <Folder className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold">Aucun dossier associé</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-1">
            Créez un nouveau dossier ou liez un dossier existant pour ce contact.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs mt-4">
          <Button onClick={handleCreateFolder} className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderPlus className="mr-2 h-4 w-4" />}
            Nouveau dossier...
          </Button>
          <div className="relative flex items-center py-2">
            <Separator className="flex-1" />
            <span className="mx-2 text-xs text-muted-foreground uppercase">Ou</span>
            <Separator className="flex-1" />
          </div>
          <Button variant="outline" onClick={handleLinkFolder} className="w-full" disabled={loading}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Lier un dossier existant
          </Button>
        </div>
      </div>
    );
  }

  // View: Folder found and active
  return (
    <div className="flex flex-col h-full bg-background rounded-md border">
      <div className="p-3 border-b flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          <Folder className="h-4 w-4 text-blue-500 shrink-0" />
          <span className="text-xs font-mono truncate max-w-full" title={currentPath}>
            {currentPath}
          </span>
          {isManuallyLinked && (
            <span className="text-[10px] bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded shrink-0">
              Lié
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleRefresh}
            title="Actualiser"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleOpenFolder}
            title="Ouvrir dans l'explorateur"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLinkFolder}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Changer le dossier lié...
              </DropdownMenuItem>
              {isManuallyLinked && (
                <DropdownMenuItem onClick={handleUnlinkFolder}>
                  <Unlink className="mr-2 h-4 w-4" />
                  Délier le dossier
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer le dossier
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ScrollArea className="flex-1 p-2">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 opacity-50">
            <Folder className="h-12 w-12 mb-2 text-gray-300" />
            <p className="text-sm">Le dossier est vide</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-md border bg-card hover:bg-accent/50 cursor-pointer transition-colors group"
                onDoubleClick={() => handleOpenFile(file)}
              >
                {file.type === 'folder' ? (
                  <Folder className="w-5 h-5 text-yellow-500" />
                ) : (
                  getFileIcon(file.name)
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                  {file.size !== undefined && file.size > 0 && (
                    <p className="text-[10px] text-muted-foreground">
                      {file.size < 1024
                        ? `${file.size} B`
                        : file.size < 1024 * 1024
                          ? `${(file.size / 1024).toFixed(1)} KB`
                          : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-2 border-t bg-muted/10 text-xs text-center text-muted-foreground">
        {files.length} élément(s) • Double-cliquez pour ouvrir
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le dossier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est <strong>irréversible</strong>. Le dossier et tous ses fichiers seront définitivement supprimés de votre disque dur.
              <br /><br />
              <code className="text-xs bg-muted px-2 py-1 rounded block overflow-auto">{currentPath}</code>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteFolder}
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
