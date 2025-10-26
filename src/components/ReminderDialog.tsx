import React, { useState, useEffect } from 'react';
import { Contact } from '../types';
import { DateCalculationService } from '../services/dateCalculationService';
import { RelativeDateSelector } from './RelativeDateSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogPortal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SingleDayPicker } from '@/components/ui/single-day-picker';
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
      // Si aucune date initiale, utiliser la date du jour
      const defaultDate = initialDate || DateCalculationService.getCurrentDateISO();
      
      setState({
        selectedDate: defaultDate,
        selectedTime: initialTime,
        useRelativeSelector: false,
        hasUnsavedChanges: false
      });
      setErrors({});
    }
  }, [isOpen, initialDate, initialTime]);

  // Gérer la sélection via le calendrier shadcn
  const handleCalendarSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Utiliser les méthodes locales pour éviter les problèmes de fuseau horaire
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const iso = `${year}-${month}-${day}`;

    console.log('[ReminderDialog] Date sélectionnée:', {
      dateObject: date,
      isoString: iso,
      year,
      month,
      day
    });

    setState(prev => ({
      ...prev,
      selectedDate: iso,
      useRelativeSelector: false,
      hasUnsavedChanges: true
    }));

    const validation = DateCalculationService.validateDateRange(iso);
    console.log('[ReminderDialog] Validation de la date:', validation);
    
    setErrors(prev => ({
      ...prev,
      date: validation.isValid ? undefined : validation.errorMessage
    }));
  };

  // Valider le formulaire
  const isFormValid = () => {
    const hasDate = state.selectedDate.trim() !== '';
    const hasNoErrors = !errors.date && !errors.time;
    
    // Validation supplémentaire des formats
    const isValidDateFormat = hasDate ? DateCalculationService.isValidDateFormat(state.selectedDate) : false;
    
    // Si l'heure est renseignée, elle doit être valide (accepte format 12h et 24h)
    const hasTime = state.selectedTime.trim() !== '';
    const isValidTimeFormat = DateCalculationService.isValidTimeFormat(state.selectedTime);
    
    // Debug
    console.log('[ReminderDialog] Validation:', {
      hasDate,
      selectedDate: state.selectedDate,
      hasNoErrors,
      isValidDateFormat,
      hasTime,
      selectedTime: state.selectedTime,
      isValidTimeFormat,
      errors,
      result: hasDate && hasNoErrors && isValidDateFormat && isValidTimeFormat
    });
    
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
        newErrors.time = 'Format d\'heure invalide (HH:mm ou h:mm AM/PM)';
      }
      
      setErrors(prev => ({ ...prev, ...newErrors }));
      return;
    }
    
    // Convertir l'heure au format 24h si nécessaire
    const time24h = DateCalculationService.convertTo24Hour(state.selectedTime);
    
    console.log('[ReminderDialog] Sauvegarde:', {
      originalTime: state.selectedTime,
      convertedTime: time24h,
      date: state.selectedDate
    });
    
    onSave(state.selectedDate, time24h);
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
      <DialogPortal>
        <DialogOverlay className="z-[100000] pointer-events-none" />
        <DialogContent 
          ref={dialogContentRef}
          className="sm:max-w-md max-h-[85vh] overflow-y-auto w-[95vw] sm:w-full z-[100001] pointer-events-auto"
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

          {/* Sélection de date et heure */}
          <div className="space-y-4">
            {/* Date et heure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Champ date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Date du rappel
                </label>
                <SingleDayPicker
                  id="reminder-date-picker"
                  placeholder="Sélectionner une date"
                  value={(() => {
                    // Vérifier que la date est valide avant de la parser
                    if (!state.selectedDate || state.selectedDate.trim() === '') {
                      return undefined;
                    }
                    
                    try {
                      // Parser manuellement pour éviter les problèmes de fuseau horaire
                      const parts = state.selectedDate.split('-');
                      if (parts.length !== 3) {
                        return undefined;
                      }
                      
                      const year = parseInt(parts[0], 10);
                      const month = parseInt(parts[1], 10);
                      const day = parseInt(parts[2], 10);
                      
                      // Vérifier que les valeurs sont valides
                      if (isNaN(year) || isNaN(month) || isNaN(day)) {
                        return undefined;
                      }
                      
                      const date = new Date(year, month - 1, day);
                      
                      // Vérifier que la date créée est valide
                      if (isNaN(date.getTime())) {
                        return undefined;
                      }
                      
                      return date;
                    } catch (error) {
                      console.error('[ReminderDialog] Erreur de parsing de date:', error);
                      return undefined;
                    }
                  })()}
                  onSelect={handleCalendarSelect}
                  className={cn("w-full")}
                  container={dialogContentRef.current}
                  zIndex={100002}
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Heure <span className="text-xs text-muted-foreground font-normal">(optionnelle)</span>
                </label>
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
                  zIndex={100002}
                />
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

            {/* Sélection rapide */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-foreground">
                Ou programmer rapidement
              </div>
              
              <RelativeDateSelector
                onDateChange={(newDate: string) => {
                  setState(prev => ({ ...prev, selectedDate: newDate, hasUnsavedChanges: true }));
                  setErrors(prev => ({ ...prev, date: undefined }));
                }}
                onTimeChange={(time: string) => setState(prev => ({ ...prev, selectedTime: time, hasUnsavedChanges: true }))}
                currentDate={state.selectedDate}
                currentTime={state.selectedTime}
                disabled={false}
                portalContainer={dialogContentRef.current}
                zIndex={100002}
              />
            </div>
          </div>

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
      </DialogPortal>
    </Dialog>
  );
};
