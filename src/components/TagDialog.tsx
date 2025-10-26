// Tag Dialog Component

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { FileNode } from '@/types/fileManager';
import { getTags, addTag, removeTag, getAllUniqueTags } from '@/services/fileTagService';

interface TagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileNode | null;
  onTagsChanged: () => void;
}

export const TagDialog: React.FC<TagDialogProps> = ({
  open,
  onOpenChange,
  file,
  onTagsChanged,
}) => {
  const [newTag, setNewTag] = useState('');
  const [fileTags, setFileTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    if (file && open) {
      setFileTags(getTags(file.id));
      setAllTags(getAllUniqueTags());
    }
  }, [file, open]);

  const handleAddTag = () => {
    if (newTag.trim() && file) {
      addTag(file.id, newTag.trim());
      setFileTags(getTags(file.id));
      setAllTags(getAllUniqueTags());
      setNewTag('');
      onTagsChanged();
    }
  };

  const handleRemoveTag = (tag: string) => {
    if (file) {
      removeTag(file.id, tag);
      setFileTags(getTags(file.id));
      onTagsChanged();
    }
  };

  const handleQuickAddTag = (tag: string) => {
    if (file && !fileTags.includes(tag)) {
      addTag(file.id, tag);
      setFileTags(getTags(file.id));
      onTagsChanged();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  const suggestedTags = allTags.filter(tag => !fileTags.includes(tag));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>
            Add or remove tags for "{file?.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Current Tags */}
          <div className="grid gap-2">
            <Label>Current Tags</Label>
            {fileTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {fileTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags yet</p>
            )}
          </div>

          {/* Add New Tag */}
          <div className="grid gap-2">
            <Label htmlFor="new-tag">Add New Tag</Label>
            <div className="flex gap-2">
              <Input
                id="new-tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter tag name"
              />
              <Button onClick={handleAddTag} disabled={!newTag.trim()}>
                Add
              </Button>
            </div>
          </div>

          {/* Suggested Tags */}
          {suggestedTags.length > 0 && (
            <div className="grid gap-2">
              <Label>Suggested Tags</Label>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.slice(0, 10).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleQuickAddTag(tag)}
                  >
                    + {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
