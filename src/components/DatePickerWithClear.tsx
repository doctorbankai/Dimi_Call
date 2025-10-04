import React, { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar as CalendarIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface DatePickerWithClearProps {
  label: string
  value?: string
  onChange: (value: string) => void
  onClear: () => void
}

export const DatePickerWithClear: React.FC<DatePickerWithClearProps> = ({
  label,
  value,
  onChange,
  onClear,
}) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground/80">{label}</Label>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value ? format(new Date(value), "dd MMM yyyy", { locale: fr }) : "Sélectionner"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              locale={fr}
              selected={value ? new Date(value) : undefined}
              onSelect={(date) => {
                if (date) {
                  onChange(format(date, "yyyy-MM-dd"))
                  setOpen(false)
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-10 w-10 hover:bg-destructive/10 hover:text-destructive"
            title="Effacer la date"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
