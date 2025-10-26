// Contact Files Component - Display files attached to a contact

import React, { useState, useEffect, useRef } from 'react';
import { getContactAttachments } from '@/services/fileAttachmentService';
import { getFileById } from '@/services/fileManagerService';
import { FileNode } from '@/types/fileManager';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  File,
  Folder,
  Image,
  FileText,
  FileSpreadsheet,
  Video,
  Music,
  Archive,
  Code,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { formatFileSize } from '@/services/fileManagerService';
import { removeContactAttachment } from '@/services/fileAttachmentService';
import { toast } from 'sonner';

interface ContactFilesProps {
  contactId: string;
  contact?: {
    prenom?: string;
    nom?: string;
    telephone: string;
  };
}

export const ContactFiles: React.FC<ContactFilesProps> = ({ contactId, contact }) => {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);

  const loadAttachedFiles = async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      console.log('🔄 [ContactFiles] Already loading, skipping...');
      return;
    }

    // Check if already loaded for this contact
    if (loadedRef.current === contactId) {
      console.log('🔄 [ContactFiles] Already loaded for this contact, skipping...');
      return;
    }

    isLoadingRef.current = true;
    setLoading(true);
    try {
      console.log(`🔄 [ContactFiles] Loading files for contact: ${contactId}`);
      
      // If we have contact info, try to load files from the contact's folder
      if (contact) {
        const { listDirectory } = await import('@/services/fileManagerService');
        
        console.log(`📂 [ContactFiles] Searching for folder by phone:`, contact.telephone);
        
        // Normalize the phone number for matching
        const normalizedPhone = contact.telephone.replace(/[\s\-\.\(\)\+]/g, '');
        console.log(`📋 [ContactFiles] Normalized phone:`, normalizedPhone);
        
        // List all folders in DimiCall
        const dimiCallResult = await listDirectory('C:\\DimiCall');
        
        if (dimiCallResult.success && dimiCallResult.files) {
          // Find folder that contains the normalized phone number
          const matchingFolder = dimiCallResult.files.find(file => {
            if (file.type !== 'folder') return false;
            
            // Extract phone from folder name (remove all non-digits)
            const folderPhone = file.name.replace(/[\s\-\.\(\)\+]/g, '').replace(/[^\d]/g, '');
            
            console.log(`🔍 [ContactFiles] Checking folder "${file.name}" → phone: ${folderPhone}`);
            
            return folderPhone === normalizedPhone;
          });
          
          if (matchingFolder) {
            console.log(`✅ [ContactFiles] Found matching folder: ${matchingFolder.name}`);
            
            // Load files from the matching folder
            const folderResult = await listDirectory(matchingFolder.path);
            
            if (folderResult.success && folderResult.files) {
              console.log(`📁 [ContactFiles] Found ${folderResult.files.length} files`);
              console.log(`📄 [ContactFiles] Files:`, folderResult.files.map(f => f.name));
              setFiles(folderResult.files);
              setLoading(false);
              return;
            }
          } else {
            console.log(`⚠️ [ContactFiles] No folder found for phone: ${normalizedPhone}`);
            console.log(`📋 [ContactFiles] Available folders:`, dimiCallResult.files.filter(f => f.type === 'folder').map(f => f.name));
          }
        }
      }
      
      // Fallback: use the old attachment system
      console.log(`📋 [ContactFiles] Falling back to attachment system`);
      const fileIds = getContactAttachments(contactId);
      console.log(`📋 [ContactFiles] Found ${fileIds.length} file IDs:`, fileIds);
      
      const filePromises = fileIds.map(id => getFileById(id));
      const loadedFiles = await Promise.all(filePromises);
      const validFiles = loadedFiles.filter((f): f is FileNode => f !== null);
      
      console.log(`✅ [ContactFiles] Loaded ${validFiles.length} valid files`);
      setFiles(validFiles);
      loadedRef.current = contactId;
    } catch (error) {
      console.error('❌ [ContactFiles] Error loading attached files:', error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    // Only load if not already loaded for this contact
    if (loadedRef.current !== contactId) {
      loadAttachedFiles();
    }
  }, [contactId]);

  const handleRemoveAttachment = (fileId: string, fileName: string) => {
    removeContactAttachment(fileId, contactId);
    setFiles(prev => prev.filter(f => f.id !== fileId));
    toast.success(`Removed "${fileName}" from contact`);
  };

  const handleOpenFile = async (file: FileNode) => {
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.files?.openFile) {
        const result = await electronAPI.files.openFile(file.path);
        if (!result.success) {
          toast.error(result.error || 'Failed to open file');
        }
      }
    } catch (error) {
      console.error('Error opening file:', error);
      toast.error('Failed to open file');
    }
  };

  const handleShowInFolder = async (file: FileNode) => {
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.files?.showInFolder) {
        const result = await electronAPI.files.showInFolder(file.path);
        if (!result.success) {
          toast.error(result.error || 'Failed to show in folder');
        }
      }
    } catch (error) {
      console.error('Error showing in folder:', error);
      toast.error('Failed to show in folder');
    }
  };

  const renderFileIcon = (file: FileNode) => {
    if (file.type === 'folder') {
      return <Folder className="h-5 w-5 text-blue-500" />;
    }

    const ext = file.extension.toLowerCase();

    if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'].includes(ext)) {
      return <Image className="h-5 w-5 text-green-500" />;
    }
    if (['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt'].includes(ext)) {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (['.xls', '.xlsx', '.csv', '.ods'].includes(ext)) {
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    }
    if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'].includes(ext)) {
      return <Video className="h-5 w-5 text-purple-500" />;
    }
    if (['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'].includes(ext)) {
      return <Music className="h-5 w-5 text-pink-500" />;
    }
    if (['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'].includes(ext)) {
      return <Archive className="h-5 w-5 text-orange-500" />;
    }
    if (['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css', '.json', '.xml'].includes(ext)) {
      return <Code className="h-5 w-5 text-cyan-500" />;
    }

    return <File className="h-5 w-5 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex h-60 flex-col items-center justify-center text-muted-foreground">
        <File className="mb-2 h-8 w-8 opacity-50" />
        <p>Aucun fichier lié à ce contact.</p>
        <p className="mt-2 text-xs">
          Utilisez le gestionnaire de fichiers pour attacher des documents
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            {renderFileIcon(file)}
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{file.type === 'file' ? formatFileSize(file.size) : 'Folder'}</span>
                <span>•</span>
                <span>{new Date(file.modifiedAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleOpenFile(file)}
                title="Ouvrir le fichier"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShowInFolder(file)}
                title="Afficher dans le dossier"
              >
                <Folder className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveAttachment(file.id, file.name)}
                title="Détacher du contact"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
