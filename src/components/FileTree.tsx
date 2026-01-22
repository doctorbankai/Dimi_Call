// File Tree Component - Hierarchical folder navigation

import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Folder, FolderOpen, ChevronRight, ChevronDown, Search } from 'lucide-react';
import { FileNode } from '@/types/fileManager';
import { listDirectory } from '@/services/fileManagerService';
import { cn } from '@/lib/utils';

interface FileTreeProps {
  rootPath: string;
  currentPath: string;
  onNavigate: (path: string) => void;
  expandedFolders: Set<string>;
  onToggleExpand: (path: string) => void;
}

interface TreeNodeProps {
  folder: FileNode;
  level: number;
  currentPath: string;
  expandedFolders: Set<string>;
  onNavigate: (path: string) => void;
  onToggleExpand: (path: string) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  folder,
  level,
  currentPath,
  expandedFolders,
  onNavigate,
  onToggleExpand,
}) => {
  const [children, setChildren] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isExpanded = expandedFolders.has(folder.path);
  const isActive = currentPath === folder.path;

  useEffect(() => {
    if (isExpanded && children.length === 0) {
      loadChildren();
    }
  }, [isExpanded]);

  const loadChildren = async () => {
    setIsLoading(true);
    try {
      const result = await listDirectory(folder.path);
      if (result.success && result.files) {
        // Only show folders in tree
        const folders = result.files.filter(f => f.type === 'folder');
        setChildren(folders);
      }
    } catch (error) {
      console.error('Error loading folder children:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    onToggleExpand(folder.path);
  };

  const handleClick = () => {
    onNavigate(folder.path);
  };

  return (
    <div>
      <Collapsible open={isExpanded} onOpenChange={handleToggle}>
        <div
          className={cn(
            "flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer group transition-all",
            "hover:bg-accent/50",
            isActive && "bg-accent shadow-sm"
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>

          <div
            className="flex items-center gap-2 flex-1 min-w-0"
            onClick={handleClick}
          >
            {isExpanded ? (
              <FolderOpen className={cn(
                "h-4 w-4 flex-shrink-0 transition-colors",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-blue-500"
              )} />
            ) : (
              <Folder className={cn(
                "h-4 w-4 flex-shrink-0 transition-colors",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-blue-500"
              )} />
            )}
            <span className={cn(
              "text-sm truncate flex-1",
              isActive && "font-semibold"
            )}>
              {folder.name}
            </span>
            {children.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs font-normal">
                {children.length}
              </Badge>
            )}
          </div>
        </div>

        <CollapsibleContent>
          {isLoading ? (
            <div
              className="text-xs text-muted-foreground py-2 px-3"
              style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
            >
              Chargement...
            </div>
          ) : (
            children.map((child) => (
              <TreeNode
                key={child.id}
                folder={child}
                level={level + 1}
                currentPath={currentPath}
                expandedFolders={expandedFolders}
                onNavigate={onNavigate}
                onToggleExpand={onToggleExpand}
              />
            ))
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({
  rootPath,
  currentPath,
  onNavigate,
  expandedFolders,
  onToggleExpand,
}) => {
  const [rootFolders, setRootFolders] = useState<FileNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRootFolders();
  }, [rootPath]);

  const loadRootFolders = async () => {
    setIsLoading(true);
    try {
      const result = await listDirectory(rootPath);
      if (result.success && result.files) {
        // Only show folders in tree
        const folders = result.files.filter(f => f.type === 'folder');
        setRootFolders(folders);
      }
    } catch (error) {
      console.error('Error loading root folders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredFolders = rootFolders.filter(folder =>
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-background transition-colors">
      {/* Header */}
      <div className="p-3 border-b bg-muted/40 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Dossiers
          </h2>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-8 pr-2 text-xs bg-background border-border/50 shadow-none"
          />
        </div>
      </div>

      {/* Tree Content */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {/* Root folder */}
          <div
            className={cn(
              "flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-all",
              "hover:bg-accent/50 group",
              currentPath === rootPath && "bg-accent shadow-sm"
            )}
            onClick={() => onNavigate(rootPath)}
          >
            <Folder className={cn(
              "h-4 w-4 flex-shrink-0 transition-colors",
              currentPath === rootPath ? "text-blue-600 dark:text-blue-400" : "text-blue-500"
            )} />
            <span className={cn(
              "text-sm font-medium truncate flex-1",
              currentPath === rootPath && "font-semibold"
            )}>
              DimiCall
            </span>
          </div>

          {/* Child folders */}
          {isLoading ? (
            <div className="text-xs text-muted-foreground py-3 px-3 text-center">
              Chargement...
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="text-xs text-muted-foreground py-3 px-3 text-center">
              {searchTerm ? 'Aucun résultat' : 'Aucun dossier'}
            </div>
          ) : (
            filteredFolders.map((folder) => (
              <TreeNode
                key={folder.id}
                folder={folder}
                level={0}
                currentPath={currentPath}
                expandedFolders={expandedFolders}
                onNavigate={onNavigate}
                onToggleExpand={onToggleExpand}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
