import React, { useState, useEffect } from 'react';
import { Contact } from '../types';
import { DateCalculationService } from '../services/dateCalculationService';
import { RelativeDateSelector } from './RelativeDateSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TimePicker } from '@/components/ui/time-picker';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ReminderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  initialDate?: string;
  initialTime?: string;
  onSave: (date: string, time: string) => void;
}

interface ReminderDialogState {
  selectedDate: string;
  selectedTime: string;
  useRelativeSelector: boolean;
  hasUnsavedChanges: boolean;
}

export const ReminderDialog: React.FC<ReminderDialogProps> = ({
  isOpen,
  onClose,
  contact,
  initialDate = '',
  initialTime = '',
  onSave
}) => {
  const dialogContentRef = React.useRef<HTMLDivElement>(null);
  
  const [state, setState] = useState<ReminderDialogState>({
    selectedDate: initialDate,
    selectedTime: initialTime,
    useRelativeSelector: false,
    hasUnsavedChanges: false
  });

  const [errors, setErrors] = useState<{
    date?: string;
    time?: string;
  }>({});

  // Réinitialiser l'état quand le dialog s'ouvre
  useEffect(() => {
    if (isOpen) {
      setState({
        selectedDate: initialDate,
        selectedTime: initialTime,
        useRelativeSelector: false,
        hasUnsavedChanges: false
      });
      setErrors({});
    }
  }, [isOpen, initialDate, initialTime]);

  // Gérer le changement de date manuelle
  const handleManualDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setState(prev => ({
      ...prev,
      selectedDate: newDate,
      useRelativeSelector: false, // Désactiver le mode relatif
      hasUnsavedChanges: true
    }));
    
    // Valider la date
    if (newDate) {
      const validation = DateCalculationService.validateDateRange(newDate);
      setErrors(prev => ({
        ...prev,
        date: validation.isValid ? undefined : validation.errorMessage
      }));
    } else {
      setErrors(prev => ({ ...prev, date: undefined }));
    }
  };

  // Gérer le changement d'heure manuelle
  const handleManualTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setState(prev => ({
      ...prev,
      selectedTime: newTime,
      hasUnsavedChanges: true
    }));
    
    // Valider l'heure
    if (newTime) {
      const isValid = DateCalculationService.isValidTimeFormat(newTime);
      setErrors(prev => ({
        ...prev,
        time: isValid ? undefined : 'Format d\'heure invalide (HH:mm)'
      }));
    } else {
      setErrors(prev => ({ ...prev, time: undefined }));
    }
  };

  // Gérer le changement de date via le sélecteur relatif
  const handleRelativeDateChange = (newDate: string) => {
    setState(prev => ({
      ...prev,
      selectedDate: newDate,
      useRelativeSelector: true, // Activer le mode relatif
      hasUnsavedChanges: true
    }));
    
    // Effacer les erreurs de date puisque le sélecteur relatif valide automatiquement
    setErrors(prev => ({ ...prev, date: undefined }));
  };

  // Valider le formulaire
  const isFormValid = () => {
    const hasDate = state.selectedDate.trim() !== '';
    const hasTime = state.selectedTime.trim() !== '';
    const hasNoErrors = !errors.date && !errors.time;
    
    // Validation supplémentaire des formats
    const isValidDateFormat = hasDate ? DateCalculationService.isValidDateFormat(state.selectedDate) : false;
    const isValidTimeFormat = hasTime ? DateCalculationService.isValidTimeFormat(state.selectedTime) : true; // L'heure est optionnelle
    
    // Seule la date est obligatoire, l'heure est optionnelle
    return hasDate && hasNoErrors && isValidDateFormat && isValidTimeFormat;
  };

  // Gérer la sauvegarde
  const handleSave = () => {
    if (!isFormValid()) {
      // Afficher des erreurs si la validation échoue
      const newErrors: { date?: string; time?: string } = {};
      
      if (!state.selectedDate.trim()) {
        newErrors.date = 'La date est obligatoire';
      } else if (!DateCalculationService.isValidDateFormat(state.selectedDate)) {
        newErrors.date = 'Format de date invalide';
      }
      
      // L'heure est optionnelle, on ne valide que si elle est renseignée
      if (state.selectedTime.trim() && !DateCalculationService.isValidTimeFormat(state.selectedTime)) {
        newErrors.time = 'Format d\'heure invalide (HH:mm)';
      }
      
      setErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }
    
    onSave(state.selectedDate, state.selectedTime);
    onClose();
  };

  // Gérer l'annulation
  const handleCancel = () => {
    onClose();
  };

  // Gérer la fermeture avec la croix
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        ref={dialogContentRef}
        className="sm:max-w-md max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full"
        aria-describedby="reminder-description"
      >
        {/* Header avec bouton de fermeture */}
        <DialogHeader>
          <DialogTitle>Programmer un Rappel</DialogTitle>
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            type="button"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations du contact */}
          <p 
            id="reminder-description"
            className="text-sm text-muted-foreground"
          >
            Contact: <strong>{contact.prenom} {contact.nom}</strong>
          </p>

          {/* Sélection manuelle de date et heure */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-foreground">
              Sélection manuelle
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Champ date */}
              <div className="space-y-1">
                <Input
                  type="date"
                  value={state.selectedDate}
                  onChange={handleManualDateChange}
                  placeholder="YYYY-MM-DD"
                  className={cn(
                    "transition-all duration-200",
                    errors.date && "border-destructive focus:border-destructive"
                  )}
                  aria-label="Date du rappel"
                  aria-describedby={errors.date ? "date-error" : undefined}
                  aria-invalid={!!errors.date}
                />
                {errors.date && (
                  <p 
                    id="date-error"
                    className="text-xs text-destructive"
                    role="alert"
                    aria-live="polite"
                  >
                    {errors.date}
                  </p>
                )}
              </div>

              {/* Champ heure */}
              <div className="space-y-1">
                <div className="relative">
                  <TimePicker
                    value={state.selectedTime}
                    onChange={(time) => setState(prev => ({ ...prev, selectedTime: time, hasUnsavedChanges: true }))}
                    placeholder="HH:mm"
                    className={cn(
                      "transition-all duration-200",
                      errors.time && "border-destructive focus:border-destructive"
                    )}
                    aria-label="Heure du rappel (optionnelle)"
                    aria-describedby={errors.time ? "time-error" : "time-help"}
                    container={dialogContentRef.current}
                  />
                  <span className="absolute -top-2 right-2 text-xs text-muted-foreground bg-background px-1">
                    optionnelle
                  </span>
                </div>
                {errors.time && (
                  <p 
                    id="time-error"
                    className="text-xs text-destructive"
                    role="alert"
                    aria-live="polite"
                  >
                    {errors.time}
                  </p>
                )}
                {!errors.time && (
                  <p 
                    id="time-help"
                    className="text-xs text-muted-foreground"
                  >
                    Laissez vide pour un rappel "toute la journée"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Séparateur visuel */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Sélecteur de date relative */}
          <RelativeDateSelector
            onDateChange={handleRelativeDateChange}
            currentDate={state.selectedDate}
            disabled={false}
          />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="transition-all duration-200 font-medium hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto touch-manipulation"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isFormValid()}
              className="transition-all duration-200 font-medium hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-primary/50 w-full sm:w-auto touch-manipulation"
            >
              Sauvegarder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};