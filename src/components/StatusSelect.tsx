import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCallMode } from '../context/ModeContext';
import { StatusConfigService } from '../services/statusConfigService';
import { CallMode, ContactStatus } from '../types';

export type StatusValue = ContactStatus;

interface StatusSelectProps {
  value?: StatusValue | null;
  onChange: (status: StatusValue) => void;
  placeholder?: string;
  triggerClassName?: string;
  contentClassName?: string;
  size?: 'sm' | 'default';
}

const StatusSelect = React.memo<StatusSelectProps>(({
  value,
  onChange,
  placeholder = 'Statut',
  triggerClassName,
  contentClassName,
  size = 'default',
}) => {
  const { mode } = useCallMode();
  const [internalValue, setInternalValue] = useState<StatusValue | ''>(value || '');

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  const statusOptions = useMemo(() => {
    const baseOptions = Object.values(ContactStatus).filter((status) => {
      if (!StatusConfigService.isVisible(status, mode)) return false;
      if (status === ContactStatus.A0 && mode !== CallMode.Apporteur) return false;
      return true;
    });

    if (internalValue && !baseOptions.includes(internalValue)) {
      return [internalValue, ...baseOptions];
    }

    return baseOptions;
  }, [internalValue, mode]);

  const renderStatusBadge = useCallback(
    (status: StatusValue) => {
      const { color, dot } = StatusConfigService.getColor(status, mode);
      return (
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
            color
          )}
        >
          <div className={cn('w-1.5 h-1.5 rounded-full', dot)} />
          {StatusConfigService.getLabel(status, mode)}
        </div>
      );
    },
    [mode]
  );

  const handleChange = (newValue: string) => {
    const next = newValue as StatusValue;
    setInternalValue(next);
    onChange(next);
  };

  const currentValue = internalValue || undefined;

  return (
    <Select value={currentValue} onValueChange={handleChange}>
      <SelectTrigger size={size} className={cn('w-fit text-xs flex items-center justify-center', triggerClassName)}>
        {currentValue ? (
          renderStatusBadge(currentValue)
        ) : (
          <span className="text-xs text-muted-foreground">{placeholder}</span>
        )}
      </SelectTrigger>
      <SelectContent className={cn('text-xs', contentClassName)}>
        {statusOptions.map((status) => (
          <SelectItem key={status} value={status} className="text-xs">
            {renderStatusBadge(status)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}, (prevProps, nextProps) => {
  // Only re-render if value changes
  return prevProps.value === nextProps.value;
});

StatusSelect.displayName = 'StatusSelect';

export default StatusSelect;
