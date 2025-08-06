import React, { useState, useEffect, useCallback } from 'react';
import { DateCalculationService, TimeUnit } from '../services/dateCalculationService';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '../lib/utils';

interface RelativeDateSelectorProps {
  onDateChange: (date: string) => void;
  currentDate: string;
  disabled?: boolean;
  className?: string;
}

interface RelativeDateSelectorState {
  quantity: number | '';
  unit: TimeUnit;
}

const TIME_UNITS: { value: TimeUnit; label: string }[] = [
  { value: 'days', label: 'jour(s)' },
  { value: 'weeks', label: 'semaine(s)' },
  { value: 'months', label: 'mois' },
  { value: 'years', label: 'an(s)' }
];

export const RelativeDateSelector: React.FC<RelativeDateSelectorProps> = ({
  onDateChange,
  currentDate,
  disabled = false,
  className
}) => {
  const [state, setState] = useState<RelativeDateSelectorState>({
    quantity: '',
    unit: 'days'
  });
  const [previewText, setPreviewText] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Calculer et mettre à jour la date quand quantity ou unit change
  const calculateAndUpdateDate = useCallback((quantity: number, unit: TimeUnit) => {
    try {
      setError('');
      
      if (!DateCalculationService.isValidQuantity(quantity)) {
        setError('Veuillez saisir un nombre entre 1 et 999');
        setPreviewText('');
        return;
      }

      const calculatedDate = DateCalculationService.calculateFutureDate(quantity, unit);
      const validation = DateCalculationService.validateDateRange(calculatedDate);
      
      if (!validation.isValid) {
        setError(validation.errorMessage || 'Date invalide');
        setPreviewText('');
        return;
      }

      // Générer le texte de prévisualisation
      const preview = DateCalculationService.getPreviewText(quantity, unit);
      const displayDate = DateCalculationService.formatDateForDisplay(calculatedDate);
      setPreviewText(`${preview} (${displayDate})`);
      
      // Notifier le parent du changement de date
      onDateChange(calculatedDate);

      // Afficher un avertissement si nécessaire
      if (validation.warningMessage) {
        setError(validation.warningMessage);
      }
    } catch (err) {
      setError('Erreur lors du calcul de la date');
      setPreviewText('');
    }
  }, [onDateChange]);

  // Gérer le changement de quantité
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    if (value === '') {
      setState(prev => ({ ...prev, quantity: '' }));
      setPreviewText('');
      setError('');
      return;
    }

    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      return; // Ignorer les valeurs non numériques
    }

    setState(prev => ({ ...prev, quantity: numValue }));
    
    if (numValue > 0) {
      calculateAndUpdateDate(numValue, state.unit);
    }
  };

  // Gérer le changement d'unité
  const handleUnitChange = (newUnit: TimeUnit) => {
    setState(prev => ({ ...prev, unit: newUnit }));
    
    if (typeof state.quantity === 'number' && state.quantity > 0) {
      calculateAndUpdateDate(state.quantity, newUnit);
    }
  };

  // Réinitialiser quand currentDate change de l'extérieur (sélection manuelle)
  useEffect(() => {
    // Si la date actuelle ne correspond pas à ce qui serait calculé,
    // réinitialiser les sélecteurs relatifs
    if (typeof state.quantity === 'number' && state.quantity > 0) {
      try {
        const calculatedDate = DateCalculationService.calculateFutureDate(state.quantity, state.unit);
        if (calculatedDate !== currentDate) {
          // Réinitialiser seulement la quantité, préserver l'unité
          setState(prev => ({ ...prev, quantity: '' }));
          setPreviewText('');
          setError('');
        }
      } catch {
        // En cas d'erreur de calcul, réinitialiser seulement la quantité
        setState(prev => ({ ...prev, quantity: '' }));
        setPreviewText('');
        setError('');
      }
    }
  }, [currentDate, state.quantity, state.unit]);

  // Effet pour détecter les changements externes de date (sélection manuelle)
  useEffect(() => {
    // Si currentDate change et qu'on a des valeurs dans les sélecteurs,
    // vérifier si c'est cohérent
    if (currentDate && typeof state.quantity === 'number' && state.quantity > 0) {
      try {
        const expectedDate = DateCalculationService.calculateFutureDate(state.quantity, state.unit);
        if (expectedDate !== currentDate) {
          // La date externe ne correspond pas à notre calcul, réinitialiser seulement la quantité
          setState(prev => ({ ...prev, quantity: '' }));
          setPreviewText('');
          setError('');
        }
      } catch {
        // Erreur de calcul, réinitialiser seulement la quantité
        setState(prev => ({ ...prev, quantity: '' }));
        setPreviewText('');
        setError('');
      }
    } else if (!currentDate) {
      // Si la date externe est effacée, réinitialiser seulement la quantité (garder l'unité)
      setState(prev => ({ ...prev, quantity: '' }));
      setPreviewText('');
      setError('');
    }
  }, [currentDate]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Titre de la section */}
      <div className="text-sm font-medium text-foreground">
        Sélection rapide
      </div>
      
      {/* Sélecteurs */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          Dans
        </span>
        
        <Input
          type="number"
          min="1"
          max="999"
          value={state.quantity}
          onChange={handleQuantityChange}
          placeholder="1"
          disabled={disabled}
          className="w-20 h-9 text-center touch-manipulation"
          aria-label="Quantité pour le calcul de date relative"
          aria-describedby="quantity-help"
          inputMode="numeric"
        />
        
        <Select
          value={state.unit}
          onValueChange={handleUnitChange}
          disabled={disabled}
        >
          <SelectTrigger 
            className="w-32 h-9 touch-manipulation" 
            aria-label="Unité de temps pour le calcul de date relative"
            aria-describedby="unit-help"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_UNITS.map(unit => (
              <SelectItem key={unit.value} value={unit.value}>
                {unit.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Prévisualisation */}
      {previewText && (
        <div 
          className="text-sm text-primary font-medium bg-primary/5 rounded-md px-3 py-2 border border-primary/20"
          role="status"
          aria-live="polite"
          aria-label="Aperçu de la date calculée"
        >
          {previewText}
        </div>
      )}

      {/* Messages d'erreur/avertissement */}
      {error && (
        <div 
          className={cn(
            "text-sm px-3 py-2 rounded-md border",
            error.includes('très éloignée') 
              ? "text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
              : "text-destructive bg-destructive/5 border-destructive/20"
          )}
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}

      {/* Aide contextuelle */}
      <div 
        id="quantity-help" 
        className="text-xs text-muted-foreground"
        role="region"
        aria-label="Aide pour la sélection de date relative"
      >
        Saisissez un nombre entre 1 et 999 et sélectionnez l'unité pour calculer automatiquement la date
      </div>
      <div id="unit-help" className="sr-only">
        Choisissez l'unité de temps : jours, semaines, mois ou années
      </div>
    </div>
  );
};