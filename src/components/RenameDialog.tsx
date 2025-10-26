// Rename Dialog Component

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
import { FileNode } from '@/types/fileManager';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileNode | null;
  onConfirm: (newName: string) => void;
}

export const RenameDialog: React.FC<RenameDialogProps> = ({
  open,
  onOpenChange,
  file,
  onConfirm,
}) => {
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (file) {
      setNewName(file.name);
    }
  }, [file]);

  const handleConfirm = () => {
    if (newName.trim() && newName !== file?.name) {
      onConfirm(newName.trim());
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename {file?.type === 'folder' ? 'Folder' : 'File'}</DialogTitle>
          <DialogDescription>
            Enter a new name for "{file?.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="new-name">New Name</Label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!newName.trim() || newName === file?.name}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
