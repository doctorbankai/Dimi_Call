import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TimePickerWithClearProps {
  label: string
  value?: string
  onChange: (value: string) => void
  onClear: () => void
  stepMinutes?: number
}

// Génère les options HH:mm en fonction d'un pas de minutes
const buildTimeOptions = (stepMinutes: number) => {
  const safeStep = Math.min(Math.max(stepMinutes, 1), 60)
  const slotsPerHour = Math.floor(60 / safeStep)
  return Array.from({ length: 24 * slotsPerHour }, (_, index) => {
    const hour = Math.floor(index / slotsPerHour)
    const minute = (index % slotsPerHour) * safeStep
    return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
  })
}

export const TimePickerWithClear: React.FC<TimePickerWithClearProps> = ({
  label,
  value,
  onChange,
  onClear,
  stepMinutes = 15,
}) => {
  // Normaliser la valeur : undefined, null ou chaîne vide deviennent undefined
  const normalizedValue = value && value.trim() !== '' ? value : undefined;
  
  // Le bouton X ne doit apparaître que si une valeur valide existe
  const hasValue = Boolean(normalizedValue);
  const timeOptions = buildTimeOptions(stepMinutes);
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground/80">{label}</Label>
      <div className="flex items-center gap-2">
        <Select 
          value={normalizedValue} 
          onValueChange={onChange}
        >
          <SelectTrigger className="flex-1 bg-white text-foreground border-slate-300 dark:bg-slate-900/60 dark:border-slate-600 focus-visible:ring-2 focus-visible:ring-primary/20 shadow-none">
            <SelectValue placeholder="Sélectionner">
              {normalizedValue || "Sélectionner"}
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
            onClick={onClear}
            className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive"
            title="Effacer l'heure"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
