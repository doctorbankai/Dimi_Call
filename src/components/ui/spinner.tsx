import { LoaderIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps extends React.ComponentProps<'svg'> {}

export function Spinner({ className, ...props }: SpinnerProps) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn('size-4 animate-spin text-current', className)}
      {...props}
    />
  );
}

