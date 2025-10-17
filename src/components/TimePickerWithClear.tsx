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
}

// Générer les options de temps (intervalles de 15 minutes)
const timeOptions = Array.from({ length: 24 * 4 }, (_, index) => {
  const hour = Math.floor(index / 4)
  const minute = (index % 4) * 15
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
})

export const TimePickerWithClear: React.FC<TimePickerWithClearProps> = ({
  label,
  value,
  onChange,
  onClear,
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground/80">{label}</Label>
      <div className="flex items-center gap-2">
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Sélectionner" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {timeOptions.map((time) => (
              <SelectItem key={time} value={time}>
                {time}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {value && (
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
