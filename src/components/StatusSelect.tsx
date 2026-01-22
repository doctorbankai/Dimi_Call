import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCallMode } from '../context/ModeContext';
import { StatusConfigService } from '../services/statusConfigService';
import { CallMode, ContactStatus } from '../types';

export type StatusValue = ContactStatus | string;

interface StatusSelectProps {
  value?: StatusValue | null;
  onChange: (status: StatusValue) => void;
  placeholder?: string;
  triggerClassName?: string;
  contentClassName?: string;
  size?: 'sm' | 'default';
  displayAsBadge?: boolean;
}

const StatusSelect = React.memo<StatusSelectProps>(({
  value,
  onChange,
  placeholder = 'Statut',
  triggerClassName,
  contentClassName,
  size = 'default',
  displayAsBadge = true,
}) => {
  const { mode } = useCallMode();
  const [internalValue, setInternalValue] = useState<StatusValue | ''>(value || '');

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  const statusOptions = useMemo(() => {
    const baseOptions = StatusConfigService.getStatusList(mode).filter((status) => {
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

  // Normalize display value (DO -> D0, RO -> R0)
  const currentValue = useMemo(() => {
    let v = internalValue || undefined;
    if (v === 'DO') v = ContactStatus.D0;
    if (v === 'RO') v = ContactStatus.R0;
    return v;
  }, [internalValue]);

  return (
    <Select
      value={currentValue}
      onValueChange={handleChange}
    >
      <SelectTrigger
        size={size}
        className={cn(
          'w-fit text-xs flex items-center justify-center',
          '!border-0 !bg-transparent !shadow-none !p-0 !h-auto !min-h-0',
          '!rounded-none !gap-0',
          'hover:!bg-transparent dark:hover:!bg-transparent',
          'focus-visible:!ring-0 focus-visible:!border-0',
          'dark:!bg-transparent dark:hover:!bg-transparent',
          'data-[size=sm]:!h-auto data-[size=default]:!h-auto',
          '[&_svg]:!hidden', // Masque l'icône de chevron
          'min-w-[160px]',
          triggerClassName
        )}
        onPointerDown={(e) => e.stopPropagation()} // ✅ Empêche sélection ligne sans bloquer le dropdown
      >
        {currentValue ? (
          displayAsBadge
            ? renderStatusBadge(currentValue)
            : <span className="text-xs font-medium text-foreground">{StatusConfigService.getLabel(currentValue, mode)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">{placeholder}</span>
        )}
      </SelectTrigger>
      <SelectContent
        position="popper"
        sideOffset={5}
        className={cn('text-xs', contentClassName)}
      >
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
  return (
    prevProps.value === nextProps.value &&
    prevProps.displayAsBadge === nextProps.displayAsBadge &&
    prevProps.triggerClassName === nextProps.triggerClassName &&
    prevProps.contentClassName === nextProps.contentClassName
  );
});

StatusSelect.displayName = 'StatusSelect';

export default StatusSelect;
