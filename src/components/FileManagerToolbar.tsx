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
  Search,
  Grid3x3,
  List,
  Table as TableIcon,
  ExternalLink,
  FolderPlus,
  Upload,
  Filter,
  ChevronRight,
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

  return (
    <div className="flex flex-col gap-2 p-4 mx-4 mt-4 mb-4 border-b">
      {/* Top Row: Breadcrumb + Actions */}
      <div className="flex items-center gap-2">
        <Breadcrumb className="flex-1">
          <BreadcrumbList>
            {pathSegments.map((segment, index) => (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => handleBreadcrumbClick(index)}
                    className="cursor-pointer hover:text-foreground"
                  >
                    {segment}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {index < pathSegments.length - 1 && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>
                )}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <Button variant="outline" size="sm" onClick={onCreateFolder}>
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>

        <Button variant="outline" size="sm" onClick={onUploadFiles}>
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>

        <Button variant="outline" size="sm" onClick={onOpenLocation}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Open Location
        </Button>
      </div>

      {/* Bottom Row: Search + View Mode + Filter */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {filterType === 'all' ? 'All Files' : filterType}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onFilterChange('all')}>
              All Files
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange('documents')}>
              Documents
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange('images')}>
              Images
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange('videos')}>
              Videos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange('audio')}>
              Audio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange('archives')}>
              Archives
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="h-8 w-8 p-0"
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="h-8 w-8 p-0"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'details' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('details')}
            className="h-8 w-8 p-0"
          >
            <TableIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
