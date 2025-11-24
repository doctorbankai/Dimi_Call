// File Manager Toolbar Component

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
  ChevronRight,
  Check,
} from 'lucide-react';
import { ViewMode, FileFilterType } from '@/types/fileManager';
import { cn } from '@/lib/utils';

interface FileManagerToolbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterType: FileFilterType;
  onFilterChange: (type: FileFilterType) => void;
  onOpenLocation: () => void;
  onCreateFolder: () => void;
  onUploadFiles: () => void;
}

const STORAGE_DIR = 'C:\\DimiCall';

export const FileManagerToolbar: React.FC<FileManagerToolbarProps> = ({
  currentPath,
  onNavigate,
  searchTerm,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filterType,
  onFilterChange,
  onOpenLocation,
  onCreateFolder,
  onUploadFiles,
}) => {
  // Parse path into breadcrumb segments
  const pathSegments = currentPath.split('\\').filter(Boolean);

  const handleBreadcrumbClick = (index: number) => {
    const newPath = pathSegments.slice(0, index + 1).join('\\');
    onNavigate(newPath);
  };

  const filterLabels: Record<FileFilterType, string> = {
    all: 'Tous',
    documents: 'Documents',
    images: 'Images',
    videos: 'Vidéos',
    audio: 'Audio',
    archives: 'Archives',
  };

  return (
    <div className="px-6 py-3 border-b bg-card/30 backdrop-blur supports-[backdrop-filter]:bg-card/30">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="flex-1 min-w-0">
          <BreadcrumbList>
            {pathSegments.map((segment, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => handleBreadcrumbClick(index)}
                    className={cn(
                      "cursor-pointer transition-colors rounded-md px-2 py-1 text-sm truncate",
                      "hover:bg-accent hover:text-accent-foreground",
                      index === pathSegments.length - 1 && "font-semibold text-foreground"
                    )}
                  >
                    {segment}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {index < pathSegments.length - 1 && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 pl-9 pr-3 bg-background border-border/50 focus-visible:ring-2 focus-visible:ring-ring text-sm"
          />
        </div>

        {/* Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-2 px-3 whitespace-nowrap border-border/70 bg-background/60 hover:bg-accent hover:text-accent-foreground"
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
        <div className="flex items-center gap-1 border rounded-lg p-1 bg-background">
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
                <Button variant="outline" size="sm" onClick={onCreateFolder} className="h-9 gap-2">
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
                <Button variant="outline" size="sm" onClick={onUploadFiles} className="h-9 gap-2">
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
                <Button variant="outline" size="sm" onClick={onOpenLocation} className="h-9 gap-2">
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
