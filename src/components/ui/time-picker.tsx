import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChevronDown, X } from 'lucide-react';

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

const HOURS = Array.from({ length: 24 }, (_, index) =>
  index.toString().padStart(2, '0')
);

const clampStep = (step: number) => Math.min(Math.max(step, 1), 60);

const buildMinuteOptions = (stepMinutes: number) => {
  const safeStep = clampStep(stepMinutes);
  const minutes: string[] = [];

  for (let minute = 0; minute < 60; minute += safeStep) {
    minutes.push(minute.toString().padStart(2, '0'));
  }

  return { minutes, safeStep };
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
  container,
  zIndex = 100002,
  onClear,
  stepMinutes = 5,
}) => {
  const normalizedValue = value && value.trim() !== '' ? value : undefined;
  const [open, setOpen] = React.useState(false);
  const [selectedHour, setSelectedHour] = React.useState<string | undefined>();
  const [selectedMinute, setSelectedMinute] = React.useState<string | undefined>();

  const { minutes: minuteOptions, safeStep } = React.useMemo(
    () => buildMinuteOptions(stepMinutes),
    [stepMinutes]
  );

  // Les portails dans un Dialog avec overflow peuvent empêcher le scroll.
  // On ignore le container du Dialog pour garder le popover monté dans le body.
  const portalContainer = React.useMemo<HTMLElement | undefined>(() => {
    if (!container) return undefined;
    if (container.dataset?.slot === "dialog-content") return undefined;
    return container;
  }, [container]);

  const stopScrollPropagation = React.useCallback(
    (event: React.SyntheticEvent) => {
      event.stopPropagation();
    },
    []
  );

  // Synchronise l'état interne avec la valeur contrôlée
  React.useEffect(() => {
    if (normalizedValue && normalizedValue.includes(':')) {
      const [hour, minute] = normalizedValue.split(':');
      setSelectedHour(hour);
      setSelectedMinute(minute);
    } else {
      setSelectedHour(undefined);
      setSelectedMinute(undefined);
    }
  }, [normalizedValue]);

  // Réinitialise la minute si elle n'existe plus dans les options (changement de pas)
  React.useEffect(() => {
    if (selectedMinute && !minuteOptions.includes(selectedMinute)) {
      setSelectedMinute(undefined);
    }
  }, [minuteOptions, selectedMinute]);

  const emitChange = (hour: string, minute: string) => {
    onChange(`${hour}:${minute}`);
    setOpen(false);
  };

  const handleHourSelect = (hour: string) => {
    setSelectedHour(hour);
    if (selectedMinute) {
      emitChange(hour, selectedMinute);
    }
  };

  const handleMinuteSelect = (minute: string) => {
    setSelectedMinute(minute);
    if (selectedHour) {
      emitChange(selectedHour, minute);
    }
  };

  const triggerClasses = cn(
    "flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm",
    "bg-white text-foreground border-slate-300 dark:bg-slate-900/60 dark:border-slate-600",
    "focus-visible:ring-2 focus-visible:ring-primary/20 shadow-none",
    "disabled:cursor-not-allowed disabled:opacity-50",
    className
  );

  const handleClear = () => {
    onChange('');
    onClear?.();
    setSelectedHour(undefined);
    setSelectedMinute(undefined);
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (disabled) return;
    setOpen(nextOpen);
  };

  const displayValue =
    normalizedValue ||
    (selectedHour || selectedMinute
      ? `${selectedHour ?? '--'}:${selectedMinute ?? '--'}`
      : placeholder);

  const isPlaceholder =
    !normalizedValue && !(selectedHour || selectedMinute);

  return (
    <div className="flex items-center gap-2 w-full">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            id={id}
            disabled={disabled}
            className={triggerClasses}
          >
            <span className={cn("flex-1 text-left truncate", isPlaceholder && "text-muted-foreground")}>
              {displayValue}
            </span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-1 w-auto"
          align="start"
          container={portalContainer}
          style={{ zIndex }}
          onWheelCapture={stopScrollPropagation}
          onTouchMoveCapture={stopScrollPropagation}
        >
          <div className="flex gap-1">
            <ScrollArea className="h-48 w-fit overscroll-contain [&_[data-slot='scroll-area-scrollbar']]:hidden">
              <div className="grid grid-cols-1 gap-1 p-1">
                {HOURS.map((hour) => (
                  <Button
                    key={hour}
                    type="button"
                    variant={selectedHour === hour ? "secondary" : "ghost"}
                    size="sm"
                    className="justify-center px-2"
                    onClick={() => handleHourSelect(hour)}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
            </ScrollArea>
            <ScrollArea className="h-48 w-fit overscroll-contain [&_[data-slot='scroll-area-scrollbar']]:hidden">
              <div className="grid grid-cols-1 gap-1 p-1">
                {minuteOptions.map((minute) => (
                  <Button
                    key={minute}
                    type="button"
                    variant={selectedMinute === minute ? "secondary" : "ghost"}
                    size="sm"
                    className="justify-center px-2"
                    onClick={() => handleMinuteSelect(minute)}
                  >
                    {minute}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
      {normalizedValue && (
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