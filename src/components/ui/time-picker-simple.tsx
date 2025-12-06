import React from 'react';
import { TimePicker } from './time-picker';

interface TimePickerSimpleProps {
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  container?: HTMLElement | null; // Conservé pour compatibilité
  zIndex?: number; // Conservé pour compatibilité
  onClear?: () => void;
  stepMinutes?: number;
}

export const TimePickerSimple: React.FC<TimePickerSimpleProps> = (props) => {
  return (
    <TimePicker
      {...props}
      stepMinutes={props.stepMinutes ?? 5}
    />
  );
};