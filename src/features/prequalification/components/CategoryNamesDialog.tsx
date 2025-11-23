import React, { useState, useEffect } from 'react';
import { Settings2, RotateCcw } from 'lucide-react';
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
import { ProspectCategory } from '../types';
import { CATEGORY_ORDER } from '../constants';
import { CategoryNamesService } from '../services/categoryNamesService';

type CategoryNamesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CategoryNamesDialog: React.FC<CategoryNamesDialogProps> = ({ open, onOpenChange }) => {
  const [names, setNames] = useState<Record<ProspectCategory, string>>(() => CategoryNamesService.getAllNames());

  useEffect(() => {
    if (open) {
      setNames(CategoryNamesService.getAllNames());
    }
  }, [open]);

  const handleNameChange = (category: ProspectCategory, value: string) => {
    setNames((prev) => ({ ...prev, [category]: value }));
  };

  const handleSave = () => {
    const customNames: Partial<Record<ProspectCategory, string>> = {};
    const defaultNames: Record<ProspectCategory, string> = {
      [ProspectCategory.Baleine]: 'Baleine',
      [ProspectCategory.Poisson]: 'Poisson',
      [ProspectCategory.Premature]: 'Prématuré',
      [ProspectCategory.Inexploitable]: 'Inexploitable',
      [ProspectCategory.Passer]: 'Passer',
    };
    
    Object.values(ProspectCategory).forEach((category) => {
      const customName = names[category].trim();
      const defaultName = defaultNames[category];
      // Ne sauvegarder que si le nom est différent du nom par défaut
      if (customName && customName !== defaultName) {
        customNames[category] = customName;
      }
    });
    CategoryNamesService.saveCustomNames(customNames);
    onOpenChange(false);
    // Déclencher un événement personnalisé pour notifier les autres composants
    window.dispatchEvent(new Event('categoryNamesChanged'));
  };

  const handleReset = () => {
    CategoryNamesService.resetToDefaults();
    setNames(CategoryNamesService.getAllNames());
    window.dispatchEvent(new Event('categoryNamesChanged'));
  };

  const categoryLabels: Record<ProspectCategory, string> = {
    [ProspectCategory.Baleine]: 'Baleine',
    [ProspectCategory.Poisson]: 'Poisson',
    [ProspectCategory.Premature]: 'Prématuré',
    [ProspectCategory.Inexploitable]: 'Inexploitable',
    [ProspectCategory.Passer]: 'Passer',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Personnaliser les noms des qualifications
          </DialogTitle>
          <DialogDescription>
            Modifiez les noms des catégories de qualification selon vos préférences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {CATEGORY_ORDER.map((category) => (
            <div key={category} className="space-y-2">
              <Label htmlFor={`category-${category}`} className="text-sm font-medium">
                {categoryLabels[category]} (nom par défaut)
              </Label>
              <Input
                id={`category-${category}`}
                value={names[category]}
                onChange={(e) => handleNameChange(category, e.target.value)}
                placeholder={`Nom pour ${categoryLabels[category]}`}
                maxLength={50}
              />
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">
            <RotateCcw className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-initial">
              Annuler
            </Button>
            <Button onClick={handleSave} className="flex-1 sm:flex-initial">
              Enregistrer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

