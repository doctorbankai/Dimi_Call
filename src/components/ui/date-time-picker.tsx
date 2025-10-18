"use client"

import * as React from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, Clock } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { ScrollArea } from "./scroll-area"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  zIndex?: number
  container?: HTMLElement | null
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Sélectionner date et heure",
  disabled = false,
  className,
  zIndex = 20100,
  container,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(value)

  // Générer les heures (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0')
  )

  // Générer les minutes (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) => 
    i.toString().padStart(2, '0')
  )

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const newDate = new Date(date)
      if (selectedDate) {
        newDate.setHours(selectedDate.getHours())
        newDate.setMinutes(selectedDate.getMinutes())
      }
      setSelectedDate(newDate)
      onChange?.(newDate)
    }
  }

  const handleHourSelect = (hour: string) => {
    const newDate = selectedDate ? new Date(selectedDate) : new Date()
    newDate.setHours(parseInt(hour))
    setSelectedDate(newDate)
    onChange?.(newDate)
  }

  const handleMinuteSelect = (minute: string) => {
    const newDate = selectedDate ? new Date(selectedDate) : new Date()
    newDate.setMinutes(parseInt(minute))
    setSelectedDate(newDate)
    onChange?.(newDate)
  }

  React.useEffect(() => {
    setSelectedDate(value)
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "PPP 'à' HH:mm", { locale: fr })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start"
        container={container}
        style={{ zIndex }}
      >
        <div className="flex">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
          />
          <div className="border-l flex flex-col">
            <div className="flex items-center justify-center gap-2 p-3 border-b">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {selectedDate ? format(selectedDate, "HH:mm") : "--:--"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3">
              <div>
                <div className="text-xs font-medium mb-2 text-center">Heures</div>
                <ScrollArea className="h-[200px] w-[60px]">
                  <div className="grid gap-1 p-1">
                    {hours.map((hour) => (
                      <Button
                        key={hour}
                        variant={
                          selectedDate && 
                          format(selectedDate, "HH") === hour 
                            ? "default" 
                            : "ghost"
                        }
                        size="sm"
                        className="h-8 text-xs justify-center"
                        onClick={() => handleHourSelect(hour)}
                      >
                        {hour}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div>
                <div className="text-xs font-medium mb-2 text-center">Minutes</div>
                <ScrollArea className="h-[200px] w-[60px]">
                  <div className="grid gap-1 p-1">
                    {minutes.map((minute) => (
                      <Button
                        key={minute}
                        variant={
                          selectedDate && 
                          format(selectedDate, "mm") === minute 
                            ? "default" 
                            : "ghost"
                        }
                        size="sm"
                        className="h-8 text-xs justify-center"
                        onClick={() => handleMinuteSelect(minute)}
                      >
                        {minute}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
