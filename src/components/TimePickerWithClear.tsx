import React from 'react'
import { Label } from '@/components/ui/label'
import { TimePicker } from '@/components/ui/time-picker'

interface TimePickerWithClearProps {
  label: string
  value?: string
  onChange: (value: string) => void
  onClear: () => void
  stepMinutes?: number
}

export const TimePickerWithClear: React.FC<TimePickerWithClearProps> = ({
  label,
  value,
  onChange,
  onClear,
  stepMinutes = 5,
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground/80">{label}</Label>
      <TimePicker
        value={value ?? ''}
        onChange={onChange}
        onClear={onClear}
        stepMinutes={stepMinutes}
      />
    </div>
  )
}
