// File Manager Toolbar Component

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Search,
  Grid3x3,
  List,
  Table as TableIcon,
  ExternalLink,
  FolderPlus,
  Upload,
  Filter,
  Check,
} from 'lucide-react';
import { ViewMode, FileFilterType } from '@/types/fileManager';

interface FileManagerToolbarProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterType: FileFilterType;
  onFilterChange: (type: FileFilterType) => void;
  onOpenLocation: () => void;
  onChangeRoot: () => void;
  onCreateFolder: () => void;
  onUploadFiles: () => void;
}

export const FileManagerToolbar: React.FC<FileManagerToolbarProps> = ({
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filterType,
  onFilterChange,
  onOpenLocation,
  onChangeRoot,
  onCreateFolder,
  onUploadFiles,
}) => {
  const filterLabels: Record<FileFilterType, string> = {
    all: 'Tous',
    documents: 'Documents',
    images: 'Images',
    videos: 'Vidéos',
    audio: 'Audio',
    archives: 'Archives',
  };

  return (
    <div className="px-6 py-3 bg-white dark:bg-card border-b border-border/80 text-foreground transition-colors">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Recherche */}
        <div className="relative flex-1 min-w-[220px] max-w-sm sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-9 pr-3 bg-white dark:bg-background border-border/50 shadow-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
          />
        </div>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 px-3 whitespace-nowrap border-border/70 bg-white dark:bg-card shadow-none hover:bg-accent hover:text-accent-foreground"
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">
                {filterLabels[filterType]}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {(['all', 'documents', 'images', 'videos', 'audio', 'archives'] as FileFilterType[]).map((type) => (
              <DropdownMenuItem
                key={type}
                onClick={() => onFilterChange(type)}
                className="flex items-center justify-between text-sm"
              >
                <span>{filterLabels[type]}</span>
                {filterType === type && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 border rounded-lg p-1 bg-white dark:bg-card border-border/70 shadow-none">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('grid')}
                  className="h-7 w-7 p-0 transition-all hover:scale-105"
                  aria-label="Vue grille"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Vue grille</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('list')}
                  className="h-7 w-7 p-0 transition-all hover:scale-105"
                  aria-label="Vue liste"
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Vue liste</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={viewMode === 'details' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => onViewModeChange('details')}
                  className="h-7 w-7 p-0 transition-all hover:scale-105"
                  aria-label="Vue détails"
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Vue détails</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onChangeRoot} className="h-9 gap-2 bg-white dark:bg-card border-border/70 shadow-none">
                  <FolderPlus className="h-4 w-4" />
                  <span className="hidden lg:inline">Changer racine</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Changer le dossier racine</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onCreateFolder} className="h-9 gap-2 bg-white dark:bg-card border-border/70 shadow-none">
                  <FolderPlus className="h-4 w-4" />
                  <span className="hidden lg:inline">Nouveau dossier</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Créer un nouveau dossier</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onUploadFiles} className="h-9 gap-2 bg-white dark:bg-card border-border/70 shadow-none">
                  <Upload className="h-4 w-4" />
                  <span className="hidden lg:inline">Téléverser</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Téléverser des fichiers</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={onOpenLocation} className="h-9 gap-2 bg-white dark:bg-card border-border/70 shadow-none">
                  <ExternalLink className="h-4 w-4" />
                  <span className="hidden lg:inline">Ouvrir</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ouvrir l'emplacement dans l'explorateur</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};
