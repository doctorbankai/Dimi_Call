// File Preview Component

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { X, File, Calendar, HardDrive, FileType } from 'lucide-react';
import { FileNode } from '@/types/fileManager';
import { formatFileSize } from '@/services/fileManagerService';

interface FilePreviewProps {
  file: FileNode | null;
  onClose: () => void;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ file, onClose }) => {
  if (!file) return null;

  const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp'].includes(
    file.extension.toLowerCase()
  );

  const isText = ['.txt', '.md', '.json', '.csv', '.log'].includes(
    file.extension.toLowerCase()
  );

  const isPdf = file.extension.toLowerCase() === '.pdf';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold truncate">
          {file.name}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 overflow-hidden p-4">
        <ScrollArea className="h-full">
          {/* Preview Area */}
          <div className="mb-4">
            {isImage && (
              <div className="flex items-center justify-center bg-muted rounded-lg p-4">
                <img
                  src={`file://${file.path}`}
                  alt={file.name}
                  className="max-w-full max-h-96 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {isText && (
              <div className="bg-muted rounded-lg p-4">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {/* Text content would be loaded here */}
                  <span className="text-muted-foreground">
                    Text preview not available. Double-click to open.
                  </span>
                </pre>
              </div>
            )}

            {isPdf && (
              <div className="bg-muted rounded-lg p-4 text-center">
                <File className="h-16 w-16 mx-auto mb-2 text-red-500" />
                <p className="text-sm text-muted-foreground">
                  PDF preview not available. Double-click to open.
                </p>
              </div>
            )}

            {!isImage && !isText && !isPdf && (
              <div className="bg-muted rounded-lg p-8 text-center">
                <File className="h-16 w-16 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No preview available for this file type
                </p>
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* File Metadata */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Properties</h3>

            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <FileType className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm truncate">
                    {file.type === 'folder' ? 'Folder' : `${file.extension} File`}
                  </p>
                </div>
              </div>

              {file.type === 'file' && (
                <div className="flex items-start gap-2">
                  <HardDrive className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Size</p>
                    <p className="text-sm">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Modified</p>
                  <p className="text-sm">
                    {new Date(file.modifiedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm">
                    {new Date(file.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {file.tags.length > 0 && (
              <>
                <Separator className="my-3" />
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {file.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Separator className="my-3" />

            <div>
              <p className="text-xs text-muted-foreground mb-1">Path</p>
              <p className="text-xs font-mono bg-muted p-2 rounded break-all">
                {file.path}
              </p>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
