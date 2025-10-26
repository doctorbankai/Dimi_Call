// File Context Menu Component

import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  FolderOpen,
  Edit,
  Copy,
  Trash2,
} from 'lucide-react';
import { FileNode } from '@/types/fileManager';

interface FileContextMenuProps {
  file: FileNode;
  children: React.ReactNode;
  onOpen: () => void;
  onRename: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  file,
  children,
  onOpen,
  onRename,
  onCopy,
  onDelete,
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={onOpen}>
          <FolderOpen className="mr-2 h-4 w-4" />
          <span>Open</span>
        </ContextMenuItem>

        <ContextMenuItem onClick={onRename}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Rename</span>
          <span className="ml-auto text-xs text-muted-foreground">F2</span>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={onCopy}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy</span>
          <span className="ml-auto text-xs text-muted-foreground">Ctrl+C</span>
        </ContextMenuItem>

        <ContextMenuItem onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
          <span className="ml-auto text-xs text-muted-foreground">Del</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
