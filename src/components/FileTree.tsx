// File Tree Component - Hierarchical folder navigation

import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
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
            "flex items-center gap-1 py-1 px-2 rounded-md hover:bg-accent cursor-pointer group",
            isActive && "bg-accent"
          )}
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>

          <div
            className="flex items-center gap-2 flex-1 min-w-0"
            onClick={handleClick}
          >
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
            )}
            <span className="text-sm truncate">{folder.name}</span>
          </div>
        </div>

        <CollapsibleContent>
          {isLoading ? (
            <div
              className="text-xs text-muted-foreground py-1"
              style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
            >
              Loading...
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

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        {/* Root folder */}
        <div
          className={cn(
            "flex items-center gap-2 py-1 px-2 rounded-md hover:bg-accent cursor-pointer",
            currentPath === rootPath && "bg-accent"
          )}
          onClick={() => onNavigate(rootPath)}
        >
          <Folder className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium">DimiCall</span>
        </div>

        {/* Child folders */}
        {isLoading ? (
          <div className="text-xs text-muted-foreground py-2 px-2">
            Loading folders...
          </div>
        ) : (
          rootFolders.map((folder) => (
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
  );
};
