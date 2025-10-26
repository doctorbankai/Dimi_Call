// Attachment Dialog Component

import React, { useState } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { FileNode } from '@/types/fileManager';
import { Contact } from '@/types';

interface AttachmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: FileNode | null;
  type: 'contact' | 'call';
  contacts: Contact[];
  onAttach: (targetId: string) => void;
}

export const AttachmentDialog: React.FC<AttachmentDialogProps> = ({
  open,
  onOpenChange,
  file,
  type,
  contacts,
  onAttach,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Convert contacts to display format
  const items = contacts.map(contact => ({
    id: contact.id,
    name: `${contact.prenom} ${contact.nom}`.trim() || 'Sans nom',
    phone: contact.telephone || 'Pas de téléphone',
  }));

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.phone.includes(searchTerm)
  );

  const handleAttach = () => {
    if (selectedId) {
      onAttach(selectedId);
      setSelectedId(null);
      setSearchTerm('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Attach to {type === 'contact' ? 'Contact' : 'Call'}
          </DialogTitle>
          <DialogDescription>
            Select a {type} to attach "{file?.name}" to
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${type}s...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* List */}
          <ScrollArea className="h-64 border rounded-md">
            <div className="p-2">
              {filteredItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No {type}s found
                </p>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-md cursor-pointer hover:bg-accent ${
                      selectedId === item.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.phone}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAttach} disabled={!selectedId}>
            Attach
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
