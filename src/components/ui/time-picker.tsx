import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  container?: HTMLElement | null; // Conservé pour compatibilité (non utilisé avec le nouveau design)
  zIndex?: number; // Conservé pour compatibilité
  onClear?: () => void;
  stepMinutes?: number;
}

const buildTimeOptions = (stepMinutes: number) => {
  const safeStep = Math.min(Math.max(stepMinutes, 1), 60);
  const slotsPerHour = Math.floor(60 / safeStep);
  return Array.from({ length: 24 * slotsPerHour }, (_, index) => {
    const hour = Math.floor(index / slotsPerHour);
    const minute = (index % slotsPerHour) * safeStep;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });
};

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Sélectionner",
  className,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  onClear,
  stepMinutes = 5,
}) => {
  const normalizedValue = value && value.trim() !== '' ? value : undefined;
  const hasValue = Boolean(normalizedValue);
  const timeOptions = buildTimeOptions(stepMinutes);

  const triggerClasses = cn(
    "flex-1 bg-white text-foreground border-slate-300 dark:bg-slate-900/60 dark:border-slate-600",
    "focus-visible:ring-2 focus-visible:ring-primary/20 shadow-none",
    className
  );

  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <Select
        value={normalizedValue}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger
          className={triggerClasses}
          id={id}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
        >
          <SelectValue placeholder={placeholder}>
            {normalizedValue || placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-60 z-[100002]">
          {timeOptions.map((time) => (
            <SelectItem key={time} value={time}>
              {time}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasValue && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClear}
          className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive"
          title="Effacer l'heure"
          aria-label="Effacer l'heure"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};