import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "HH:mm",
  className,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Generate hours (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => 
    i.toString().padStart(2, '0')
  );

  // Generate minutes (00, 05, 10, ..., 55)
  const minutes = Array.from({ length: 12 }, (_, i) => 
    (i * 5).toString().padStart(2, '0')
  );

  const handleTimeSelect = (hour: string, minute: string) => {
    const timeString = `${hour}:${minute}`;
    onChange(timeString);
    setIsOpen(false);
  };

  const handleHourSelect = (hour: string) => {
    const currentMinute = value ? value.split(':')[1] : '00';
    handleTimeSelect(hour, currentMinute);
  };

  const handleMinuteSelect = (minute: string) => {
    const currentHour = value ? value.split(':')[0] : '00';
    handleTimeSelect(currentHour, minute);
  };

  const currentHour = value ? value.split(':')[0] : '';
  const currentMinute = value ? value.split(':')[1] : '';

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className="h-4 w-4 text-muted-foreground" />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
            id={id}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
          >
            {value || placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium mb-2">Heures</div>
              <ScrollArea className="h-40">
                <div className="grid gap-1">
                  {hours.map((hour) => (
                    <Button
                      key={hour}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "justify-start h-8 text-xs",
                        currentHour === hour && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handleHourSelect(hour)}
                    >
                      {hour}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Minutes</div>
              <ScrollArea className="h-40">
                <div className="grid gap-1">
                  {minutes.map((minute) => (
                    <Button
                      key={minute}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "justify-start h-8 text-xs",
                        currentMinute === minute && "bg-accent text-accent-foreground"
                      )}
                      onClick={() => handleMinuteSelect(minute)}
                    >
                      {minute}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};