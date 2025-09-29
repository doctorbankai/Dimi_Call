import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Palette } from 'lucide-react';

interface TabEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
  currentName: string;
  currentColor: string;
}

const PREDEFINED_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#84cc16', // Lime
  '#ec4899', // Pink
  '#6b7280', // Gray
];

export const TabEditDialog: React.FC<TabEditDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  currentName,
  currentColor,
}) => {
  const [name, setName] = useState(currentName);
  const [color, setColor] = useState(currentColor);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), color);
      onClose();
    }
  };

  const handleClose = () => {
    setName(currentName);
    setColor(currentColor);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Modifier l'onglet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Nom de l'onglet */}
          <div className="space-y-2">
            <Label htmlFor="tab-name">Nom de l'onglet</Label>
            <Input
              id="tab-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de l'onglet"
              className="w-full"
            />
          </div>

          {/* Couleur de l'onglet */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Couleur de l'onglet
            </Label>
            
            {/* Couleurs prédéfinies */}
            <div className="grid grid-cols-5 gap-2">
              {PREDEFINED_COLORS.map((predefinedColor) => (
                <button
                  key={predefinedColor}
                  onClick={() => setColor(predefinedColor)}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    color === predefinedColor 
                      ? 'border-foreground ring-2 ring-primary' 
                      : 'border-border hover:border-foreground/50'
                  }`}
                  style={{ backgroundColor: predefinedColor }}
                  title={predefinedColor}
                />
              ))}
            </div>

            {/* Couleur personnalisée */}
            <div className="flex items-center gap-2">
              <Label htmlFor="custom-color" className="text-sm text-muted-foreground">
                Couleur personnalisée:
              </Label>
              <input
                id="custom-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
            </div>
          </div>

          {/* Aperçu */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">Aperçu:</Label>
            <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
              <span 
                className="inline-block w-3 h-3 rounded-full" 
                style={{ backgroundColor: color }}
              />
              <span className="text-sm font-medium">{name || 'Nom de l\'onglet'}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
